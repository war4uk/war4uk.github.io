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
      return [];
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
      generatedAt: d.generatedAt ?? ""
    }));
    this.cache.set(cacheKey, mapped);
    return mapped;
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

// src/main.ts
var popover = ensurePopover();
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
  popover.style.left = `${rect.left + window.scrollX}px`;
  popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
}
function showPopoverContent(target, content) {
  positionPopover(target);
  popover.innerHTML = content;
  popover.hidden = false;
}
function hidePopover() {
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
function renderPopoverSummary(target, summary) {
  activePopoverDate = summary.date;
  const topics = summary.topics.length > 0 ? summary.topics.map((t) => `<li>${t}</li>`).join("") : "";
  const sentiments = summary.sentiments ? `Sentiments: ${formatTriple(summary.sentiments)}` : "";
  const content = summary.topics.length > 0 ? `<ul class="popover-topics">${topics}</ul>` : `<div class="popover-row">${summary.summary || summary.fallbackMessage || "No summary available"}</div>`;
  showPopoverContent(
    target,
    `<div class="popover-title">${summary.date}</div>${content}${sentiments ? `<div class="popover-row">${sentiments}</div>` : ""}`
  );
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
    const days = await runtime.monthDataService.getMonth(view.year, view.month);
    if (gen !== loadGeneration) return;
    calendar.setData(days);
    calendar.setLoading(false);
    syncNav(runtime, view);
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
      const cls = sentimentClass(d.sentiments);
      const cell = runtime.document.createElement("div");
      cell.className = `day ${cls}`;
      cell.dataset.date = d.date;
      cell.tabIndex = 0;
      cell.setAttribute("role", "button");
      cell.setAttribute("aria-haspopup", "dialog");
      cell.setAttribute("aria-label", `Open details for ${d.date}`);
      const topicPreview = runtime.document.createElement("div");
      topicPreview.className = "topic-preview";
      topicPreview.textContent = d.summary ? `Summary: ${d.summary}` : "Summary: unavailable";
      cell.innerHTML = `<strong>${d.date}</strong><br/>Posts: ${d.postsCount}<br/>${triple}`;
      cell.appendChild(topicPreview);
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
