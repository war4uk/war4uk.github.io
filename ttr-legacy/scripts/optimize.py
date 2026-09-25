#!/usr/bin/env python3
"""Optimize destination-ticket scores for a train budget.

The network cost of a ticket set is the length of a Steiner forest:
each kept ticket's two cities must be in the same connected component
of claimed routes. We build that forest by incrementally adding a
shortest path in the residual graph (existing claimed edges cost 0).
"""

from __future__ import annotations

import heapq
import itertools
import json
import math
from collections import defaultdict
from pathlib import Path

from map_data import CITIES, ROUTES, TICKETS, YEARS, REGIONS, build_payload, route_id


def build_graph(region_ids: set[str]):
    cities = {n for n, m in CITIES.items() if m["region"] in region_ids}
    adj = defaultdict(list)
    routes = {}
    for a, b, length, region, tracks in ROUTES:
        if region not in region_ids:
            continue
        if a not in cities or b not in cities:
            continue
        rid = route_id(a, b)
        routes[rid] = {"a": a, "b": b, "length": length, "region": region, "tracks": tracks}
        adj[a].append((b, length, rid))
        adj[b].append((a, length, rid))
    return cities, adj, routes


def dijkstra(adj, src, dst, free_edges: set[str] | None = None):
    if src == dst:
        return 0, []
    free_edges = free_edges or set()
    heap = [(0, src)]
    best = {src: 0}
    prev = {}
    while heap:
        dist, node = heapq.heappop(heap)
        if dist != best.get(node, 10**9):
            continue
        if node == dst:
            break
        for nxt, length, rid in adj.get(node, []):
            step = 0 if rid in free_edges else length
            nd = dist + step
            if nd < best.get(nxt, 10**9):
                best[nxt] = nd
                prev[nxt] = (node, rid)
                heapq.heappush(heap, (nd, nxt))
    if dst not in best:
        return None, None
    path = []
    cur = dst
    while cur != src:
        node, rid = prev[cur]
        path.append(rid)
        cur = node
    path.reverse()
    return best[dst], path


def all_pairs_sp(adj, cities):
    dist = {}
    for src in cities:
        heap = [(0, src)]
        best = {src: 0}
        while heap:
            d, node = heapq.heappop(heap)
            if d != best.get(node, 10**9):
                continue
            for nxt, length, _rid in adj.get(node, []):
                nd = d + length
                if nd < best.get(nxt, 10**9):
                    best[nxt] = nd
                    heapq.heappush(heap, (nd, nxt))
        dist[src] = best
    return dist


def forest_for_tickets(adj, tickets):
    """Return (cost, claimed_route_ids) for a ticket list."""
    claimed = set()
    total = 0
    for t in tickets:
        extra, path = dijkstra(adj, t["a"], t["b"], claimed)
        if extra is None:
            return None, None
        total += extra
        claimed.update(path)
    return total, sorted(claimed)


def available_tickets(region_ids, cities, dist):
    out = []
    for code, region, a, b, value in TICKETS:
        if region not in region_ids:
            continue
        if a not in cities or b not in cities:
            continue
        sp = dist.get(a, {}).get(b)
        if sp is None:
            continue
        out.append({
            "id": code,
            "region": region,
            "a": a,
            "b": b,
            "value": value,
            "sp": sp,
            "ratio": value / sp if sp else value,
        })
    return out


def _orders(tickets):
    by_ratio = sorted(tickets, key=lambda t: (-t["ratio"], -t["value"], t["sp"]))
    by_value = sorted(tickets, key=lambda t: (-t["value"], t["sp"]))
    by_sp = sorted(tickets, key=lambda t: (t["sp"], -t["value"]))
    return (by_ratio, by_value, by_sp, list(reversed(by_ratio)), tickets)


def min_forest(adj, tickets, trains):
    """Cheapest residual-SP forest over a few orders, then all perms if needed."""
    best_cost, best_claimed = None, None
    seen = set()

    def consider(order):
        nonlocal best_cost, best_claimed
        key = tuple(t["id"] for t in order)
        if key in seen:
            return
        seen.add(key)
        cost, claimed = forest_for_tickets(adj, order)
        if cost is None:
            return
        if best_cost is None or cost < best_cost:
            best_cost, best_claimed = cost, claimed

    for order in _orders(tickets):
        consider(order)
    if len(tickets) <= 4 or (len(tickets) == 5 and (best_cost is None or best_cost > trains)):
        for order in itertools.permutations(tickets):
            consider(order)
            if best_cost is not None and best_cost <= trains and len(tickets) == 5:
                break
    return best_cost, best_claimed


def optimize(tickets, adj, trains, min_keep, max_keep):
    tickets = [t for t in tickets if t["sp"] <= trains]
    tickets.sort(key=lambda t: (-t["ratio"], -t["value"], t["sp"]))
    n = len(tickets)
    best = {"value": -1, "cost": 0, "tickets": [], "routes": []}
    max_keep = min(max_keep, n)
    if n == 0 or max_keep < min_keep:
        return best

    combo_limit = 80_000
    enum_size = sum(
        math.comb(n, k) for k in range(min_keep, max_keep + 1)
    )
    use_exact = n <= 36 and max_keep <= 5 and enum_size <= combo_limit
    if not use_exact:
        return _greedy(tickets, adj, trains, min_keep, max_keep)

    combos = []
    for k in range(min_keep, max_keep + 1):
        for chosen in itertools.combinations(tickets, k):
            combos.append((sum(t["value"] for t in chosen), chosen))
    combos.sort(key=lambda row: (-row[0], len(row[1])))

    for value, chosen in combos:
        if value < best["value"]:
            break
        if max(t["sp"] for t in chosen) > trains:
            continue
        cost, claimed = min_forest(adj, list(chosen), trains)
        if cost is None or cost > trains:
            continue
        if value > best["value"] or (value == best["value"] and cost < best["cost"]):
            best["value"] = value
            best["cost"] = cost
            best["tickets"] = list(chosen)
            best["routes"] = claimed
    return best


def _greedy(tickets, adj, trains, min_keep, max_keep):
    claimed = set()
    cost = 0
    chosen = []
    used = set()
    while len(chosen) < max_keep:
        best_add = None
        for t in tickets:
            if t["id"] in used:
                continue
            extra, path = dijkstra(adj, t["a"], t["b"], claimed)
            if extra is None or cost + extra > trains:
                continue
            score = (t["value"] + 0.05) / (extra + 0.35)
            if best_add is None or score > best_add[0]:
                best_add = (score, t, extra, path)
        if best_add is None:
            break
        _, t, extra, path = best_add
        chosen.append(t)
        used.add(t["id"])
        claimed.update(path)
        cost += extra
    if len(chosen) < min_keep:
        return {"value": -1, "cost": 0, "tickets": [], "routes": []}
    cost, claimed = min_forest(adj, chosen, trains) if len(chosen) <= 6 else forest_for_tickets(adj, chosen)
    if cost is None:
        cost, claimed = forest_for_tickets(adj, chosen)
    # 0-cost extras
    if claimed is None:
        claimed = set()
        cost = 0
    used = {t["id"] for t in chosen}
    for t in sorted(tickets, key=lambda x: -x["value"]):
        if t["id"] in used or len(chosen) >= max_keep:
            continue
        extra, path = dijkstra(adj, t["a"], t["b"], claimed)
        if extra == 0:
            chosen.append(t)
            used.add(t["id"])
    return {
        "value": sum(t["value"] for t in chosen),
        "cost": cost,
        "tickets": chosen,
        "routes": sorted(claimed) if claimed is not None else [],
    }


def solve(region_ids, trains, min_keep, max_keep):
    cities, adj, routes = build_graph(region_ids)
    dist = all_pairs_sp(adj, cities)
    tickets = available_tickets(region_ids, cities, dist)
    result = optimize(tickets, adj, trains, min_keep, max_keep)
    ticket_out = []
    for t in result["tickets"]:
        ticket_out.append({k: t[k] for k in ("id", "a", "b", "value", "sp", "region")})
    route_out = [routes[rid] | {"id": rid} for rid in result["routes"] if rid in routes]
    return {
        "value": max(0, result["value"]),
        "cost": result["cost"],
        "trainsLeft": trains - result["cost"],
        "tickets": ticket_out,
        "routes": route_out,
        "availableTickets": len(tickets),
        "cities": len(cities),
    }


def validate():
    missing = []
    for a, b, *_ in ROUTES:
        if a not in CITIES:
            missing.append(a)
        if b not in CITIES:
            missing.append(b)
    for *_, a, b, _v in TICKETS:
        if a not in CITIES:
            missing.append(("ticket", a))
        if b not in CITIES:
            missing.append(("ticket", b))
    if missing:
        raise SystemExit(f"Unknown cities: {missing}")
    cities, adj, _routes = build_graph({"ec"})
    dist = all_pairs_sp(adj, cities)
    assert dist["Montreal"]["Quebec"] == 2
    assert dist["New York"]["Philadelphia"] == 2
    assert dist["Chicago"]["Montreal"] == 6
    assert dist["Detroit"]["New York"] == 5
    assert dist["Nashville"]["New Orleans"] == 4
    assert dist["Norfolk"]["Charleston"] == 3
    cities_west, adj_west, _ = build_graph({"ec", "or", "sm", "ca"})
    dist_west = all_pairs_sp(adj_west, cities_west)
    assert dist_west["Baja"]["Hermosillo"] == 3
    assert dist_west["Nuevos Angeles"]["New York"]
    # Winnipeg not on EC
    assert "Winnipeg" not in cities
    print("validation ok; EC cities", len(cities), "EC routes", sum(1 for r in ROUTES if r[3] == "ec"))
    # sample solve
    res = solve({"ec"}, 20, 2, 4)
    print("EC 20 trains, keep 2-4:", res["value"], "$ with", res["cost"], "trains;", [t["id"] for t in res["tickets"]])
    assert res["value"] > 0 and res["cost"] <= 20
    res2 = solve({"ec"}, 20, 2, 12)
    print("EC 20 trains, up to 12 tickets:", res2["value"], "$ with", res2["cost"], "trains;", len(res2["tickets"]), "tickets")
    bonus = build_payload()["trainRemainderBonus"]
    by_left = {left: row["dollars"] for row in bonus for left in row["left"]}
    assert by_left[0] == 16 and by_left[3] == 7 and by_left[4] == 6
    assert by_left[5] == 4 and by_left[8] == 2


def export(path: Path):
    payload = build_payload()
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print("wrote", path, "tickets", len(payload["tickets"]), "routes", len(payload["routes"]))


if __name__ == "__main__":
    validate()
    export(Path(__file__).resolve().parents[1] / "data.json")
