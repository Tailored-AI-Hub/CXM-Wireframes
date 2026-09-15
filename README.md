# CXM Wireframes

Wireframes and a clickable prototype for a multi-tenant Voice-of-Customer / review-intelligence
platform: one dashboard shell that ingests reviews from many sources, normalises them into a
common model, and adapts its page set to whether a company runs stores or not.

Mid-fidelity greyscale. A single terracotta accent is reserved for two things only: elements that
are **conditional on company type**, and **annotations about the framework** rather than the UI.
Strip every terracotta element from a screen and what remains is the non-store build.

## The product rule these wireframes exist to express

Company/workspace selection happens **once, on the login page**. Signing in resolves one tenant
configuration bundle — branding, entity model, sources, taxonomy, page set, permissions — and the
dashboard renders from it. There is no company switcher inside the product; switching company means
signing out. A page outside a tenant's page set returns 404 rather than rendering empty.

Two company types:

| | Store-based | Non-store |
|---|---|---|
| Primary entity | Store / branch / outlet | Product / app / plan |
| Hierarchy | Brand → Region → City → Store → Counter | Brand → Product line → Product → Release / Plan |
| Exclusive pages | Store Performance, City & Region, Staff & Service Quality | Product & App, Channel Performance, Segments & Cohorts, Journey Stages |
| Shared | Overview · Reviews Feed · Insights · Competitor & Trust · Support · Data Hub · Actions · Reports |

Store-based tenants also get the product / channel / segment / cohort axes as secondary dimensions.

## What's in here

### Deliverables

| File | What it is |
|---|---|
| `cxm-prototype.html` | **Clickable prototype.** Open in a browser, pick a workspace, navigate the full page set. Nav, tabs, filter chips, review facets, column sorting and drilldowns all work. |
| `cxm-dashboard-framework.html` | **Wireframe canvas.** All 19 artboards laid out on one pan/zoom canvas across two pages (store-based, non-store). ~3 MB — it embeds its own canvas viewer. |
| `review-intelligence-framework.html` | **Framework spec.** Review of the existing build, sitemap, page specs, KPI dictionary, insight taxonomy, data model, gaps, owner requirements, roadmap. |

### Source

`*.dc.html` — one file per artboard, each a self-contained HTML page at 1440×1240 (login is
1440×900). These are the source of truth: both the canvas and the prototype are generated from them.

**Store-based page set**
`Login` · `Main` (Overview) · `ReviewsFeed` · `Insights` · `StorePerformance` · `CityRegion` ·
`ProductService` · `StaffQuality` · `Fulfilment` · `Support` · `Competitor` · `Actions` ·
`Reports` · `DataHub`

**Non-store page set**
`OverviewNonStore` · `ProductApp` · `Channels` · `Segments` · `Journey`

Other source files:

- `canvas.json` — artboard positions, canvas pages and the annotation notes
- `prototype-shell.html` — the prototype's app shell: tenant config, router, and the code that makes
  the wireframe markup interactive. Contains a `/*__PAGES__*/` slot the build fills.
- `build-prototype.mjs` — extracts each artboard's content region and scoped CSS, injects them into
  the shell, and writes `cxm-prototype.html`

## Working on it

Edit an artboard, then rebuild the prototype:

```bash
node build-prototype.mjs
```

Open `cxm-prototype.html` in a browser. The shell owns the sidebar, header and routing, so each
artboard contributes only its content region — the per-file `<aside>` and `<header>` in the
`.dc.html` sources are there for the canvas view and are stripped during the build.

To add a page: create `YourPage.dc.html` following the structure of an existing one, add it to the
`PAGES` list in `build-prototype.mjs`, add it to the right tenant's `groups` and to `TITLES` in
`prototype-shell.html`, and add an entry to `canvas.json`.

## Reading the wireframes honestly

Every figure shown is an **illustrative sample value, not a measurement**. The only real numbers
anywhere in this work are cited in the spec, and they come from the existing deployed build:
3,179 Play Store reviews, 3.84 average rating, six mock stores, and competitor mention counts of
14, 10 and 2.

The wireframes deliberately encode a set of constraints the current build does not yet meet:

- every figure carries its sample size and denominator
- every insight links back to the reviews that produced it
- every page states which sources it excludes, and why
- entities below the minimum-n threshold are listed but never ranked, benchmarked or shaded
- no revenue or footfall claim without that data joined at the same grain
- sentiment carries its origin — model-classified or derived from a star rating
