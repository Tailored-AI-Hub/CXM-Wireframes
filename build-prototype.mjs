// Extracts the content region + scoped CSS from each .dc.html artboard
// and emits pages.js for the clickable prototype shell.
import { readFileSync, writeFileSync } from "node:fs";

const PAGES = [
  ["overview", "Main.dc.html"],
  ["reviews", "ReviewsFeed.dc.html"],
  ["insights", "Insights.dc.html"],
  ["stores", "StorePerformance.dc.html"],
  ["geography", "CityRegion.dc.html"],
  ["productservice", "ProductService.dc.html"],
  ["staff", "StaffQuality.dc.html"],
  ["fulfilment", "Fulfilment.dc.html"],
  ["support", "Support.dc.html"],
  ["competition", "Competitor.dc.html"],
  ["actions", "Actions.dc.html"],
  ["reports", "Reports.dc.html"],
  ["data", "DataHub.dc.html"],
  ["ns-overview", "OverviewNonStore.dc.html"],
  ["ns-products", "ProductApp.dc.html"],
  ["ns-channels", "Channels.dc.html"],
  ["ns-segments", "Segments.dc.html"],
  ["ns-journey", "Journey.dc.html"],
  // Pages common in STRUCTURE but not in content: each tenant needs its own.
  ["ns-reviews", "NsReviewsFeed.dc.html"],
  ["ns-insights", "NsInsights.dc.html"],
  ["ns-support", "NsSupport.dc.html"],
  ["ns-competition", "NsCompetitor.dc.html"],
  ["ns-actions", "NsActions.dc.html"],
  ["ns-reports", "NsReports.dc.html"],
  ["ns-data", "NsDataHub.dc.html"],
  ["ns-onboarding", "NsOnboarding.dc.html"],
  ["ns-billing", "NsBilling.dc.html"],
];

// Selectors that are identical in every file — emit once, globally.
const SHARED = new Set([
  ".cap", ".pnl", ".h", ".sub", ".num", ".chip", ".btn", ".btn-p", ".tag",
  ".tag-c", ".tag-k", ".nav", ".nav-on", ".ico", ".ico-on", ".foot",
  ".td", ".tdk", ".th", ".quote", ".facet", ".box", ".box-on", ".dot",
  ".tab", ".tab-on", ".col", ".card", ".ttl", ".tm", ".tmpl", ".strike",
]);

/* ---------------------------------------------------------------------------
   Theme: "Harbour".

   The artboards are authored as greyscale wireframes and stay that way — the
   canvas is meant to read as a wireframe. The prototype is a product demo, so
   the neutral ramp is remapped here to a navy-tinted one: cooler ground, deep
   navy ink, and dark fills that read as a considered primary rather than black.

   Terracotta is deliberately NOT remapped. It carries meaning in this system —
   company-type-conditional modules and framework annotations — and keeping it
   warm against a cool ground is what makes those elements findable.
--------------------------------------------------------------------------- */
const THEME = {
  // neutral ramp -> cool, slightly blue so white cards read crisp against it
  "#17181a": "#0d1b2a", // ink, dark fills, active nav, primary button
  "#2f3135": "#17293d",
  "#4b4d52": "#33475b", // body text
  "#5a5d63": "#41566c",
  "#6f7278": "#5b7189", // muted
  "#7c7f85": "#6b8199", // footnotes
  "#83868c": "#7d93a8",
  "#8a8d93": "#8ba0b4", // placeholder text
  "#9a9da2": "#9db0c2",
  "#a5a8ad": "#aec0d0",
  "#b0b3b8": "#bccbd9",
  "#b7b9bd": "#c2cfdb",
  "#c0c2c6": "#c8d5e0",
  "#c9cbcf": "#d3dee7",
  "#d2d4d7": "#d8e2ea",
  "#dcdde0": "#dde5ec", // borders
  "#e1e2e4": "#e3eaf0",
  "#e2e3e5": "#e4ebf1",
  "#e9eaeb": "#e8eef3",
  "#eaeaec": "#e9eff4",
  "#eceded": "#eaeff4",
  "#ececed": "#eaeff4", // hairlines
  "#eeeff0": "#edf1f5",
  "#f0f0f1": "#eff3f7",
  "#f0f1f1": "#eff3f7",
  "#f2f2f3": "#f2f5f8", // fills
  "#f4f4f5": "#f5f8fa",
  "#f7f7f6": "#f6f8fa", // page ground
  "#fafafa": "#f9fbfc",
  // accent -> kept warm against the cool ground, slightly deepened
  "#a8512c": "#b0562e",
  "#8a4023": "#8f4423",
  "#f7ede7": "#fbf0ea",
  "#e3cbbd": "#ecd4c6",
  "#fdf9f7": "#fdf7f4",
  "#f0e6e0": "#f2e3da",
  "#b48065": "#a96f4f",
};

function applyTheme(css) {
  return css.replace(/#[0-9a-f]{6}\b/gi, (hex) => THEME[hex.toLowerCase()] || hex);
}

/* ---------------------------------------------------------------------------
   Type: Instrument Sans / Instrument Serif / Spline Sans Mono.

   Instrument Sans carries the UI — a contemporary grotesque with enough
   character in the letterforms to not read as a default, and tight enough at
   11–13px for dense tables. Spline Sans Mono keeps the micro-label voice and
   holds a 600 weight, which the uppercase captions need.

   Instrument Serif appears on exactly one element per page: the h1. A serif
   display against a grotesque UI is what makes the page feel composed rather
   than generated — and one element is the whole budget for that effect.

   The h1 rules come first: inline `font:` shorthand sets the family, so a
   stylesheet rule could never override it. Rewriting the shorthand is the only
   way in without !important.
--------------------------------------------------------------------------- */
const SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif";

function applyType(s) {
  // The shell builds markup inside JS string literals, so its quotes arrive
  // escaped as \'. Patterns must tolerate both forms, and replacements must
  // re-emit whichever form they matched — a bare ' here would terminate the
  // surrounding JS string and break the shell.
  const Q = String.raw`(\\?')`;

  const title = (size, lh, tracking) => (m, q) =>
    `font:400 ${size}px/${lh} ${q}Instrument Serif${q},Georgia,${q}Times New Roman${q},serif` +
    `;letter-spacing:${tracking}`;

  return s
    .replace(
      new RegExp(String.raw`font:600 22px/1\.1 ${Q}IBM Plex Sans\1,sans-serif;letter-spacing:-\.02em`, "g"),
      title(31, "1.06", "-.008em")
    )
    .replace(
      new RegExp(String.raw`font:600 26px/1\.15 ${Q}IBM Plex Sans\1,sans-serif;letter-spacing:-\.025em`, "g"),
      title(36, "1.06", "-.008em")
    )
    // Family names elsewhere — quote-agnostic, so both forms are covered.
    .replaceAll("IBM Plex Sans", "Instrument Sans")
    .replaceAll("IBM Plex Mono", "Spline Sans Mono");
}

/* ---------------------------------------------------------------------------
   Status badges carry their meaning in a word only. This reads that word and
   adds a semantic class, so severity is visible before it is read — which is
   what makes a dense board scannable. Purely additive: the text is untouched.
--------------------------------------------------------------------------- */
const BADGE_STATE = [
  [/^(critical|blocking|retire|breaching|overdue|stale source|auth)$/i, "tag-crit"],
  [/^(watch|warning|high|pending|partial|stale|draft|no change|watching|rate limit)$/i, "tag-warn"],
  [/^(verified|effective|healthy|ok|delivered|improving|keep|low|resolved)$/i, "tag-pos"],
];

function applyBadgeState(html) {
  // Matches a plain .tag and the dark-emphasis .tag-k, which is what the
  // artboards use for "Critical" and "Verified" — exactly the badges whose
  // meaning is a status.
  return html.replace(
    /<span class="tag( tag-k)?"([^>]*)>([^<]{1,22})<\/span>/g,
    (m, dark, attrs, text) => {
      const t = text.trim();
      for (const [re, cls] of BADGE_STATE) {
        if (re.test(t)) return `<span class="tag ${cls}"${attrs}>${text}</span>`;
      }
      return m;
    }
  );
}

function extractStyle(src) {
  const m = src.match(/<style>([\s\S]*?)<\/style>/);
  return m ? m[1] : "";
}

// Splits a stylesheet into [selector, body] pairs (no nesting in these files).
function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) out.push([m[1].trim(), m[2].trim()]);
  return out;
}

function extractContent(src) {
  const start = src.indexOf("</header>");
  const end = src.indexOf("</x-dc>");
  if (start < 0 || end < 0) throw new Error("no header/x-dc boundary");
  let body = src.slice(start + "</header>".length, end).trim();
  // Drop the three wrapper closers: content div, column div, root flex div.
  for (let i = 0; i < 3; i++) {
    const k = body.lastIndexOf("</div>");
    if (k < 0) throw new Error("unbalanced wrappers");
    body = body.slice(0, k) + body.slice(k + "</div>".length);
    body = body.trimEnd();
  }
  // Re-open the content div we just consumed the closer for: keep its opening
  // tag out and let the shell own padding instead.
  const open = body.indexOf(">");
  return body.slice(open + 1).trim();
}

const sharedSeen = new Map();
const scoped = [];
const content = {};

for (const [key, file] of PAGES) {
  const src = readFileSync(new URL(file, import.meta.url), "utf8");
  content[key] = extractContent(src);

  for (const [sel, decl] of rules(extractStyle(src))) {
    if (/^(body|a|a:hover|:root)$/.test(sel)) continue;
    if (SHARED.has(sel)) {
      if (!sharedSeen.has(sel)) sharedSeen.set(sel, decl);
      continue;
    }
    // Page-specific (.r, .row, .srow differ per file) — scope it.
    const s = sel.split(",").map((p) => `#view[data-page="${key}"] ${p.trim()}`).join(",");
    scoped.push(`${s}{${decl}}`);
  }
}

const sharedCss = readFileSync(new URL("design-system.css", import.meta.url), "utf8");

for (const key of Object.keys(content)) content[key] = applyBadgeState(applyType(applyTheme(content[key])));

const pagesJs =
  "window.PAGE_CSS = " + JSON.stringify(sharedCss + "\n" + applyType(applyTheme(scoped.join("\n")))) + ";\n" +
  "window.PAGE_HTML = " + JSON.stringify(content) + ";";

const shell = applyType(applyTheme(readFileSync(new URL("prototype-shell.html", import.meta.url), "utf8")));
if (!shell.includes("/*__PAGES__*/")) throw new Error("shell is missing the /*__PAGES__*/ slot");
// JSON.stringify never emits "</script>", but a page's own copy could; be safe.
const out = shell.replace("/*__PAGES__*/", pagesJs.replace(/<\/script>/gi, "<\\/script>"));
writeFileSync(new URL("cxm-prototype.html", import.meta.url), out);

const bytes = Object.values(content).reduce((n, s) => n + s.length, 0);
console.log(`cxm-prototype.html — ${(out.length / 1024).toFixed(0)}KB total`);
console.log(`  ${PAGES.length} pages, ${(bytes / 1024).toFixed(0)}KB content, ${((sharedCss.length + scoped.join("").length) / 1024) | 0}KB page css`);
for (const [key] of PAGES) console.log(`  ${key.padEnd(16)} ${(content[key].length / 1024).toFixed(1)}KB`);
