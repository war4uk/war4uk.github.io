#!/usr/bin/env python3
import json
import unittest
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory

import collect_spend


class CollectSpendTest(unittest.TestCase):
    def setUp(self):
        self.original = collect_spend.request_json
        self.calls = []

    def tearDown(self):
        collect_spend.request_json = self.original
        for name in (
            "RAILWAY_TOKEN",
            "OPENAI_ADMIN_KEY",
            "CURSOR_ADMIN_API_KEY",
            "CURSOR_SESSION_TOKEN",
            "RAILWAY_WORKSPACE_ID",
        ):
            collect_spend.os.environ.pop(name, None)

    def test_missing_secrets_do_not_rewrite_snapshot(self):
        for name in (
            "RAILWAY_TOKEN",
            "OPENAI_ADMIN_KEY",
            "CURSOR_ADMIN_API_KEY",
            "CURSOR_SESSION_TOKEN",
            "RAILWAY_WORKSPACE_ID",
        ):
            collect_spend.os.environ.pop(name, None)
        changed, lines = collect_spend.update({"railway": {"weekUsd": 1}}, datetime.now(timezone.utc))
        self.assertFalse(changed)
        self.assertTrue(any("не задан" in line for line in lines))

    def test_railway_invoice_and_memory_share(self):
        token = "railway-token-value"
        collect_spend.os.environ["RAILWAY_TOKEN"] = token

        def fake(url, method="GET", payload=None, headers=None):
            self.calls.append(headers or {})
            query = (payload or {}).get("query") or ""
            if "projects" in query:
                return 200, {"data": {"projects": {"edges": [
                    {"node": {"id": "p1", "name": "sm-tracker", "workspaceId": "w1"}},
                    {"node": {"id": "p2", "name": "vintage", "workspaceId": "w1"}},
                ]}}}
            if "estimatedUsage" in query:
                return 200, {"data": {"estimatedUsage": [
                    {"measurement": "MEMORY_USAGE_GB", "estimatedValue": 1, "projectId": "p1"},
                    {"measurement": "MEMORY_USAGE_GB", "estimatedValue": 3, "projectId": "p2"},
                ]}}
            return 200, {"data": {"workspace": {"customer": {
                "currentUsage": 10,
                "creditBalance": 4,
                "usageLimit": {"softLimit": 25, "hardLimit": 40},
                "billingPeriod": {"start": "2026-11-01T00:00:00Z", "end": "2026-12-01T00:00:00Z"},
            }}}}

        collect_spend.request_json = fake
        billing = collect_spend.collect_railway(token, None, [token], datetime(2026, 11, 7, tzinfo=timezone.utc))
        self.assertEqual(billing["currentUsd"], 10)
        self.assertEqual(billing["softLimitUsd"], 25)
        self.assertEqual(billing["projects"], [
            {"name": "vintage", "usd": 7.5},
            {"name": "sm-tracker", "usd": 2.5},
        ])
        self.assertNotIn(token, json.dumps(billing))
        self.assertTrue(all("Authorization" not in json.dumps(call) for call in [{}]))

    def test_project_name_cannot_carry_the_token(self):
        token = "railway-token-value"
        collect_spend.request_json = lambda url, method="GET", payload=None, headers=None: (
            200,
            {"data": {"projects": {"edges": [
                {"node": {"id": "p1", "name": token, "workspaceId": "w1"}}
            ]}}} if "projects" in (payload or {}).get("query", "") else
            {"data": {"estimatedUsage": [
                {"measurement": "MEMORY_USAGE_GB", "estimatedValue": 2, "projectId": "p1"}
            ]}} if "estimatedUsage" in (payload or {}).get("query", "") else
            {"data": {"workspace": {"customer": {"currentUsage": 5, "creditBalance": 0, "usageLimit": None}}}}
        )
        billing = collect_spend.collect_railway(token, None, [token], datetime(2026, 11, 7, tzinfo=timezone.utc))
        self.assertEqual(billing["projects"][0]["name"], "проект")
        self.assertNotIn(token, json.dumps(billing))

    def test_openai_keeps_current_month_and_spend_limit(self):
        key = "sk-admin-test-value"
        now = datetime(2026, 11, 7, tzinfo=timezone.utc)
        october = int(datetime(2026, 10, 20, tzinfo=timezone.utc).timestamp())
        november = int(datetime(2026, 11, 4, tzinfo=timezone.utc).timestamp())
        month = int(datetime(2026, 11, 1, tzinfo=timezone.utc).timestamp())

        def fake(url, method="GET", payload=None, headers=None):
            if url.endswith("/organization/spend_limit"):
                return 200, {"threshold_amount": 5000, "interval": "month"}
            if "/organization/projects" in url or "group_by=" in url or "/api_keys" in url:
                return 200, {"data": [], "has_more": False}
            self.assertIn(f"start_time={month}", url)
            if "page=" not in url:
                return 200, {"data": [
                    {"start_time": october, "results": [{"amount": {"value": 9}}]},
                    {"start_time": november, "results": [{"amount": {"value": 1.5}}]},
                ], "has_more": True, "next_page": "next-1"}
            return 200, {"data": [{
                "start_time": november,
                "results": [{"amount": {"value": "0.25"}}],
            }], "has_more": False, "next_page": None}

        collect_spend.request_json = fake
        result = collect_spend.collect_openai(key, now)
        self.assertEqual(result["totalUsd"], 1.75)
        self.assertEqual(result["limitUsd"], 50)
        self.assertEqual(result["periodStart"], "2026-11-01")
        self.assertEqual(result["days"], [{"date": "2026-11-04", "usd": 1.75}])
        self.assertNotIn(key, json.dumps(result))

    def test_openai_project_budget_is_the_monthly_limit(self):
        now = datetime(2026, 11, 8, tzinfo=timezone.utc)
        november = int(datetime(2026, 11, 4, tzinfo=timezone.utc).timestamp())

        def fake(url, method="GET", payload=None, headers=None):
            if url.endswith("/organization/spend_limit") or url.endswith("/spend_limit"):
                if url.endswith("/projects/proj_default/spend_limit"):
                    return 200, {"threshold_amount": 1000, "interval": "month"}
                raise collect_spend.ProviderError("HTTP 404")
            if url.endswith("/organization/projects?limit=100"):
                return 200, {"data": [{"id": "proj_default", "name": "Default project"}]}
            if "/api_keys" in url or "group_by=" in url or "/spend_alerts" in url:
                return 200, {"data": [], "has_more": False}
            return 200, {"data": [{
                "start_time": november,
                "results": [{"amount": {"value": 1.93}}],
            }], "has_more": False}

        collect_spend.request_json = fake
        result = collect_spend.collect_openai("sk-admin-test-value", now)
        self.assertEqual(result["totalUsd"], 1.93)
        self.assertEqual(result["limitUsd"], 10)

    def test_openai_alert_threshold_fills_in_when_no_spend_limit(self):
        now = datetime(2026, 11, 8, tzinfo=timezone.utc)

        def fake(url, method="GET", payload=None, headers=None):
            if url.endswith("/spend_limit"):
                raise collect_spend.ProviderError("HTTP 404")
            if url.endswith("/organization/projects?limit=100"):
                return 200, {"data": [{"id": "proj_default", "name": "Default project"}]}
            if url.endswith("/spend_alerts?limit=100"):
                return 200, {"data": [{"threshold_amount": 500}, {"threshold_amount": 1000}]}
            return 200, {"data": [], "has_more": False}

        collect_spend.request_json = fake
        result = collect_spend.collect_openai("sk-admin-test-value", now)
        self.assertEqual(result["limitUsd"], 10)

    def test_cursor_session_converts_cents_and_rejects_cookie_injection(self):
        collect_spend.request_json = lambda url, method="GET", payload=None, headers=None: (200, {
            "billingCycleStart": "1787040553000",
            "billingCycleEnd": "1789718953000",
            "planUsage": {"totalSpend": 1516, "includedSpend": 1516, "limit": 2000},
        })
        result = collect_spend.collect_cursor_session("session-token")
        self.assertEqual(result["spentUsd"], 15.16)
        self.assertEqual(result["limitUsd"], 20)
        self.assertIsNone(result["modelsPercent"])

    def test_cursor_matches_dashboard_quotas(self):
        collect_spend.request_json = lambda url, method="GET", payload=None, headers=None: (200, {
            "billingCycleStart": "1793696910000",
            "billingCycleEnd": "1796288910000",
            "planUsage": {
                "totalSpend": 4678,
                "includedSpend": 2000,
                "limit": 2000,
                "autoPercentUsed": 11.2,
                "apiPercentUsed": 18.4,
            },
            "spendLimitUsage": {"totalSpend": 0, "individualLimit": 1000},
        })
        result = collect_spend.collect_cursor_session("session-token")
        self.assertEqual(result["modelsPercent"], 11.2)
        self.assertEqual(result["otherPercent"], 18.4)
        self.assertEqual(result["onDemandUsd"], 0)
        self.assertEqual(result["onDemandLimitUsd"], 10)
        with self.assertRaises(collect_spend.ProviderError):
            collect_spend.collect_cursor_session("bad;token=evil")

    def test_cursor_admin_sums_money_and_drops_emails(self):
        def fake(url, method="GET", payload=None, headers=None):
            page = (payload or {}).get("page")
            if page == 1:
                return 200, {
                    "totalPages": 2,
                    "subscriptionCycleStart": 1708992000000,
                    "teamMemberSpend": [{
                        "email": "person@example.com",
                        "name": "Alex",
                        "overallSpendCents": 150,
                    }],
                }
            return 200, {
                "totalPages": 2,
                "teamMemberSpend": [{"overallSpendCents": 50, "email": "other@example.com"}],
            }

        collect_spend.request_json = fake
        result = collect_spend.collect_cursor_admin("admin-key")
        self.assertEqual(result["spentUsd"], 2)
        blob = json.dumps(result)
        self.assertNotIn("example.com", blob)
        self.assertNotIn("Alex", blob)

    def test_output_refuses_a_leaked_secret(self):
        with self.assertRaises(collect_spend.ProviderError):
            collect_spend.assert_safe('{"note": "sk-admin-test-value"}', ["sk-admin-test-value"])

    def test_main_writes_only_safe_snapshot(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "data.json"
            path.write_text(json.dumps({"openai": {"projects": ["vintage"], "absent": []}}), encoding="utf-8")
            collect_spend.os.environ["OPENAI_ADMIN_KEY"] = "sk-admin-test-value"
            collect_spend.os.environ.pop("RAILWAY_TOKEN", None)
            collect_spend.os.environ.pop("CURSOR_ADMIN_API_KEY", None)
            collect_spend.os.environ.pop("CURSOR_SESSION_TOKEN", None)
            collect_spend.DATA_PATH = path
            stamp = int(datetime.now(timezone.utc).replace(day=3, hour=0, minute=0, second=0, microsecond=0).timestamp())
            collect_spend.request_json = lambda url, method="GET", payload=None, headers=None: (
                (200, {"threshold_amount": 2000}) if url.endswith("/organization/spend_limit") else (200, {
                    "data": [{
                        "start_time": stamp,
                        "results": [{"amount": {"value": 0.4}}],
                    }],
                    "has_more": False,
                })
            )
            self.assertEqual(collect_spend.main(), 0)
            written = path.read_text(encoding="utf-8")
            self.assertNotIn("sk-admin-test-value", written)
            saved = json.loads(written)
            self.assertEqual(saved["openai"]["totalUsd"], 0.4)
            self.assertEqual(saved["openai"]["projects"], ["vintage"])
            self.assertEqual(saved["updatedBy"], "github-actions")


class ProjectMonthsTest(unittest.TestCase):
    def test_usage_rows_become_dollars_by_project(self):
        costs = collect_spend.cost_usage_rows([
            {"measurement": "CPU_USAGE", "value": 0.1, "tags": {"projectId": "p1"}},
            {"measurement": "MEMORY_USAGE_GB", "value": 0.2, "tags": {"projectId": "p1"}},
            {"measurement": "NETWORK_TX_GB", "value": 2, "tags": {"project_id": "p2"}},
        ])
        self.assertAlmostEqual(costs["p1"], 0.1 * 0.00000772 * 60 + 0.2 * 0.00000386 * 60)
        self.assertAlmostEqual(costs["p2"], 0.1)

    def test_active_openai_key_names_map_to_railway_projects(self):
        catalog = [
            {"name": "generous-kindness", "services": ["42bot"]},
            {"name": "sm-tracker", "services": ["pipeline"]},
            {"name": "vintage", "services": ["web"]},
        ]
        self.assertEqual(collect_spend.match_api_key("42 bot api key", catalog), "generous-kindness")
        self.assertEqual(collect_spend.match_api_key("42bot API key", catalog), "generous-kindness")
        self.assertEqual(collect_spend.match_api_key("Trump review railway", catalog), "sm-tracker")
        self.assertEqual(collect_spend.match_api_key("trump_review_railway", catalog), "sm-tracker")
        self.assertEqual(collect_spend.match_api_key("Vintage api key", catalog), "vintage")
        self.assertEqual(collect_spend.match_api_key("test agent workflow", catalog), "test agent workflow")

    def test_recent_openai_cost_lands_on_the_matching_service(self):
        services = [
            {"project": "generous-kindness", "service": "42bot"},
            {"project": "generous-kindness", "service": "Postgres"},
            {"project": "sm-tracker", "service": "pipeline"},
            {"project": "vintage", "service": "web"},
        ]
        catalog = [{"name": service["project"], "services": [service["service"]]} for service in services]
        rows = collect_spend.service_window_costs(
            {"k1": 0.5, "k2": 0.2},
            {"k1": 0.1},
            {"k1": "42 bot api key", "k2": "Vintage api key"},
            services,
            catalog,
        )
        by_service = {(row["project"], row["service"]): row for row in rows}
        self.assertEqual(by_service[("generous-kindness", "42bot")]["week"], 0.5)
        self.assertEqual(by_service[("generous-kindness", "42bot")]["day"], 0.1)
        self.assertEqual(by_service[("vintage", "web")]["week"], 0.2)
        self.assertNotIn(("generous-kindness", "Postgres"), by_service)

    def test_openai_service_name_maps_onto_railway_project(self):
        catalog = [
            {"name": "generous-kindness", "services": ["42bot", "Postgres"]},
            {"name": "sm-tracker", "services": ["pipeline", "web"]},
        ]
        self.assertEqual(collect_spend.match_project_name("42bot", catalog), "generous-kindness")
        self.assertEqual(collect_spend.match_project_name("sm-tracker", catalog), "sm-tracker")

    def test_project_spend_splits_railway_and_openai(self):
        rows = collect_spend.build_project_spend(
            {"current": {"vintage": 1}, "previous": {"vintage": 3}},
            {"current": {"vintage": 0.5, "42bot": 0.2}, "previous": {"vintage": 1}},
        )
        vintage = rows[0]
        self.assertEqual(vintage["name"], "vintage")
        self.assertEqual(vintage["current"], 1.5)
        self.assertEqual(vintage["previous"], 4)
        self.assertEqual(vintage["railway"]["current"], 1)
        self.assertEqual(vintage["openai"]["previous"], 1)


if __name__ == "__main__":
    unittest.main()
