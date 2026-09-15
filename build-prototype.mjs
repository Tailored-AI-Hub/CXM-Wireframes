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
  "#17181a": "#0f2233", // ink, dark fills, active nav, primary button
  "#2f3135": "#22384c",
  "#4b4d52": "#3f5566", // body text
  "#5a5d63": "#4d6376",
  "#6f7278": "#61788b", // muted
  "#7c7f85": "#6f8598", // footnotes
  "#83868c": "#768c9f",
  "#8a8d93": "#7d93a5", // placeholder text
  "#9a9da2": "#8ea2b2",
  "#a5a8ad": "#9aacbb",
  "#b0b3b8": "#a5b6c3",
  "#b7b9bd": "#adbcc8",
  "#c0c2c6": "#b6c4d0",
  "#c9cbcf": "#c0ccd7",
  "#d2d4d7": "#cad5de",
  "#dcdde0": "#d4dee6", // borders
  "#e1e2e4": "#dae3ea",
  "#e2e3e5": "#dbe4ea",
  "#e9eaeb": "#e3eaef",
  "#eaeaec": "#e4ebf0",
  "#eceded": "#e7edf2",
  "#ececed": "#e7edf2", // hairlines
  "#eeeff0": "#e9eff3",
  "#f0f0f1": "#ebf0f4",
  "#f0f1f1": "#ebf0f4",
  "#f2f2f3": "#eef3f7", // fills
  "#f4f4f5": "#f1f5f8",
  "#f7f7f6": "#f4f8fb", // page ground
  "#fafafa": "#f8fbfd",
};

function applyTheme(css) {
  return css.replace(/#[0-9a-f]{6}\b/gi, (hex) => THEME[hex.toLowerCase()] || hex);
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

const sharedCss = [...sharedSeen].map(([s, d]) => `${s}{${d}}`).join("\n");

for (const key of Object.keys(content)) content[key] = applyTheme(content[key]);

const pagesJs =
  "window.PAGE_CSS = " + JSON.stringify(applyTheme(sharedCss + "\n" + scoped.join("\n"))) + ";\n" +
  "window.PAGE_HTML = " + JSON.stringify(content) + ";";

const shell = applyTheme(readFileSync(new URL("prototype-shell.html", import.meta.url), "utf8"));
if (!shell.includes("/*__PAGES__*/")) throw new Error("shell is missing the /*__PAGES__*/ slot");
// JSON.stringify never emits "</script>", but a page's own copy could; be safe.
const out = shell.replace("/*__PAGES__*/", pagesJs.replace(/<\/script>/gi, "<\\/script>"));
writeFileSync(new URL("cxm-prototype.html", import.meta.url), out);

const bytes = Object.values(content).reduce((n, s) => n + s.length, 0);
console.log(`cxm-prototype.html — ${(out.length / 1024).toFixed(0)}KB total`);
console.log(`  ${PAGES.length} pages, ${(bytes / 1024).toFixed(0)}KB content, ${((sharedCss.length + scoped.join("").length) / 1024) | 0}KB page css`);
for (const [key] of PAGES) console.log(`  ${key.padEnd(16)} ${(content[key].length / 1024).toFixed(1)}KB`);
