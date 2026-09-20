export function buildGraph(data, regionSet) {
  const cities = new Set(
    data.cities.filter((c) => regionSet.has(c.region)).map((c) => c.id)
  );
  const adj = new Map();
  const routes = new Map();
  const addAdj = (from, to, length, id) => {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push({ to, length, id });
  };
  for (const r of data.routes) {
    if (!regionSet.has(r.region)) continue;
    if (!cities.has(r.a) || !cities.has(r.b)) continue;
    routes.set(r.id, r);
    addAdj(r.a, r.b, r.length, r.id);
    addAdj(r.b, r.a, r.length, r.id);
  }
  return { cities, adj, routes };
}

function dijkstra(adj, src, dst, freeEdges) {
  if (src === dst) return { cost: 0, path: [] };
  const heap = [[0, src]];
  const best = new Map([[src, 0]]);
  const prev = new Map();
  while (heap.length) {
    let minI = 0;
    for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[minI][0]) minI = i;
    const [dist, node] = heap.splice(minI, 1)[0];
    if (dist !== best.get(node)) continue;
    if (node === dst) break;
    const edges = adj.get(node) || [];
    for (const e of edges) {
      const step = freeEdges.has(e.id) ? 0 : e.length;
      const nd = dist + step;
      if (nd < (best.get(e.to) ?? 1e9)) {
        best.set(e.to, nd);
        prev.set(e.to, { node, id: e.id });
        heap.push([nd, e.to]);
      }
    }
  }
  if (!best.has(dst)) return null;
  const path = [];
  let cur = dst;
  while (cur !== src) {
    const p = prev.get(cur);
    path.push(p.id);
    cur = p.node;
  }
  path.reverse();
  return { cost: best.get(dst), path };
}

export function shortestPaths(adj, cities) {
  const dist = new Map();
  for (const src of cities) {
    const heap = [[0, src]];
    const best = new Map([[src, 0]]);
    while (heap.length) {
      let minI = 0;
      for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[minI][0]) minI = i;
      const [d, node] = heap.splice(minI, 1)[0];
      if (d !== best.get(node)) continue;
      for (const e of adj.get(node) || []) {
        const nd = d + e.length;
        if (nd < (best.get(e.to) ?? 1e9)) {
          best.set(e.to, nd);
          heap.push([nd, e.to]);
        }
      }
    }
    dist.set(src, best);
  }
  return dist;
}

export function ticketsForRegions(data, regionSet, dist) {
  const out = [];
  for (const t of data.tickets) {
    if (!regionSet.has(t.region)) continue;
    const sp = dist.get(t.a)?.get(t.b);
    if (sp == null) continue;
    out.push({ ...t, sp, ratio: sp ? t.value / sp : t.value });
  }
  return out;
}

function cloneSet(s) {
  return new Set(s);
}

function optimisticValue(tickets, start, slots) {
  if (slots <= 0) return 0;
  const vals = [];
  for (let j = start; j < tickets.length; j++) vals.push(tickets[j].value);
  vals.sort((a, b) => b - a);
  let s = 0;
  for (let i = 0; i < slots && i < vals.length; i++) s += vals[i];
  return s;
}

function dfsExact(tickets, adj, trains, minKeep, maxKeep) {
  const n = tickets.length;
  const best = { value: -1, cost: 0, tickets: [], routes: [] };

  const rec = (i, chosen, claimed, cost, value) => {
    if (chosen.length >= minKeep && chosen.length <= maxKeep) {
      if (value > best.value || (value === best.value && cost < best.cost)) {
        best.value = value;
        best.cost = cost;
        best.tickets = chosen.slice();
        best.routes = [...claimed];
      }
    }
    if (i >= n || chosen.length >= maxKeep) return;
    if (value + optimisticValue(tickets, i, maxKeep - chosen.length) < best.value) return;

    const t = tickets[i];
    const extra = dijkstra(adj, t.a, t.b, claimed);
    if (extra && cost + extra.cost <= trains) {
      const nextClaimed = cloneSet(claimed);
      extra.path.forEach((id) => nextClaimed.add(id));
      rec(i + 1, chosen.concat([t]), nextClaimed, cost + extra.cost, value + t.value);
    }
    rec(i + 1, chosen, claimed, cost, value);
  };

  rec(0, [], new Set(), 0, 0);
  return best;
}

function permute(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    for (const rest of permute(arr.filter((_, j) => j !== i))) out.push([arr[i], ...rest]);
  }
  return out;
}

function bestOrder(tickets, adj) {
  if (tickets.length > 6) return rebuildNetwork(tickets, adj, 999, tickets.length);
  let best = null;
  for (const order of permute(tickets)) {
    const next = rebuildNetwork(order, adj, 999, tickets.length);
    if (next.tickets.length !== tickets.length) continue;
    if (!best || next.cost < best.cost) best = next;
  }
  return best || rebuildNetwork(tickets, adj, 999, tickets.length);
}
function uniqueById(list) {
  const seen = new Set();
  const out = [];
  for (const t of list) {
    if (!t?.id || seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

function rebuildNetwork(list, adj, trains, maxKeep) {
  let cost = 0;
  const claimed = new Set();
  const kept = [];
  for (const t of uniqueById(list)) {
    const extra = dijkstra(adj, t.a, t.b, claimed);
    if (!extra || cost + extra.cost > trains) continue;
    extra.path.forEach((id) => claimed.add(id));
    cost += extra.cost;
    kept.push(t);
    if (kept.length >= maxKeep) break;
  }
  return {
    tickets: kept,
    claimed,
    cost,
    value: kept.reduce((s, t) => s + t.value, 0),
  };
}

function addFreeTickets(state, tickets, adj, maxKeep) {
  const used = new Set(state.tickets.map((t) => t.id));
  const extras = [];
  for (const t of tickets) {
    if (used.has(t.id)) continue;
    const extra = dijkstra(adj, t.a, t.b, state.claimed);
    if (extra && extra.cost === 0) extras.push(t);
  }
  extras.sort((a, b) => b.value - a.value);
  for (const t of extras) {
    if (state.tickets.length >= maxKeep) break;
    state.tickets.push(t);
    state.value += t.value;
    used.add(t.id);
  }
  return state;
}

function greedyThenSearch(tickets, adj, trains, minKeep, maxKeep) {
  let claimed = new Set();
  let cost = 0;
  const chosen = [];
  const used = new Set();

  while (chosen.length < maxKeep) {
    let bestAdd = null;
    for (const t of tickets) {
      if (used.has(t.id)) continue;
      const extra = dijkstra(adj, t.a, t.b, claimed);
      if (!extra || cost + extra.cost > trains) continue;
      const score = (t.value + 0.05) / (extra.cost + 0.35);
      if (
        !bestAdd ||
        score > bestAdd.score ||
        (score === bestAdd.score && t.value > bestAdd.t.value)
      ) {
        bestAdd = { t, extra, score };
      }
    }
    if (!bestAdd) break;
    chosen.push(bestAdd.t);
    used.add(bestAdd.t.id);
    bestAdd.extra.path.forEach((id) => claimed.add(id));
    cost += bestAdd.extra.cost;
  }

  let state = rebuildNetwork(chosen, adj, trains, maxKeep);
  for (let round = 0; round < 3; round++) {
    let improved = false;
    const pool = tickets.filter((t) => !state.tickets.some((x) => x.id === t.id));
    for (let i = 0; i < state.tickets.length; i++) {
      for (const cand of pool) {
        const trial = state.tickets.slice();
        trial[i] = cand;
        const next = rebuildNetwork(trial, adj, trains, maxKeep);
        if (
          next.tickets.length >= minKeep &&
          (next.value > state.value || (next.value === state.value && next.cost < state.cost))
        ) {
          state = next;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }

  state = addFreeTickets(state, tickets, adj, maxKeep);
  return {
    value: state.value,
    cost: state.cost,
    tickets: uniqueById(state.tickets),
    routes: [...state.claimed],
  };
}

export function optimizeTickets({ data, regionSet, trains, minKeep, maxKeep }) {
  const { cities, adj, routes } = buildGraph(data, regionSet);
  const dist = shortestPaths(adj, cities);
  let tickets = ticketsForRegions(data, regionSet, dist).filter((t) => t.sp <= trains);
  tickets.sort((a, b) => b.ratio - a.ratio || b.value - a.value || a.sp - b.sp);

  const combinations = (n, k) => {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let r = 1;
    for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
    return r;
  };
  const enumSize = Array.from({ length: maxKeep + 1 }, (_, k) =>
    k < minKeep ? 0 : combinations(tickets.length, k)
  ).reduce((a, b) => a + b, 0);

  let raw =
    tickets.length <= 36 && maxKeep <= 5 && enumSize <= 80000
      ? dfsExact(tickets, adj, trains, minKeep, maxKeep)
      : greedyThenSearch(tickets, adj, trains, minKeep, maxKeep);

  if (raw.tickets?.length && raw.tickets.length <= 6) {
    const ordered = bestOrder(raw.tickets, adj);
    if (ordered && ordered.cost <= trains) {
      raw = {
        ...raw,
        cost: ordered.cost,
        routes: [...ordered.claimed],
        tickets: ordered.tickets,
      };
    }
  }

  const claimedRoutes = raw.routes
    .map((id) => routes.get(id))
    .filter(Boolean)
    .sort((a, b) => a.a.localeCompare(b.a) || a.b.localeCompare(b.b));

  return {
    value: Math.max(0, raw.value),
    cost: raw.cost,
    trainsLeft: trains - raw.cost,
    tickets: raw.tickets,
    routes: claimedRoutes,
    availableTickets: tickets.length,
    cityCount: cities.size,
    routeCount: routes.size,
  };
}

export function remainderBonus(left, table) {
  if (left >= 11) return 0;
  const row = table.find((r) => r.left.includes(left));
  return row ? row.dollars : 0;
}
