const REGION_FILL = {
  ec: "rgba(47, 93, 138, 0.10)",
  fl: "rgba(58, 138, 122, 0.12)",
  gp: "rgba(196, 163, 90, 0.12)",
  or: "rgba(184, 107, 58, 0.12)",
  bl: "rgba(138, 107, 69, 0.12)",
  hw: "rgba(92, 92, 102, 0.14)",
  cs: "rgba(61, 122, 74, 0.12)",
  ca: "rgba(196, 92, 74, 0.12)",
  sm: "rgba(164, 90, 58, 0.12)",
};

function routePath(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const bend = Math.min(28, Math.hypot(dx, dy) * 0.08);
  const nx = -dy / (Math.hypot(dx, dy) || 1);
  const ny = dx / (Math.hypot(dx, dy) || 1);
  return `M ${a.x} ${a.y} Q ${mx + nx * bend} ${my + ny * bend} ${b.x} ${b.y}`;
}

export function renderMap(svg, data, state) {
  const regionSet = state.regionSet;
  const claimed = new Set(state.result?.routes.map((r) => r.id) || []);
  const ticketCities = new Set();
  (state.result?.tickets || []).forEach((t) => {
    ticketCities.add(t.a);
    ticketCities.add(t.b);
  });
  const cityById = new Map(data.cities.map((c) => [c.id, c]));

  const availableRoutes = data.routes.filter(
    (r) => regionSet.has(r.region) && cityById.get(r.a) && cityById.get(r.b) &&
      regionSet.has(cityById.get(r.a).region) && regionSet.has(cityById.get(r.b).region)
  );
  const availableCities = data.cities.filter((c) => regionSet.has(c.region));

  const parts = [];
  const pad = 48;
  const xs = availableCities.map((c) => c.x);
  const ys = availableCities.map((c) => c.y);
  const minX = Math.max(0, Math.min(...xs) - pad);
  const minY = Math.max(0, Math.min(...ys) - pad);
  const maxX = Math.min(1400, Math.max(...xs) + pad);
  const maxY = Math.min(820, Math.max(...ys) + pad);
  svg.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

  parts.push(`<rect x="0" y="0" width="1400" height="820" fill="#e7dcc4"/>`);
  parts.push(`<path d="M 0 70 C 180 10, 420 -10, 720 40 S 1220 20, 1400 90 L 1400 0 L 0 0 Z" fill="#7fa4b8" opacity="0.45"/>`);
  parts.push(`<path d="M 0 820 L 0 700 C 220 760, 480 790, 760 760 S 1180 700, 1400 640 L 1400 820 Z" fill="#c9a06a" opacity="0.28"/>`);

  for (const r of availableRoutes) {
    const a = cityById.get(r.a);
    const b = cityById.get(r.b);
    const selected = claimed.has(r.id);
    const d = routePath(a, b);
    const stroke = selected ? "#c45c1a" : "#5c5346";
    const width = selected ? 5.2 : 2.1 + r.length * 0.15;
    const opacity = selected ? 1 : 0.42;
    parts.push(
      `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}" data-route="${r.id}"/>`
    );
    if (selected) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      parts.push(
        `<circle cx="${mx}" cy="${my}" r="8" fill="#f3e2c4" stroke="#c45c1a" stroke-width="1.4"/>` +
        `<text x="${mx}" y="${my + 3.5}" text-anchor="middle" font-size="9" font-weight="700" fill="#6a2e0e">${r.length}</text>`
      );
    }
  }

  for (const c of availableCities) {
    const onTicket = ticketCities.has(c.id);
    const r = onTicket ? 8.5 : 5.5;
    const fill = onTicket ? "#f1c453" : c.town ? "#b04a3a" : "#f4efe4";
    const stroke = onTicket ? "#6a2e0e" : "#2c241c";
    parts.push(`<circle cx="${c.x}" cy="${c.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${onTicket ? 2 : 1.4}"/>`);
    const anchor = c.x > 1100 ? "end" : c.x < 80 ? "start" : "middle";
    const dx = c.x > 1100 ? -10 : c.x < 80 ? 10 : 0;
    const dy = c.y < 50 ? 18 : -12;
    parts.push(
      `<text x="${c.x + dx}" y="${c.y + dy}" text-anchor="${anchor}" font-size="${onTicket ? 11.5 : 10}" font-weight="${onTicket ? 700 : 600}" fill="#2c241c">${c.id}</text>`
    );
  }

  svg.innerHTML = parts.join("");
}
