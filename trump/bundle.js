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
function parseViewDay(search) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const day = (params.get("day") || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : void 0;
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
function hrefForMonth(pathname, view, day) {
  const query = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? `${monthQueryString(view)}&day=${day}` : monthQueryString(view);
  return `${pathname}?${query}`;
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
function asHighlightList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!item || typeof item !== "object") return void 0;
    const topic = asOptionalString(item.topic);
    if (!topic) return void 0;
    const name = asOptionalString(item.name);
    return name ? { topic, name } : { topic };
  }).filter((item) => !!item);
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
    const mapped = (payload?.days || []).map((d) => {
      const secondaryHighlights = asHighlightList(d.secondaryHighlights);
      return {
        date: d.date,
        postsCount: d.postsCount,
        sentiments: d.counts ?? { positive: 0, neutral: 0, negative: 0 },
        summary: d.summary ?? "",
        hasDetail: d.hasDetail ?? true,
        generatedAt: d.generatedAt ?? "",
        topics: Array.isArray(d.topics) ? d.topics.filter((t) => typeof t === "string") : [],
        trendingTopic: asOptionalString(d.trendingTopic),
        trendingName: asOptionalString(d.trendingName),
        selfPraiseCount: Number.isFinite(Number(d.selfPraiseCount)) ? Math.max(0, Math.trunc(Number(d.selfPraiseCount))) : 0,
        ...secondaryHighlights.length ? { secondaryHighlights } : {}
      };
    });
    const monthSecondaries = asHighlightList(payload?.secondaryHighlights);
    const view = {
      month: payload?.month || monthStr,
      days: mapped,
      trendingTopic: asOptionalString(payload?.trendingTopic),
      trendingName: asOptionalString(payload?.trendingName),
      ...monthSecondaries.length ? { secondaryHighlights: monthSecondaries } : {}
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
    const posts = Array.isArray(payload.posts) ? payload.posts.map((p) => ({
      id: String(p?.id || p?.url || ""),
      url: String(p?.url || p?.raw?.link || p?.id || ""),
      title: typeof p?.title === "string" ? p.title : "",
      text: typeof p?.text === "string" ? p.text : "",
      publishedAt: typeof p?.publishedAt === "string" ? p.publishedAt : void 0,
      raw: p?.raw && typeof p.raw === "object" ? p.raw : void 0
    })).filter((p) => p.id || p.url) : [];
    const postSentiments = Array.isArray(payload.sentiments) ? payload.sentiments.map((s) => ({
      postId: String(s?.postId || ""),
      label: s?.label === "positive" || s?.label === "negative" || s?.label === "neutral" ? s.label : void 0
    })).filter((s) => !!s.postId && !!s.label) : [];
    const secondaryHighlights = Array.isArray(payload.secondaryHighlights) ? payload.secondaryHighlights.map((item) => {
      const topic = typeof item?.topic === "string" ? item.topic.trim() : "";
      if (!topic) return void 0;
      const name = typeof item?.name === "string" && item.name.trim() ? item.name.trim() : void 0;
      return name ? { topic, name } : { topic };
    }).filter((item) => !!item) : [];
    const normalized = {
      date: payload.date ?? date,
      summary: summaryText,
      sentiments,
      topics: normalizedTopics,
      trendingTopic: typeof payload.trendingTopic === "string" && payload.trendingTopic.trim() ? payload.trendingTopic.trim() : void 0,
      trendingName: typeof payload.trendingName === "string" && payload.trendingName.trim() ? payload.trendingName.trim() : void 0,
      selfPraiseCount: Number.isFinite(Number(payload.selfPraiseCount)) ? Math.max(0, Math.trunc(Number(payload.selfPraiseCount))) : 0,
      posts,
      postSentiments,
      source: "static",
      fallbackMessage: payload.fallbackMessage ?? summaryText,
      ...secondaryHighlights.length ? { secondaryHighlights } : {}
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
var GENERIC_TOPIC = /^(economic growth|political commentary|endorsements and support|international relations|legal proceedings|general news|controversies)\b/i;
function acceptModelHeadline(topic) {
  const t = (topic || "").replace(/\s+/g, " ").trim();
  if (!t) return void 0;
  if (/^https?:/i.test(t) || /^RT:?\s/i.test(t)) return void 0;
  if (/\/statuses\//i.test(t) || /truthsocial\.com/i.test(t)) return void 0;
  if (GENERIC_TOPIC.test(t)) return void 0;
  return t;
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
function usableName(name) {
  if (!name) return false;
  return !HISTORICAL_NAMES.has(name.toLowerCase());
}
function openingKey(text) {
  const tokens = text.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(Boolean);
  return tokens.slice(0, 6).join(" ");
}
function clusterHeadline(members) {
  return [...members].sort((a, b) => b.posts - a.posts || b.headline.length - a.headline.length)[0].headline;
}
function monthSoFarDays(days, month, now) {
  const today = utcToday(now);
  if (today.startsWith(month)) return days.filter((d) => d.date <= today);
  return days;
}
function rankMonthThemes(days) {
  const clusters = /* @__PURE__ */ new Map();
  const push = (headline, name, posts) => {
    const topic = acceptModelHeadline(headline);
    if (!topic) return;
    const key = openingKey(topic);
    if (!key) return;
    const member = {
      headline: topic,
      ...usableName(name) ? { name } : {},
      posts
    };
    const prev = clusters.get(key);
    if (prev) prev.push(member);
    else clusters.set(key, [member]);
  };
  for (const day of days) {
    const posts = day.postsCount || 0;
    push(day.trendingTopic, day.trendingName, posts);
    for (const extra of day.secondaryHighlights || []) {
      push(extra.topic, extra.name, 0);
    }
  }
  const ranked = Array.from(clusters.values()).map((members) => {
    const clustered = members.length >= 2;
    const topic = clustered ? clusterHeadline(members) : members[0].headline;
    const names = members.map((m) => m.name).filter((name2) => !!name2);
    const unanimous = names.length > 0 && names.every((name2) => name2.toLowerCase() === names[0].toLowerCase());
    const candidate = clustered ? unanimous && names.length === members.length ? names[0] : void 0 : names[0];
    const name = nameMentionsTopic(candidate, topic) ? candidate : void 0;
    const posts = members.reduce((sum, m) => sum + m.posts, 0);
    return {
      topic,
      count: members.length,
      posts,
      ...name ? { name } : {}
    };
  }).filter((theme) => acceptModelHeadline(theme.topic));
  ranked.sort((a, b) => b.count - a.count || b.posts - a.posts);
  return ranked;
}
function monthSoFarHighlights(days, month, now) {
  const ranked = rankMonthThemes(monthSoFarDays(days, month, now));
  const best = ranked[0];
  const secondaryHighlights = ranked.slice(1).filter((theme) => theme.topic.toLowerCase() !== (best?.topic || "").toLowerCase()).slice(0, 3).map((theme) => ({ topic: theme.topic, ...theme.name ? { name: theme.name } : {} }));
  return {
    ...best ? { trendingTopic: best.topic } : {},
    ...best?.name ? { trendingName: best.name } : {},
    ...secondaryHighlights.length ? { secondaryHighlights } : {}
  };
}
function cleanHighlight(item, primary) {
  const topic = acceptModelHeadline(item?.topic);
  if (!topic) return void 0;
  if (primary && topic.toLowerCase() === primary.toLowerCase()) return void 0;
  const name = usableName(item?.name) ? item.name : void 0;
  return name ? { topic, name } : { topic };
}
function resolveMonthHighlights(stored, fallback) {
  const topic = acceptModelHeadline(stored?.trendingTopic);
  if (!topic) return fallback;
  const name = usableName(stored?.trendingName) && nameMentionsTopic(stored.trendingName, topic) ? stored.trendingName : void 0;
  const secondaryHighlights = (stored?.secondaryHighlights || []).map((item) => cleanHighlight(item, topic)).filter((item) => !!item).slice(0, 3);
  return {
    trendingTopic: topic,
    ...name ? { trendingName: name } : {},
    ...secondaryHighlights.length ? { secondaryHighlights } : {}
  };
}

// src/app/utils/day-stories.ts
var GENERIC_TOPIC2 = /^(economic growth|political commentary|endorsements and support|international relations|legal proceedings|general news|controversies)/i;
var SKIP_NAME = /* @__PURE__ */ new Set([
  "united states",
  "truth social",
  "white house",
  "supreme court",
  "new york",
  "fox news",
  "donald trump",
  "president trump",
  "save america",
  "great patriot",
  "thomas jefferson",
  "george washington",
  "abraham lincoln",
  "barack hussein",
  "lake ontario",
  "lake america",
  "data center"
]);
var SKIP_LAST = /* @__PURE__ */ new Set([
  "alongside",
  "columns",
  "house",
  "report",
  "news",
  "times",
  "trump",
  "america",
  "states",
  "social",
  "court",
  "hussein",
  "jefferson",
  "left",
  "like",
  "when",
  "then",
  "from",
  "with",
  "that"
]);
var KNOWN_FIRST = /* @__PURE__ */ new Set([
  "adam",
  "alvin",
  "ashley",
  "barack",
  "bill",
  "brian",
  "chuck",
  "dan",
  "elon",
  "eric",
  "gavin",
  "hakeem",
  "jared",
  "joe",
  "john",
  "kathy",
  "lara",
  "letitia",
  "lindsey",
  "marco",
  "maria",
  "mark",
  "melania",
  "michael",
  "mike",
  "nancy",
  "pete",
  "ro",
  "ron",
  "sean",
  "ted",
  "trey",
  "tucker"
]);
var KNOWN_FIGURES = [
  "Kathy Hochul",
  "Lindsey Graham",
  "Michael Cohen",
  "Maria Bartiromo",
  "Letitia James",
  "Alvin Bragg",
  "Ashley Hinson",
  "Gavin Newsom",
  "Marco Rubio",
  "JD Vance",
  "Joe Biden",
  "Barack Obama",
  "Dan Sullivan",
  "Trey Gowdy",
  "Ro Khanna",
  "Hakeem Jeffries",
  "Bill Maher",
  "Mark Levin",
  "Sean Hannity",
  "Melania Trump",
  "Lara Trump",
  "Dan Patrick",
  "Ron Estes",
  "Chuck Schumer"
];
function stripHtml(html) {
  return html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&apos;/gi, "'").replace(/\s+/g, " ").trim();
}
function postDedupeKey(post) {
  const url = String(post.url || post.id || post.raw?.link || "");
  const status = url.match(/\/statuses\/(\d+)/);
  if (status) return status[1];
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "") || String(post.id || "");
}
function dedupePosts(posts) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const post of posts) {
    const key = postDedupeKey(post);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(post);
  }
  return out;
}
function cleanTitle(raw) {
  let t = stripHtml(raw);
  t = t.replace(/^\[No Title\].*$/i, "");
  t = t.replace(/@realDonaldTrump/gi, " ");
  t = t.replace(/^RT\s+/i, "");
  t = t.replace(/^@[A-Za-z0-9_.]+\s*/i, "");
  t = t.replace(/https?:\/\/\S+/gi, "");
  t = t.replace(/\s*President DONALD J\.?\s*TRUMP\s*$/i, "");
  t = t.replace(/\s*President DJT\s*$/i, "");
  t = t.replace(/\s+/g, " ").replace(/[:：]\s*$/, "").trim();
  if (/^https?:\/\//i.test(t) || t.length < 8) return "";
  return t;
}
function isCompleteHeadline(topic) {
  const t = topic.replace(/\s+/g, " ").trim();
  if (t.length < 12 || t.length > 140) return false;
  if (GENERIC_TOPIC2.test(t)) return false;
  if (/\b(the|a|an|of|and|or|to|for|in|on|at|by|with|from|as|that|throughout|who|which|like|then|when)\s*$/i.test(t)) return false;
  if (/\bto\s+[A-Za-z][A-Za-z'-]*$/i.test(t)) return false;
  if (/\b(u\.s\.a|u\.s|lt)\.?$/i.test(t)) return false;
  if (/^https?:/i.test(t) || /^RT:?\s/i.test(t)) return false;
  return true;
}
function compactHeadline(raw, max = 110) {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const dash = t.split(/\s+[—–]\s+/)[0]?.trim();
  if (dash && dash !== t && isCompleteHeadline(dash) && dash.length <= max) return dash;
  if (isCompleteHeadline(t) && t.length <= max) return t;
  if (t.length > max) {
    const slice = t.slice(0, max);
    const at = slice.lastIndexOf(" ");
    const cut = (at > 40 ? slice.slice(0, at) : slice).trim().replace(/[,:;.-]+$/, "");
    if (isCompleteHeadline(cut)) return cut;
  }
  return isCompleteHeadline(t) ? t : "";
}
function firstSentence(text, max) {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const match = t.match(/^(.+?[.!?])(\s|$)/);
  const lead = (match ? match[1] : t).trim();
  if (lead.length <= max) return lead;
  const slice = lead.slice(0, max);
  const at = slice.lastIndexOf(" ");
  return `${(at > 40 ? slice.slice(0, at) : slice).trim()}\u2026`;
}
function displayLead(raw, max = 120) {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return compactHeadline(t, max) || firstSentence(t, max);
}
function extractName(text) {
  const hay = stripHtml(text);
  for (const figure of KNOWN_FIGURES) {
    if (new RegExp(`\\b${figure.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(hay)) {
      return figure === "J.D. Vance" ? "JD Vance" : figure;
    }
  }
  const match = hay.match(/\b([A-Z][a-z]+(?:-[A-Z][a-z]+)?\s+[A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/);
  if (!match) return void 0;
  const name = match[1].replace(/\s+/g, " ").trim();
  const key = name.toLowerCase();
  if (SKIP_NAME.has(key) || /\b(trump|donald)\b/i.test(name)) return void 0;
  const parts = name.split(/\s+/);
  const first = parts[0].toLowerCase();
  const last = parts[parts.length - 1].toLowerCase();
  if (SKIP_LAST.has(last) || !KNOWN_FIRST.has(first)) return void 0;
  return name;
}
function headlineFromPost(post) {
  const title = cleanTitle(post.title || post.raw?.title || "");
  const body = cleanTitle(post.raw?.contentSnippet || stripHtml(post.text || ""));
  return displayLead(title) || displayLead(body);
}
function snippetFromPost(post) {
  const snippet = stripHtml(post.raw?.contentSnippet || post.text || "");
  const title = cleanTitle(post.title || post.raw?.title || "");
  const body = snippet || title;
  if (body.length <= 180) return body;
  const slice = body.slice(0, 180);
  const at = slice.lastIndexOf(" ");
  return `${(at > 80 ? slice.slice(0, at) : slice).trim()}\u2026`;
}
function normalizeForCompare(s) {
  return s.replace(/…/g, " ").replace(/\.{2,}/g, " ").replace(/President DONALD J\.?\s*TRUMP/gi, " ").replace(/President DJT/gi, " ").replace(/[^a-z0-9]+/gi, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
function isRedundantSnippet(title, snippet) {
  const a = normalizeForCompare(title);
  const b = normalizeForCompare(snippet);
  if (!b) return true;
  if (!a) return false;
  if (a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  const n = Math.min(a.length, b.length);
  return n >= 32 && a.slice(0, n) === b.slice(0, n);
}
var UNTITLED_POST_LABEL = "Untitled post";
function listDayPosts(posts, sentiments = []) {
  const byId = /* @__PURE__ */ new Map();
  for (const s of sentiments) {
    if (!s.postId || s.label !== "positive" && s.label !== "neutral" && s.label !== "negative") continue;
    byId.set(s.postId, s.label);
    const status = String(s.postId).match(/\/statuses\/(\d+)/);
    if (status) byId.set(status[1], s.label);
  }
  const out = [];
  for (const post of dedupePosts(posts)) {
    const cleaned = displayLead(cleanTitle(post.title || post.raw?.title || ""));
    const snippet = snippetFromPost(post);
    const title = cleaned || displayLead(snippet) || UNTITLED_POST_LABEL;
    const id = String(post.id || post.url || postDedupeKey(post));
    const url = String(post.url || post.raw?.link || post.id || "");
    const key = postDedupeKey(post);
    const sentiment = byId.get(id) || byId.get(key) || byId.get(url);
    out.push({
      id,
      url,
      title,
      snippet: isRedundantSnippet(title, snippet) ? "" : snippet,
      publishedAt: post.publishedAt,
      ...sentiment ? { sentiment } : {}
    });
  }
  return out.sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
}
function sameStory(a, b) {
  return a.topic.trim().toLowerCase() === b.topic.trim().toLowerCase();
}
function acceptStoredHeadline(topic) {
  const t = (topic || "").replace(/\s+/g, " ").trim();
  if (!t || GENERIC_TOPIC2.test(t)) return void 0;
  if (/^https?:/i.test(t) || /^RT:?\s/i.test(t)) return void 0;
  return t;
}
function openingKey2(text) {
  const tokens = text.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(Boolean);
  return tokens.slice(0, 6).join(" ");
}
function buildDayStoryBoard(input) {
  const posts = listDayPosts(input.posts || [], input.sentiments || []);
  const ranked = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (pair) => {
    const topic = acceptStoredHeadline(pair?.topic);
    if (!topic || seen.has(topic.toLowerCase())) return;
    seen.add(topic.toLowerCase());
    ranked.push({ topic, ...pair?.name ? { name: pair.name } : {} });
  };
  push(
    input.trendingTopic ? { topic: input.trendingTopic, ...input.trendingName ? { name: input.trendingName } : {} } : void 0
  );
  const storedSecondaries = input.secondaryHighlights;
  for (const extra of storedSecondaries || []) push(extra);
  if (!Array.isArray(storedSecondaries)) {
    const clusters = /* @__PURE__ */ new Map();
    for (const post of dedupePosts(input.posts || [])) {
      const topic = headlineFromPost(post);
      if (!topic) continue;
      const name = extractName(`${cleanTitle(post.title || "")} ${post.raw?.contentSnippet || stripHtml(post.text || "")}`);
      const key = openingKey2(topic) || topic.toLowerCase();
      const prev = clusters.get(key);
      if (prev) {
        prev.headlines.push(topic);
        if (name) prev.names.push(name);
      } else {
        clusters.set(key, { headlines: [topic], names: name ? [name] : [] });
      }
    }
    const clustered = Array.from(clusters.values()).map((group) => {
      const topic = [...group.headlines].sort((a, b) => a.length - b.length)[0];
      const unanimous = group.names.length > 0 && group.names.every((n) => n.toLowerCase() === group.names[0].toLowerCase());
      const name = unanimous ? group.names[0] : void 0;
      return {
        topic,
        count: group.headlines.length,
        ...name ? { name } : {}
      };
    }).sort((a, b) => b.count - a.count);
    for (const group of clustered) push(group);
  }
  const primary = ranked[0] || { topic: "" };
  const secondary = ranked.filter((s) => !sameStory(s, primary)).slice(0, 3);
  return { primary, secondary, posts };
}

// src/main.ts
var activeDayDate = null;
var loadGeneration = 0;
var calendar = null;
var lastFocusedCell = null;
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function formatStoryItem(item, topicClass, nameClass) {
  const topic = `<div><span class="hl-label">Topic</span> <span class="${topicClass}">${escapeHtml(item.topic)}</span></div>`;
  if (!item.name) return `<li>${topic}</li>`;
  return `<li>${topic}<div><span class="hl-label">Name</span> <span class="${nameClass}">${escapeHtml(item.name)}</span></div></li>`;
}
function formatPostTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(11, 16);
  return d.toISOString().slice(11, 16) + " UTC";
}
function ensureDayDetail(runtime) {
  const doc = runtime.document;
  let root = doc.getElementById("day-detail");
  if (root) return root;
  root = doc.createElement("div");
  root.id = "day-detail";
  root.hidden = true;
  root.innerHTML = `
    <div class="day-detail-backdrop" data-day-detail-close="true"></div>
    <article class="day-detail-panel" role="dialog" aria-modal="true" aria-labelledby="day-detail-title">
      <header class="day-detail-header">
        <h2 id="day-detail-title">Day</h2>
        <button type="button" id="day-detail-close" aria-label="Close day view">Close</button>
      </header>
      <div id="day-detail-body" class="day-detail-body"></div>
    </article>
  `;
  doc.body.appendChild(root);
  root.addEventListener("click", (event) => {
    const target = event.target;
    if (target?.getAttribute("data-day-detail-close") === "true" || target?.id === "day-detail-close") {
      closeDayDetail(runtime, "push");
    }
  });
  return root;
}
function currentView(runtime) {
  return parseViewMonth(runtime.location.search, (runtime.now ?? (() => /* @__PURE__ */ new Date()))());
}
function writeViewUrl(runtime, view, mode, day) {
  const next = hrefForMonth(runtime.location.pathname, view, day);
  const url = `${next}${runtime.location.hash || ""}`;
  if (mode === "push") {
    runtime.history.pushState({ ...view, day }, "", url);
  } else {
    runtime.history.replaceState({ ...view, day }, "", url);
  }
}
function closeDayDetail(runtime, mode) {
  const root = runtime.document.getElementById("day-detail");
  if (root) {
    root.hidden = true;
    const body = runtime.document.getElementById("day-detail-body");
    if (body) body.innerHTML = "";
  }
  runtime.document.body.classList.remove("day-detail-open");
  activeDayDate = null;
  if (mode !== "none") {
    writeViewUrl(runtime, currentView(runtime), mode);
    lastFocusedCell?.focus();
  }
}
function renderDayDetail(runtime, summary) {
  const root = ensureDayDetail(runtime);
  const title = runtime.document.getElementById("day-detail-title");
  const body = runtime.document.getElementById("day-detail-body");
  if (!title || !body) return;
  const board = buildDayStoryBoard({
    posts: summary.posts,
    sentiments: summary.postSentiments,
    trendingTopic: summary.trendingTopic,
    trendingName: summary.trendingName,
    secondaryHighlights: summary.secondaryHighlights
  });
  const primaryTopic = board.primary.topic || summary.trendingTopic || "\u2014";
  const primaryName = board.primary.name || summary.trendingName || "";
  const secondaryRows = board.secondary.length ? board.secondary.map((s) => formatStoryItem(s, "day-story-topic", "day-story-name")).join("") : '<li class="day-empty">No additional stories</li>';
  const postRows = board.posts.length ? board.posts.map((p) => {
    const label = escapeHtml(p.title);
    const snippet = p.snippet ? `<span class="day-post-snippet">${escapeHtml(p.snippet)}</span>` : "";
    const meta = [formatPostTime(p.publishedAt), p.sentiment].filter(Boolean).join(" \xB7 ");
    const href = p.url ? ` href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer"` : "";
    return `<li class="day-post"><a class="day-post-link"${href}><span class="day-post-title">${label}</span>${snippet}<span class="day-post-meta">${escapeHtml(meta)}</span></a></li>`;
  }).join("") : '<li class="day-empty">No posts for this day</li>';
  title.textContent = summary.date;
  body.innerHTML = `
    <section class="day-primary">
      <p class="hl-row"><span class="hl-label">Trending topic</span> <span id="day-trending-topic">${escapeHtml(primaryTopic)}</span></p>
      ${primaryName ? `<p class="hl-row"><span class="hl-label">Trending name</span> <span id="day-trending-name">${escapeHtml(primaryName)}</span></p>` : ""}
    </section>
    <section class="day-secondary">
      <h3>Also trending</h3>
      <ol id="day-secondary-list">${secondaryRows}</ol>
    </section>
    <section class="day-posts">
      <h3>Posts <span class="day-post-count">${board.posts.length}</span></h3>
      <ul id="day-posts-list">${postRows}</ul>
    </section>
  `;
  root.hidden = false;
  runtime.document.body.classList.add("day-detail-open");
  activeDayDate = summary.date;
  runtime.document.getElementById("day-detail-close")?.focus();
}
async function openDayDetail(runtime, date, mode) {
  const root = ensureDayDetail(runtime);
  const title = runtime.document.getElementById("day-detail-title");
  const body = runtime.document.getElementById("day-detail-body");
  if (title) title.textContent = date;
  if (body) body.innerHTML = '<p class="day-detail-loading">Loading day\u2026</p>';
  root.hidden = false;
  runtime.document.body.classList.add("day-detail-open");
  activeDayDate = date;
  if (mode !== "none") writeViewUrl(runtime, currentView(runtime), mode, date);
  try {
    const summary = await runtime.daySummaryService.getSummary(date);
    if (activeDayDate !== date) return;
    renderDayDetail(runtime, summary);
  } catch (e) {
    if (activeDayDate !== date) return;
    if (body) {
      body.innerHTML = `<p class="day-detail-error">Error: ${escapeHtml(e instanceof Error ? e.message : "Unknown error")}</p>`;
    }
    logger.error("Failed to load day summary", { error: e instanceof Error ? e.message : String(e), date });
  }
}
function monthKey(view) {
  return `${view.year}-${String(view.month).padStart(2, "0")}`;
}
function renderMonthHighlights(runtime, view, month) {
  const section = runtime.document.getElementById("month-highlights");
  const heading = runtime.document.getElementById("month-highlights-heading");
  const topicEl = runtime.document.getElementById("month-trending-topic");
  const nameEl = runtime.document.getElementById("month-trending-name");
  const secondaryWrap = runtime.document.getElementById("month-secondary");
  const secondaryList = runtime.document.getElementById("month-secondary-list");
  if (!section || !topicEl || !nameEl) return;
  const days = month.days || [];
  const today = (runtime.now ?? (() => /* @__PURE__ */ new Date()))().toISOString().slice(0, 10);
  const key = monthKey(view);
  const highlights = resolveMonthHighlights(
    {
      trendingTopic: month.trendingTopic,
      trendingName: month.trendingName,
      secondaryHighlights: month.secondaryHighlights
    },
    monthSoFarHighlights(days, key, today)
  );
  const isCurrent = today.startsWith(key);
  if (heading) heading.textContent = isCurrent ? "Month so far" : "This month";
  topicEl.textContent = highlights.trendingTopic || "\u2014";
  const nameRow = nameEl.closest(".hl-row") || nameEl.parentElement;
  if (highlights.trendingName) {
    nameEl.textContent = highlights.trendingName;
    if (nameRow instanceof HTMLElement) nameRow.hidden = false;
  } else {
    nameEl.textContent = "";
    if (nameRow instanceof HTMLElement) nameRow.hidden = true;
  }
  const extras = highlights.secondaryHighlights || [];
  if (secondaryList) {
    secondaryList.innerHTML = extras.length ? extras.map((item) => formatStoryItem(item, "month-story-topic", "month-story-name")).join("") : "";
  }
  if (secondaryWrap) secondaryWrap.hidden = extras.length === 0;
  section.hidden = days.length === 0;
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
  closeDayDetail(runtime, "none");
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
    renderMonthHighlights(runtime, view, month);
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
      const showDetail = () => {
        lastFocusedCell = cell;
        void openDayDetail(runtime, d.date, "push");
      };
      cell.addEventListener("click", showDetail);
      cell.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showDetail();
        }
      });
      grid.appendChild(cell);
    });
    const requestedDay = parseViewDay(runtime.location.search);
    if (requestedDay && days.some((d) => d.date === requestedDay)) {
      void openDayDetail(runtime, requestedDay, "none");
    }
  } catch (e) {
    if (gen !== loadGeneration) return;
    calendar.setLoading(false);
    syncNav(runtime, view);
    statusEl.textContent = `Error loading data: ${e instanceof Error ? e.message : "Unknown error"}`;
    logger.error("Failed to load month data", { error: e instanceof Error ? e.message : String(e) });
    renderMonthHighlights(runtime, view, { days: [] });
  }
}
function goToMonth(runtime, view, mode) {
  if (mode !== "none") writeViewUrl(runtime, view, mode);
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
  writeViewUrl(runtime, initial, "replace", parseViewDay(runtime.location.search));
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
    if (event.key === "Escape" && activeDayDate) {
      event.preventDefault();
      closeDayDetail(runtime, "push");
      return;
    }
    if (activeDayDate) return;
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
