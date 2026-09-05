// src/app/app.component.ts
var AppComponent = class {
  title = "Sentiment Calendar";
  // R1
  loading = true;
  // R1
  monthData = [];
  // R1,R2
};

// src/app/utils/month-nav.ts
var MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
function utcYearMonth(now = /* @__PURE__ */ new Date()) {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}
function isValidYearMonth(year, month) {
  return Number.isInteger(year) && Number.isInteger(month) && year >= 2e3 && year <= 2100 && month >= 1 && month <= 12;
}
function parseViewMonth(search, now = /* @__PURE__ */ new Date()) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const year = Number.parseInt(params.get("year") || "", 10);
  const month = Number.parseInt(params.get("month") || "", 10);
  if (isValidYearMonth(year, month)) return { year, month };
  return utcYearMonth(now);
}
function shiftMonth(view, delta) {
  const d = new Date(Date.UTC(view.year, view.month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}
function compareYearMonth(a, b) {
  return a.year === b.year ? a.month - b.month : a.year - b.year;
}
function canGoToPreviousMonth(view) {
  return compareYearMonth(view, { year: 2e3, month: 1 }) > 0;
}
function canGoToNextMonth(view, now = /* @__PURE__ */ new Date()) {
  return compareYearMonth(view, utcYearMonth(now)) < 0;
}
function formatMonthTitle(view) {
  const name = MONTH_NAMES[view.month - 1] || "Unknown";
  return `${name} ${view.year}`;
}
function monthQueryString(view) {
  return `year=${view.year}&month=${view.month}`;
}
function hrefForMonth(pathname, view) {
  return `${pathname}?${monthQueryString(view)}`;
}

// src/app/calendar-month/calendar-month.component.ts
var CalendarMonthComponent = class {
  // T11
  constructor(year, month, now = () => /* @__PURE__ */ new Date()) {
    this.now = now;
    const d = this.now();
    this.year = year ?? d.getUTCFullYear();
    this.month = month ?? d.getUTCMonth() + 1;
  }
  days = [];
  // R1,R11
  year;
  month;
  // 1-12
  loading = false;
  view() {
    return { year: this.year, month: this.month };
  }
  setView(view) {
    this.year = view.year;
    this.month = view.month;
  }
  setData(days) {
    this.days = days;
  }
  cellCount() {
    return this.days.length;
  }
  // R1
  sentimentTriple(day) {
    const s = day.sentiments;
    return `${s.positive}:${s.neutral}:${s.negative}`;
  }
  // T11: Loading state management
  isLoading() {
    return this.loading;
  }
  setLoading(value) {
    this.loading = value;
  }
  // T11: Empty state detection (R11)
  isEmpty() {
    return this.days.length === 0;
  }
  emptyStateMessage() {
    return "No data available for this month";
  }
  // T11: Accessibility helpers (R11)
  ariaBusy() {
    return this.loading ? "true" : "false";
  }
  ariaLabel() {
    return `Calendar for ${this.monthTitle()}`;
  }
  monthTitle() {
    return formatMonthTitle(this.view());
  }
  previousMonth() {
    return shiftMonth(this.view(), -1);
  }
  nextMonth() {
    return shiftMonth(this.view(), 1);
  }
  canGoPrevious() {
    return canGoToPreviousMonth(this.view());
  }
  canGoNext() {
    return canGoToNextMonth(this.view(), this.now());
  }
};

// src/logging/logger.ts
function log(level, msg, meta) {
  const payload = {
    t: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    msg,
    ...meta ?? {}
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
var logger = {
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta)
};

// src/app/services/month-data.service.ts
function trimTrailingSlash(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
function resolveDataRoot(options) {
  const explicit = options?.dataRoot;
  const envUrl = typeof process !== "undefined" ? process.env?.STATIC_DATA_URL : void 0;
  const globalUrl = typeof globalThis !== "undefined" ? globalThis.__STATIC_DATA_URL__ : void 0;
  const candidate = explicit || envUrl || globalUrl || "/data";
  return trimTrailingSlash(candidate);
}
function asOptionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
var MonthDataService = class {
  fetchFn;
  dataRoot;
  cache = /* @__PURE__ */ new Map();
  constructor(options) {
    this.fetchFn = options?.fetchFn ?? fetch;
    this.dataRoot = resolveDataRoot(options);
  }
  async getMonth(year, month, options) {
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const cacheKey = monthStr;
    if (!options?.forceRefresh && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const url = `${this.dataRoot}/month/${monthStr}.json`;
    const fetchFn = this.fetchFn;
    const resp = await fetchFn(url);
    if (resp.status === 404) {
      const empty = { month: monthStr, days: [] };
      this.cache.set(cacheKey, empty);
      return empty;
    }
    if (!resp.ok) {
      logger.error("Month data request failed", { status: resp.status, statusText: resp.statusText });
      throw new Error(`Month data request failed (${resp.status} ${resp.statusText})`);
    }
    const payload = await resp.json();
    const mapped = (payload?.days || []).map((d) => ({
      date: d.date,
      postsCount: d.postsCount,
      sentiments: d.counts ?? { positive: 0, neutral: 0, negative: 0 },
      summary: d.summary ?? "",
      hasDetail: d.hasDetail ?? true,
      generatedAt: d.generatedAt ?? "",
      topics: Array.isArray(d.topics) ? d.topics.filter((t) => typeof t === "string") : [],
      trendingTopic: asOptionalString(d.trendingTopic),
      trendingName: asOptionalString(d.trendingName),
      selfPraiseCount: Number.isFinite(Number(d.selfPraiseCount)) ? Math.max(0, Math.trunc(Number(d.selfPraiseCount))) : 0
    }));
    const view = {
      month: payload?.month || monthStr,
      days: mapped,
      trendingTopic: asOptionalString(payload?.trendingTopic),
      trendingName: asOptionalString(payload?.trendingName)
    };
    this.cache.set(cacheKey, view);
    return view;
  }
};

// src/app/services/day-detail.service.ts
function trimTrailingSlash2(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
function resolveDataRoot2(options) {
  const explicit = options?.dataRoot;
  const envUrl = typeof process !== "undefined" ? process.env?.STATIC_DATA_URL : void 0;
  const globalUrl = typeof globalThis !== "undefined" ? globalThis.__STATIC_DATA_URL__ : void 0;
  const candidate = explicit || envUrl || globalUrl || "/data";
  return trimTrailingSlash2(candidate);
}
var DaySummaryService = class {
  fetchFn;
  dataRoot;
  cache = /* @__PURE__ */ new Map();
  constructor(options) {
    this.fetchFn = options?.fetchFn ?? fetch;
    this.dataRoot = resolveDataRoot2(options);
  }
  async getSummary(date, options) {
    if (!options?.forceRefresh && this.cache.has(date)) {
      return this.cache.get(date);
    }
    const year = date.slice(0, 4);
    const month = date.slice(5, 7);
    const url = `${this.dataRoot}/days/${year}/${month}/${date}.json`;
    const fetchFn = this.fetchFn;
    const resp = await fetchFn(url);
    if (!resp.ok) {
      logger.error("Day summary data request failed", { status: resp.status, statusText: resp.statusText });
      throw new Error(`Day summary data request failed (${resp.status} ${resp.statusText})`);
    }
    const payload = await resp.json();
    const normalizedTopics = Array.isArray(payload.topics) ? payload.topics.map((t) => typeof t === "string" ? t : String(t?.phrase ?? t?.topic ?? "")).filter(Boolean) : [];
    const sentiments = payload.counts ?? payload.sentiments ?? { positive: 0, neutral: 0, negative: 0 };
    const summaryText = payload.summary ?? payload.fallbackMessage ?? "No summary available";
    const normalized = {
      date: payload.date ?? date,
      summary: summaryText,
      sentiments,
      topics: normalizedTopics,
      trendingTopic: typeof payload.trendingTopic === "string" && payload.trendingTopic.trim() ? payload.trendingTopic.trim() : void 0,
      trendingName: typeof payload.trendingName === "string" && payload.trendingName.trim() ? payload.trendingName.trim() : void 0,
      selfPraiseCount: Number.isFinite(Number(payload.selfPraiseCount)) ? Math.max(0, Math.trunc(Number(payload.selfPraiseCount))) : 0,
      source: "static",
      fallbackMessage: payload.fallbackMessage ?? summaryText
    };
    this.cache.set(date, normalized);
    return normalized;
  }
};

// src/app/utils/color-util.ts
function formatTriple(s) {
  return `${s.positive}:${s.neutral}:${s.negative}`;
}
function dominantSentiment(s) {
  const { positive, neutral, negative } = s;
  if (positive === 0 && neutral === 0 && negative === 0) return "empty";
  const entries = [
    ["positive", positive],
    ["neutral", neutral],
    ["negative", negative]
  ];
  entries.sort((a, b) => b[1] - a[1]);
  const [first, second] = entries;
  if (first[1] === second[1]) return "mixed";
  return first[0];
}
function sentimentClass(s) {
  const dom = dominantSentiment(s);
  switch (dom) {
    case "empty":
      return "sentiment-empty";
    case "positive":
      return "sentiment-pos";
    case "neutral":
      return "sentiment-neu";
    case "negative":
      return "sentiment-neg";
    case "mixed":
    default:
      return "sentiment-mixed";
  }
}
var SENTIMENT_GRADIENT_COLORS = {
  negative: "#e24b4b",
  neutral: "#b4b8be",
  positive: "#3db86a"
};
function clampCount(n) {
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function formatPct(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
function sentimentGradient(s) {
  const negative = clampCount(s.negative);
  const neutral = clampCount(s.neutral);
  const positive = clampCount(s.positive);
  const total = negative + neutral + positive;
  if (total === 0) return "";
  const bands = [
    { color: SENTIMENT_GRADIENT_COLORS.negative, count: negative },
    { color: SENTIMENT_GRADIENT_COLORS.neutral, count: neutral },
    { color: SENTIMENT_GRADIENT_COLORS.positive, count: positive }
  ].filter((band) => band.count > 0);
  if (bands.length === 1) {
    const color = bands[0].color;
    return `linear-gradient(to bottom, ${color} 0%, ${color} 100%)`;
  }
  const stops = [];
  let cursor = 0;
  bands.forEach((band, index) => {
    const share = band.count / total * 100;
    const mid = cursor + share / 2;
    if (index === 0) stops.push(`${band.color} 0%`);
    stops.push(`${band.color} ${formatPct(mid)}%`);
    if (index === bands.length - 1) stops.push(`${band.color} 100%`);
    cursor += share;
  });
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
}

// src/app/utils/month-highlights.ts
var TRAILING_INCOMPLETE = /\b(the|a|an|of|and|or|to|for|in|on|at|by|with|from|as|that|throughout|who|which|whom|whose|people of|for the|in the|of the|and the|and who|who is|from the|throughout the)\s*$/i;
var HISTORICAL_NAMES = /* @__PURE__ */ new Set([
  "thomas jefferson",
  "george washington",
  "abraham lincoln",
  "benjamin franklin",
  "alexander hamilton",
  "john adams",
  "james madison",
  "teddy roosevelt",
  "franklin roosevelt"
]);
function isCompleteHeadline(topic) {
  if (!topic) return false;
  const t = topic.replace(/\s+/g, " ").trim();
  if (t.length < 12 || t.length > 140) return false;
  if (/^[A-Z0-9 .,'’:-]+$/.test(t) && t === t.toUpperCase() && t.length < 40) return false;
  if (TRAILING_INCOMPLETE.test(t)) return false;
  if (/\b(u\.s\.a|u\.s|lt|st|mr|dr|gen|gov|sen)\.?$/i.test(t)) return false;
  if (/[,:;]$/.test(t)) return false;
  if ((t.match(/["“”]/g) || []).length % 2 === 1) return false;
  if (/\bI$/.test(t)) return false;
  if (/\b(represent|including)\s*$/i.test(t)) return false;
  if (/\b(where|who|whom|whose|which|that|and|or|for|with|from|under|of|to|our|my)\s+[A-Z][A-Za-z'’]*$/.test(t)) return false;
  if (/^https?:/i.test(t) || /^RT:?\s/i.test(t)) return false;
  if (/\/statuses\//i.test(t) || /truthsocial\.com/i.test(t)) return false;
  return true;
}
function nameMentionsTopic(name, topic) {
  if (!name || !topic) return false;
  const hay = topic.toLowerCase();
  if (hay.includes(name.toLowerCase())) return true;
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.some((part) => part.length > 3 && hay.includes(part.toLowerCase()));
}
function utcToday(now) {
  if (typeof now === "string") return now.slice(0, 10);
  return now.toISOString().slice(0, 10);
}
function pickFrequent(items) {
  const map = /* @__PURE__ */ new Map();
  for (const item of items) {
    const key = item.value.toLowerCase();
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { count: 1, date: item.date, weight: item.weight, value: item.value });
    } else {
      prev.count += 1;
      if (item.date > prev.date) prev.date = item.date;
      prev.weight = Math.max(prev.weight, item.weight);
    }
  }
  let best;
  for (const stats of map.values()) {
    if (!best) {
      best = stats;
      continue;
    }
    if (stats.count > best.count) best = stats;
    else if (stats.count === best.count) {
      if (stats.date > best.date) best = stats;
      else if (stats.date === best.date && stats.weight > best.weight) best = stats;
      else if (stats.date === best.date && stats.weight === best.weight && stats.value.localeCompare(best.value) < 0) best = stats;
    }
  }
  return best?.value;
}
function topicQuality(topic, name, postsCount = 0) {
  let score = isCompleteHeadline(topic) ? 8 : -12;
  const len = topic.length;
  if (len >= 28 && len <= 90) score += 4;
  else if (len >= 18 && len <= 110) score += 2;
  if (nameMentionsTopic(name, topic)) score += 5;
  if (/[—:]/.test(topic)) score += 1;
  score += Math.min(4, Math.floor((postsCount || 0) / 15));
  return score;
}
function usableName(name) {
  if (!name) return false;
  return !HISTORICAL_NAMES.has(name.toLowerCase());
}
function monthSoFarDays(days, month, now) {
  const today = utcToday(now);
  if (today.startsWith(month)) return days.filter((d) => d.date <= today);
  return days;
}
function monthSoFarHighlights(days, month, now) {
  const scoped = monthSoFarDays(days, month, now);
  const coherent = scoped.filter((d) => isCompleteHeadline(d.trendingTopic));
  const namedWithTopic = coherent.filter(
    (d) => usableName(d.trendingName) && nameMentionsTopic(d.trendingName, d.trendingTopic)
  );
  const namedDays = namedWithTopic.length ? namedWithTopic : coherent.filter((d) => usableName(d.trendingName));
  const name = pickFrequent(
    namedDays.map((d) => ({ value: d.trendingName, date: d.date, weight: d.postsCount || 0 }))
  );
  const topicPool = name ? coherent.filter((d) => d.trendingName && d.trendingName.toLowerCase() === name.toLowerCase()) : coherent;
  const topicDays = topicPool.length ? topicPool : coherent;
  let bestTopic;
  for (const day of topicDays) {
    const value = day.trendingTopic;
    const score = topicQuality(value, name, day.postsCount);
    if (!bestTopic || score > bestTopic.score) bestTopic = { score, value };
  }
  return {
    ...bestTopic && bestTopic.score > 0 ? { trendingTopic: bestTopic.value } : {},
    ...name ? { trendingName: name } : {}
  };
}

// src/main.ts
var activePopoverDate = null;
var loadGeneration = 0;
var calendar = null;
function ensurePopover() {
  const existing = document.getElementById("day-popover");
  if (existing) {
    return existing;
  }
  const el = document.createElement("div");
  el.id = "day-popover";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-live", "polite");
  el.hidden = true;
  document.body.appendChild(el);
  return el;
}
function positionPopover(target) {
  const rect = target.getBoundingClientRect();
  const popover = ensurePopover();
  popover.style.left = `${rect.left + window.scrollX}px`;
  popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
}
function showPopoverContent(target, content) {
  positionPopover(target);
  const popover = ensurePopover();
  popover.innerHTML = content;
  popover.hidden = false;
}
function hidePopover() {
  const popover = ensurePopover();
  popover.hidden = true;
  popover.innerHTML = "";
  activePopoverDate = null;
}
function showPopoverLoading(target, date) {
  activePopoverDate = date;
  showPopoverContent(target, `<div class="popover-title">${date}</div><div class="popover-loading">Loading day summary...</div>`);
}
function showPopoverError(target, date, errorMessage) {
  activePopoverDate = date;
  showPopoverContent(target, `<div class="popover-title">${date}</div><div class="popover-error">Error: ${errorMessage}</div>`);
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function renderPopoverSummary(target, summary) {
  activePopoverDate = summary.date;
  const topics = summary.topics.length > 0 ? summary.topics.map((t) => `<li>${escapeHtml(t)}</li>`).join("") : "";
  const sentiments = summary.sentiments ? `Sentiments: ${formatTriple(summary.sentiments)}` : "";
  const topicLine = `<div class="popover-row"><span class="popover-label">Trending topic</span> ${escapeHtml(summary.trendingTopic || "\u2014")}</div>`;
  const nameLine = `<div class="popover-row"><span class="popover-label">Trending name</span> ${escapeHtml(summary.trendingName || "\u2014")}</div>`;
  const praiseLine = `<div class="popover-row"><span class="popover-label">Self-praise posts</span> ${summary.selfPraiseCount ?? 0}</div>`;
  const content = summary.topics.length > 0 ? `<ul class="popover-topics">${topics}</ul>` : `<div class="popover-row">${escapeHtml(summary.summary || summary.fallbackMessage || "No summary available")}</div>`;
  showPopoverContent(
    target,
    `<div class="popover-title">${escapeHtml(summary.date)}</div>${topicLine}${nameLine}${praiseLine}${content}${sentiments ? `<div class="popover-row">${escapeHtml(sentiments)}</div>` : ""}`
  );
}
function monthKey(view) {
  return `${view.year}-${String(view.month).padStart(2, "0")}`;
}
function renderMonthHighlights(runtime, view, days) {
  const section = runtime.document.getElementById("month-highlights");
  const heading = runtime.document.getElementById("month-highlights-heading");
  const topicEl = runtime.document.getElementById("month-trending-topic");
  const nameEl = runtime.document.getElementById("month-trending-name");
  if (!section || !topicEl || !nameEl) return;
  const today = (runtime.now ?? (() => /* @__PURE__ */ new Date()))().toISOString().slice(0, 10);
  const key = monthKey(view);
  const highlights = monthSoFarHighlights(days, key, today);
  const isCurrent = today.startsWith(key);
  if (heading) heading.textContent = isCurrent ? "Month so far" : "This month";
  topicEl.textContent = highlights.trendingTopic || "\u2014";
  nameEl.textContent = highlights.trendingName || "\u2014";
  section.hidden = days.length === 0;
}
function writeMonthUrl(runtime, view, mode) {
  const next = hrefForMonth(runtime.location.pathname, view);
  const url = `${next}${runtime.location.hash || ""}`;
  if (mode === "push") {
    runtime.history.pushState(view, "", url);
  } else {
    runtime.history.replaceState(view, "", url);
  }
}
function syncNav(runtime, view) {
  const label = runtime.document.getElementById("month-label");
  const prev = runtime.document.getElementById("prev-month");
  const next = runtime.document.getElementById("next-month");
  const grid = runtime.document.getElementById("grid");
  if (!calendar) {
    calendar = new CalendarMonthComponent(view.year, view.month, runtime.now);
  } else {
    calendar.setView(view);
  }
  if (label) label.textContent = calendar.monthTitle();
  if (grid) {
    grid.setAttribute("aria-label", calendar.ariaLabel());
    grid.setAttribute("aria-busy", calendar.ariaBusy());
  }
  if (prev) {
    prev.disabled = !calendar.canGoPrevious();
    prev.setAttribute("aria-disabled", prev.disabled ? "true" : "false");
  }
  if (next) {
    next.disabled = !calendar.canGoNext();
    next.setAttribute("aria-disabled", next.disabled ? "true" : "false");
  }
}
async function loadMonth(runtime, view) {
  const statusEl = runtime.document.getElementById("status");
  const grid = runtime.document.getElementById("grid");
  const emptyEl = runtime.document.getElementById("empty-state");
  if (!statusEl || !grid) return;
  const gen = ++loadGeneration;
  hidePopover();
  if (!calendar) {
    calendar = new CalendarMonthComponent(view.year, view.month, runtime.now);
  }
  calendar.setLoading(true);
  syncNav(runtime, view);
  try {
    statusEl.textContent = "Loading month data...";
    if (emptyEl) emptyEl.hidden = true;
    grid.hidden = true;
    const month = await runtime.monthDataService.getMonth(view.year, view.month);
    if (gen !== loadGeneration) return;
    const days = month.days;
    calendar.setData(days);
    calendar.setLoading(false);
    syncNav(runtime, view);
    renderMonthHighlights(runtime, view, days);
    statusEl.textContent = "";
    grid.innerHTML = "";
    if (calendar.isEmpty()) {
      if (emptyEl) {
        emptyEl.textContent = calendar.emptyStateMessage();
        emptyEl.hidden = false;
      } else {
        statusEl.textContent = calendar.emptyStateMessage();
      }
      grid.hidden = true;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    grid.hidden = false;
    days.forEach((d) => {
      const triple = formatTriple(d.sentiments);
      const gradient = sentimentGradient(d.sentiments);
      const cls = gradient ? "sentiment-blend" : sentimentClass(d.sentiments);
      const cell = runtime.document.createElement("div");
      cell.className = `day ${cls}`;
      if (gradient) cell.style.setProperty("--day-blend", gradient);
      cell.dataset.date = d.date;
      cell.tabIndex = 0;
      cell.setAttribute("role", "button");
      cell.setAttribute("aria-haspopup", "dialog");
      const n = Number(d.selfPraiseCount) || 0;
      const praiseLabel = n === 1 ? "self-praise" : "self-praises";
      const topicPreview = runtime.document.createElement("div");
      topicPreview.className = "topic-preview";
      topicPreview.textContent = d.trendingTopic || (d.summary ? `Summary: ${d.summary}` : "Summary: unavailable");
      cell.innerHTML = `<div class="self-praise"><div class="self-praise-count">${n}</div><div class="self-praise-label">${praiseLabel}</div></div><strong>${d.date}</strong><div class="day-line">Posts: ${d.postsCount}</div><div class="day-line">${triple}</div>`;
      cell.appendChild(topicPreview);
      cell.setAttribute("aria-label", `Open details for ${d.date}, ${n} ${praiseLabel}`);
      const showDetail = async () => {
        showPopoverLoading(cell, d.date);
        try {
          const summary = await runtime.daySummaryService.getSummary(d.date);
          if (activePopoverDate !== d.date) return;
          renderPopoverSummary(cell, summary);
        } catch (e) {
          logger.error("Failed to load day summary", { error: e instanceof Error ? e.message : String(e), date: d.date });
          showPopoverError(cell, d.date, e instanceof Error ? e.message : "Unknown error");
        }
      };
      cell.addEventListener("click", showDetail);
      cell.addEventListener("mouseenter", showDetail);
      cell.addEventListener("focus", showDetail);
      cell.addEventListener("mouseleave", () => {
        hidePopover();
      });
      grid.appendChild(cell);
    });
  } catch (e) {
    if (gen !== loadGeneration) return;
    calendar.setLoading(false);
    syncNav(runtime, view);
    statusEl.textContent = `Error loading data: ${e instanceof Error ? e.message : "Unknown error"}`;
    logger.error("Failed to load month data", { error: e instanceof Error ? e.message : String(e) });
    renderMonthHighlights(runtime, view, []);
  }
}
function goToMonth(runtime, view, mode) {
  if (mode !== "none") writeMonthUrl(runtime, view, mode);
  return loadMonth(runtime, view);
}
function defaultRuntime() {
  return {
    document,
    location,
    history,
    monthDataService: new MonthDataService(),
    // R1,R5
    daySummaryService: new DaySummaryService()
    // R1.1,R5.1
  };
}
function initCalendar(runtime = defaultRuntime()) {
  const now = runtime.now ?? (() => /* @__PURE__ */ new Date());
  calendar = new CalendarMonthComponent(void 0, void 0, now);
  const initial = parseViewMonth(runtime.location.search, now());
  writeMonthUrl(runtime, initial, "replace");
  const prev = runtime.document.getElementById("prev-month");
  const next = runtime.document.getElementById("next-month");
  prev?.addEventListener("click", () => {
    if (!calendar?.canGoPrevious()) return;
    void goToMonth(runtime, calendar.previousMonth(), "push");
  });
  next?.addEventListener("click", () => {
    if (!calendar?.canGoNext()) return;
    void goToMonth(runtime, calendar.nextMonth(), "push");
  });
  runtime.document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
    if (event.key === "ArrowLeft" && calendar?.canGoPrevious()) {
      event.preventDefault();
      void goToMonth(runtime, calendar.previousMonth(), "push");
    }
    if (event.key === "ArrowRight" && calendar?.canGoNext()) {
      event.preventDefault();
      void goToMonth(runtime, calendar.nextMonth(), "push");
    }
  });
  runtime.document.defaultView?.addEventListener("popstate", () => {
    const view = parseViewMonth(runtime.location.search, now());
    void goToMonth(runtime, view, "none");
  });
  void goToMonth(runtime, initial, "none");
  return calendar;
}
function bootstrap() {
  return new AppComponent();
}
var isJest = typeof process !== "undefined" && !!process.env.JEST_WORKER_ID;
if (!isJest && document.getElementById("grid")) {
  initCalendar();
}
export {
  bootstrap,
  initCalendar
};
//# sourceMappingURL=bundle.js.map
