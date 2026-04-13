// src/app/app.component.ts
var AppComponent = class {
  title = "Sentiment Calendar";
  // R1
  loading = true;
  // R1
  monthData = [];
  // R1,R2
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
var monthDataService = new MonthDataService();
var daySummaryService = new DaySummaryService();
var popover = ensurePopover();
var activePopoverDate = null;
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
async function loadMonth() {
  const statusEl = document.getElementById("status");
  const grid = document.getElementById("grid");
  if (!statusEl || !grid) return;
  const url = new URL(window.location.href);
  const yearParam = url.searchParams.get("year");
  const monthParam = url.searchParams.get("month");
  const now = /* @__PURE__ */ new Date();
  const year = yearParam ? parseInt(yearParam, 10) : now.getUTCFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getUTCMonth() + 1;
  try {
    statusEl.textContent = "Loading month data...";
    const days = await monthDataService.getMonth(year, month);
    statusEl.textContent = "";
    grid.hidden = false;
    grid.innerHTML = "";
    days.forEach((d) => {
      const triple = formatTriple(d.sentiments);
      const cls = sentimentClass(d.sentiments);
      const cell = document.createElement("div");
      cell.className = `day ${cls}`;
      cell.dataset.date = d.date;
      cell.tabIndex = 0;
      cell.setAttribute("role", "button");
      cell.setAttribute("aria-haspopup", "dialog");
      cell.setAttribute("aria-label", `Open details for ${d.date}`);
      const topicPreview = document.createElement("div");
      topicPreview.className = "topic-preview";
      topicPreview.textContent = d.summary ? `Summary: ${d.summary}` : "Summary: unavailable";
      cell.innerHTML = `<strong>${d.date}</strong><br/>Posts: ${d.postsCount}<br/>${triple}`;
      cell.appendChild(topicPreview);
      const showDetail = async () => {
        showPopoverLoading(cell, d.date);
        try {
          const summary = await daySummaryService.getSummary(d.date);
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
    statusEl.textContent = `Error loading data: ${e instanceof Error ? e.message : "Unknown error"}`;
    logger.error("Failed to load month data", { error: e instanceof Error ? e.message : String(e) });
  }
}
function bootstrap() {
  return new AppComponent();
}
loadMonth();
export {
  bootstrap
};
//# sourceMappingURL=bundle.js.map
