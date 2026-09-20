#!/usr/bin/env python3
"""Optimize destination-ticket scores for a train budget.

The network cost of a ticket set is the length of a Steiner forest:
each kept ticket's two cities must be in the same connected component
of claimed routes. We build that forest by incrementally adding a
shortest path in the residual graph (existing claimed edges cost 0).
"""

from __future__ import annotations

import heapq
import json
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


def optimize(tickets, adj, trains, min_keep, max_keep):
    tickets = [t for t in tickets if t["sp"] <= trains]
    tickets.sort(key=lambda t: (-t["ratio"], -t["value"], t["sp"]))
    n = len(tickets)
    best = {"value": -1, "cost": 0, "tickets": [], "routes": []}

    # Optimistic remaining value using efficiency packing.
    prefix_vals = [0]
    for t in tickets:
        prefix_vals.append(prefix_vals[-1] + t["value"])

    def rec(i, chosen, claimed, cost, value):
        if min_keep <= len(chosen) <= max_keep and value > best["value"]:
            best["value"] = value
            best["cost"] = cost
            best["tickets"] = list(chosen)
            best["routes"] = sorted(claimed)
        elif value == best["value"] and cost < best["cost"] and min_keep <= len(chosen) <= max_keep:
            best["cost"] = cost
            best["tickets"] = list(chosen)
            best["routes"] = sorted(claimed)

        if i >= n or len(chosen) >= max_keep:
            return
        remaining_slots = max_keep - len(chosen)
        leftover = sorted((tickets[j]["value"] for j in range(i, n)), reverse=True)
        optimistic = value + sum(leftover[:remaining_slots])
        if optimistic < best["value"]:
            return

        rec(i + 1, chosen, claimed, cost, value)

        t = tickets[i]
        extra, path = dijkstra(adj, t["a"], t["b"], claimed)
        if extra is None or cost + extra > trains:
            return
        new_claimed = claimed | set(path)
        rec(i + 1, chosen + [t], new_claimed, cost + extra, value + t["value"])

    rec(0, [], set(), 0, 0)
    return best


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
    checks = [
        ("Montreal", "Quebec", 1),
        ("New York", "Philadelphia", 1),
        ("Chicago", "Montreal", 6),
        ("Detroit", "New York", 5),
        ("Winnipeg", "Cincinnati", None),  # Winnipeg not on EC
    ]
    assert dist["Montreal"]["Quebec"] == 1
    assert dist["New York"]["Philadelphia"] == 1
    assert dist["Chicago"]["Montreal"] == 6
    assert dist["Detroit"]["New York"] == 5
    # Winnipeg not on EC
    assert "Winnipeg" not in cities
    print("validation ok; EC cities", len(cities), "EC routes", sum(1 for r in ROUTES if r[3] == "ec"))
    # sample solve
    res = solve({"ec"}, 20, 2, 4)
    print("EC 20 trains, keep 2-4:", res["value"], "$ with", res["cost"], "trains;", [t["id"] for t in res["tickets"]])
    res2 = solve({"ec"}, 20, 2, 12)
    print("EC 20 trains, up to 12 tickets:", res2["value"], "$ with", res2["cost"], "trains;", len(res2["tickets"]), "tickets")


def export(path: Path):
    payload = build_payload()
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print("wrote", path, "tickets", len(payload["tickets"]), "routes", len(payload["routes"]))


if __name__ == "__main__":
    validate()
    export(Path(__file__).resolve().parents[1] / "data.json")
