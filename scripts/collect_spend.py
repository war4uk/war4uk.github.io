#!/usr/bin/env python3
"""Pull billing totals and write public aggregates to spend/data.json.

Secrets come from the environment (GitHub Actions secrets). They are never
printed and the output is refused if a secret value appears in it.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = Path(os.environ.get("SPEND_DATA", ROOT / "spend" / "data.json"))
RAILWAY_URL = "https://backboard.railway.com/graphql/v2"
OPENAI_COSTS = "https://api.openai.com/v1/organization/costs"
CURSOR_PERIOD = "https://cursor.com/api/dashboard/get-current-period-usage"
CURSOR_SPEND = "https://api.cursor.com/teams/spend"
USER_AGENT = "Mozilla/5.0 (spend-snapshot)"
MONTHS = "января февраля марта апреля мая июня июля августа сентября октября ноября декабря".split()
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
FORBIDDEN = re.compile(
    r"(sk-[A-Za-z0-9]|ghp_|github_pat_|AKIA|postgres://|Bearer |WorkosCursorSessionToken|x-access-token)",
    re.IGNORECASE,
)


class ProviderError(Exception):
    pass


def secret(name: str) -> str | None:
    value = os.environ.get(name, "").strip()
    return value or None


def redact(text: str, secrets: list[str]) -> str:
    cleaned = str(text)
    for value in secrets:
        if value:
            cleaned = cleaned.replace(value, "[secret]")
    cleaned = EMAIL.sub("[email]", cleaned)
    cleaned = FORBIDDEN.sub("[secret]", cleaned)
    return cleaned[:180]


def public_name(name: object, secrets: list[str]) -> str:
    text = re.sub(r"[\x00-\x1f]", "", str(name or ""))[:80].strip()
    if not text or EMAIL.search(text) or FORBIDDEN.search(text) or any(value and value in text for value in secrets):
        return "проект"
    return text


def request_json(url: str, method: str = "GET", payload: dict | None = None, headers: dict | None = None):
    data = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("User-Agent", USER_AGENT)
    request.add_header("Accept", "application/json")
    for key, value in (headers or {}).items():
        request.add_header(key, value)
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            raise ProviderError(f"HTTP {code}")

    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=30) as response:
            raw = response.read(2_000_000)
            status = response.status
    except ProviderError:
        raise
    except urllib.error.HTTPError as error:
        error.read(20_000)
        raise ProviderError(f"HTTP {error.code}") from None
    except urllib.error.URLError:
        raise ProviderError("сеть недоступна") from None
    try:
        body = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ProviderError(f"HTTP {status}, ответ не JSON") from None
    return status, body


def graphql(token: str, query: str, variables: dict | None = None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    status, body = request_json(
        RAILWAY_URL,
        method="POST",
        payload=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    if status != 200 or not isinstance(body, dict):
        raise ProviderError(f"Railway HTTP {status}")
    errors = []
    for item in body.get("errors") or []:
        message = item.get("message") if isinstance(item, dict) else str(item)
        errors.append(redact(message, [token]))
    return body.get("data") or {}, errors


def railway_projects(token: str):
    data, errors = graphql(token, "{ projects { edges { node { id name workspaceId } } } }")
    if errors and not data:
        raise ProviderError(errors[0])
    edges = ((data.get("projects") or {}).get("edges")) or []
    projects = []
    for edge in edges:
        node = (edge or {}).get("node") or {}
        if node.get("id") and node.get("workspaceId"):
            projects.append(node)
    return projects


def railway_customer(token: str, workspace_id: str):
    full = """
    query ($id: String!) {
      workspace(workspaceId: $id) {
        customer {
          currentUsage
          creditBalance
          usageLimit { hardLimit softLimit }
          billingPeriod { start end }
        }
      }
    }
    """
    short = """
    query ($id: String!) {
      workspace(workspaceId: $id) {
        customer {
          currentUsage
          creditBalance
          usageLimit { hardLimit softLimit }
        }
      }
    }
    """
    data, errors = graphql(token, full, {"id": workspace_id})
    if errors and any("billingPeriod" in error for error in errors):
        data, errors = graphql(token, short, {"id": workspace_id})
    if errors and not data:
        raise ProviderError(errors[0])
    customer = ((data.get("workspace") or {}).get("customer")) or None
    if customer is None:
        raise ProviderError("Railway не отдал счёт воркспейса")
    return customer


def railway_memory(token: str, workspace_id: str):
    query = """
    query ($id: String!) {
      estimatedUsage(workspaceId: $id, measurements: [MEMORY_USAGE_GB]) {
        measurement
        estimatedValue
        projectId
      }
    }
    """
    data, errors = graphql(token, query, {"id": workspace_id})
    if errors:
        return []
    return data.get("estimatedUsage") or []


def number(value):
    if value is None or isinstance(value, bool):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def collect_railway(token: str, workspace_id: str | None, secrets: list[str]):
    projects = railway_projects(token)
    names = {project["id"]: public_name(project.get("name"), secrets) for project in projects}
    workspaces = []
    if workspace_id:
        workspaces = [workspace_id]
    else:
        workspaces = list(dict.fromkeys(project["workspaceId"] for project in projects))
    if not workspaces:
        raise ProviderError("Railway не показал ни одного воркспейса")

    current = 0.0
    credit = 0.0
    soft = None
    hard = None
    period = None
    allocated: dict[str, float] = {}
    for workspace in workspaces:
        customer = railway_customer(token, workspace)
        usage = number(customer.get("currentUsage")) or 0.0
        current += usage
        credit += number(customer.get("creditBalance")) or 0.0
        limit = customer.get("usageLimit") or {}
        if soft is None:
            soft = number(limit.get("softLimit"))
        if hard is None:
            hard = number(limit.get("hardLimit"))
        if period is None and isinstance(customer.get("billingPeriod"), dict):
            start = customer["billingPeriod"].get("start")
            end = customer["billingPeriod"].get("end")
            if isinstance(start, (str, int, float)) and isinstance(end, (str, int, float)):
                period = {"start": start, "end": end}
        memory = {}
        for row in railway_memory(token, workspace):
            if row.get("measurement") != "MEMORY_USAGE_GB":
                continue
            name = names.get(row.get("projectId")) or "проект"
            memory[name] = memory.get(name, 0.0) + (number(row.get("estimatedValue")) or 0.0)
        memory_total = sum(memory.values())
        if usage and memory_total > 0:
            for name, value in memory.items():
                allocated[name] = allocated.get(name, 0.0) + usage * value / memory_total

    target = None
    target_label = "лимит в Railway не задан, шкала $20"
    if soft and soft > 0:
        target = soft
        target_label = "лимита"
    elif hard and hard > 0:
        target = hard
        target_label = "лимита"
    else:
        target = 20.0
        target_label = "$20"
    percent = (current / target * 100) if target else None
    detail = "за период"
    if percent is not None:
        detail += f", {percent:.0f}% от {target_label}"
    billing = {
        "status": "invoice",
        "source": "customer.currentUsage",
        "currentUsd": round(current, 4),
        "creditBalanceUsd": round(credit, 4),
        "softLimitUsd": soft,
        "hardLimitUsd": hard,
        "progressTargetUsd": target,
        "detail": detail,
        "period": period,
    }
    if allocated:
        billing["allocation"] = "memory-share"
        billing["projects"] = [
            {"name": name, "usd": round(amount, 4)}
            for name, amount in sorted(allocated.items(), key=lambda item: item[1], reverse=True)
        ]
    return billing


def period_start(now: datetime) -> datetime:
    current = now.astimezone(timezone.utc)
    return current.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def openai_limit_usd(key: str):
    try:
        status, body = request_json(
            "https://api.openai.com/v1/organization/spend_limit",
            headers={"Authorization": f"Bearer {key}"},
        )
    except ProviderError as error:
        if str(error).startswith("HTTP 404"):
            return None
        raise
    if status != 200 or not isinstance(body, dict):
        return None
    cents = number(body.get("threshold_amount"))
    if cents is None:
        return None
    return round(cents / 100, 4)


def collect_openai(key: str, now: datetime):
    start = period_start(now)
    limit = openai_limit_usd(key)
    page = None
    totals: dict[str, float] = {}
    for _ in range(12):
        query = f"start_time={int(start.timestamp())}&bucket_width=1d&limit=31"
        if page:
            query += "&page=" + urllib.parse.quote(page)
        status, body = request_json(
            OPENAI_COSTS + "?" + query,
            headers={"Authorization": f"Bearer {key}"},
        )
        if status != 200 or not isinstance(body, dict):
            raise ProviderError(f"OpenAI HTTP {status}")
        for bucket in body.get("data") or []:
            stamp = bucket.get("start_time")
            if stamp is None:
                continue
            day = datetime.fromtimestamp(int(stamp), tz=timezone.utc).date().isoformat()
            if day < start.date().isoformat():
                continue
            amount = 0.0
            for result in bucket.get("results") or []:
                value = number(((result or {}).get("amount") or {}).get("value"))
                if value is not None:
                    amount += value
            totals[day] = totals.get(day, 0.0) + amount
        if not body.get("has_more") or not body.get("next_page"):
            break
        page = str(body["next_page"])
    days = [{"date": day, "usd": round(amount, 4)} for day, amount in sorted(totals.items())]
    total = round(sum(item["usd"] for item in days), 4)
    return {
        "status": "invoice",
        "source": "organization.costs",
        "totalUsd": total,
        "limitUsd": limit,
        "periodStart": start.date().isoformat(),
        "days": days,
        "detail": "за период",
    }


def cents_to_usd(value):
    amount = number(value)
    if amount is None:
        return None
    return round(amount / 100, 4)


def collect_cursor_admin(key: str):
    spent = 0.0
    page = 1
    cycle_start = None
    total_pages = 1
    while page <= total_pages and page <= 20:
        status, body = request_json(
            CURSOR_SPEND,
            method="POST",
            payload={"page": page, "pageSize": 100, "sortBy": "amount"},
            headers={
                "Authorization": "Basic " + __import__("base64").b64encode(f"{key}:".encode()).decode(),
                "Content-Type": "application/json",
            },
        )
        if status != 200 or not isinstance(body, dict):
            raise ProviderError(f"Cursor HTTP {status}")
        cycle_start = cycle_start or body.get("subscriptionCycleStart")
        total_pages = int(body.get("totalPages") or 1)
        for member in body.get("teamMemberSpend") or []:
            overall = number(member.get("overallSpendCents"))
            if overall is None:
                overall = (number(member.get("spendCents")) or 0) + (number(member.get("includedSpendCents")) or 0)
            spent += overall
        page += 1
    return {
        "status": "invoice",
        "source": "admin.teams.spend",
        "spentUsd": round(spent / 100, 4),
        "limitUsd": None,
        "includedUsd": None,
        "percent": None,
        "cycleStart": cycle_start,
        "detail": "за период",
    }


def collect_cursor_session(token: str):
    if any(char in token for char in "\r\n;"):
        raise ProviderError("Cursor session token отклонён")
    status, body = request_json(
        CURSOR_PERIOD,
        method="POST",
        payload={},
        headers={
            "Content-Type": "application/json",
            "Origin": "https://cursor.com",
            "Cookie": f"WorkosCursorSessionToken={token}",
        },
    )
    if status != 200 or not isinstance(body, dict):
        raise ProviderError(f"Cursor HTTP {status}")
    plan = body.get("planUsage") or {}
    total = cents_to_usd(plan.get("totalSpend"))
    included = cents_to_usd(plan.get("includedSpend"))
    bonus = cents_to_usd(plan.get("bonusSpend"))
    limit = cents_to_usd(plan.get("limit"))
    if included is None:
        included = total
    if included is None:
        raise ProviderError("Cursor не отдал сумму периода")
    on_demand = body.get("spendLimitUsage") or {}
    on_demand_spent = cents_to_usd(on_demand.get("totalSpend"))
    on_demand_limit = cents_to_usd(
        on_demand.get("individualLimit") if on_demand.get("individualLimit") is not None else on_demand.get("pooledLimit")
    )
    percent = round(included / limit * 100, 1) if limit else None
    detail = "за период"
    if percent is not None and limit is not None:
        detail = f"{percent:.0f}% от ${limit:.0f}"
    return {
        "status": "invoice",
        "source": "dashboard.current-period",
        "spentUsd": included,
        "totalUsd": total,
        "includedUsd": included,
        "bonusUsd": bonus,
        "onDemandUsd": on_demand_spent,
        "onDemandLimitUsd": on_demand_limit,
        "limitUsd": limit,
        "percent": percent,
        "cycleStart": body.get("billingCycleStart"),
        "cycleEnd": body.get("billingCycleEnd"),
        "detail": detail,
    }


def format_tbilisi(moment: datetime) -> str:
    local = moment.astimezone(ZoneInfo("Asia/Tbilisi"))
    return f"{local.day} {MONTHS[local.month - 1]} {local.year}, {local:%H:%M} (Тбилиси)"


def assert_safe(text: str, secrets: list[str]):
    for value in secrets:
        if value and value in text:
            raise ProviderError("отказ записи: в итоге оказался секрет")
    if FORBIDDEN.search(text):
        raise ProviderError("отказ записи: в итоге оказался секрет")


def update(data: dict, now: datetime):
    secrets = [value for value in (
        secret("RAILWAY_TOKEN"),
        secret("OPENAI_ADMIN_KEY"),
        secret("CURSOR_ADMIN_API_KEY"),
        secret("CURSOR_SESSION_TOKEN"),
        secret("RAILWAY_WORKSPACE_ID"),
    ) if value]
    changed = False
    lines = []

    railway_token = secret("RAILWAY_TOKEN")
    if railway_token:
        try:
            data.setdefault("railway", {})["billing"] = collect_railway(
                railway_token, secret("RAILWAY_WORKSPACE_ID"), secrets
            )
            data["railway"].pop("lastError", None)
            lines.append(f"railway: ${data['railway']['billing']['currentUsd']:.2f}")
        except ProviderError as error:
            data.setdefault("railway", {})["lastError"] = redact(error, secrets)
            lines.append(f"railway: {data['railway']['lastError']}")
        changed = True
    else:
        lines.append("railway: секрет RAILWAY_TOKEN не задан")

    openai_key = secret("OPENAI_ADMIN_KEY")
    if openai_key:
        try:
            fresh = collect_openai(openai_key, now)
            previous = data.get("openai") or {}
            fresh["projects"] = previous.get("projects") or []
            fresh["absent"] = previous.get("absent") or []
            data["openai"] = fresh
            lines.append(f"openai: ${fresh['totalUsd']:.2f}")
        except ProviderError as error:
            data.setdefault("openai", {})["lastError"] = redact(error, secrets)
            lines.append(f"openai: {data['openai']['lastError']}")
        changed = True
    else:
        lines.append("openai: секрет OPENAI_ADMIN_KEY не задан")

    cursor_admin = secret("CURSOR_ADMIN_API_KEY")
    cursor_session = secret("CURSOR_SESSION_TOKEN")
    if cursor_admin or cursor_session:
        try:
            data["cursor"] = collect_cursor_admin(cursor_admin) if cursor_admin else collect_cursor_session(cursor_session)
            lines.append(f"cursor: ${data['cursor']['spentUsd']:.2f}")
        except ProviderError as error:
            data.setdefault("cursor", {})["lastError"] = redact(error, secrets)
            lines.append(f"cursor: {data['cursor']['lastError']}")
        changed = True
    else:
        lines.append("cursor: секрет CURSOR_SESSION_TOKEN или CURSOR_ADMIN_API_KEY не задан")

    if changed:
        data["generatedAt"] = now.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        data["displayTime"] = format_tbilisi(now)
        data["updatedBy"] = "github-actions"
    return changed, lines


def main():
    now = datetime.now(timezone.utc)
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    changed, lines = update(data, now)
    for line in lines:
        print(line)
    if not changed:
        return 0
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    secrets = [secret(name) or "" for name in (
        "RAILWAY_TOKEN", "OPENAI_ADMIN_KEY", "CURSOR_ADMIN_API_KEY", "CURSOR_SESSION_TOKEN"
    )]
    assert_safe(text, secrets)
    DATA_PATH.write_text(text, encoding="utf-8")
    print(f"wrote {DATA_PATH}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ProviderError as error:
        print(redact(error, [secret(name) or "" for name in (
            "RAILWAY_TOKEN", "OPENAI_ADMIN_KEY", "CURSOR_ADMIN_API_KEY", "CURSOR_SESSION_TOKEN"
        )]))
        sys.exit(1)
