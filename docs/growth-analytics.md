# Search, AI discovery and adoption measurement

Last reviewed: 29 October 2026 (Australia/Sydney).

## What is installed

Cloudflare Web Analytics is the site's configured page-view and referrer service.
The existing beacon is present on the homepages and public guides. Do not install
a duplicate beacon. Dashboard data was not available during this change; the
presence of the script does not establish successful collection or traffic volume.

`assets/journey.js` dispatches an in-page `jevstyle:analytics` CustomEvent. It never
sends or stores events, even when another analytics library exists on the page.
It is **not** an event dashboard or historical log. Cloudflare page views do not
include these custom event counts. No event receiver or persistent visitor ID is
configured by this change.

The following local debugging listener only prints events in the browser:

```js
window.addEventListener('jevstyle:analytics', event => {
  const {name, properties} = event.detail;
  console.debug('JevStyle event', name, properties);
});
```

For a manual smoke check, open a public page, attach the listener, follow a guide
link, and use a tutorial's Copy code button. A successful code copy should emit
`code_copy`. The browser console is temporary; exporting or collecting conversion
history needs an explicitly configured event receiver. Do not label missing
events as zero conversions.

## Event definitions

| Event | Trigger | What it establishes | What it does not establish |
| --- | --- | --- | --- |
| `demo_open` | Visitor follows a marked HF demo link | Demo intent | Successful inference |
| `quickstart_open` | Visitor follows a local-install guide link | Install intent | Package installation |
| `guide_open` | Visitor opens a use-case or evaluation guide | Guide discovery | Completed integration |
| `model_open` | Visitor opens a model reference | Model discovery | Model download or use |
| `github_open` | Visitor follows a GitHub link | Repository intent | Star, clone or adoption |
| `code_copy` | Clipboard write succeeds | Copy success | Code execution |

Payloads contain only the page path, allowlisted campaign values (`utm_source`,
`utm_medium`, `utm_campaign`), destination path and/or component ID. They exclude
pasted text, model inputs/outputs, API keys, email addresses, full URLs and arbitrary
query parameters. Keep this contract if connecting a receiver.

The HF demo is a different origin. A website `demo_open` event cannot measure its
successful model runs. Aggregate PyPI downloads, HF file requests and GitHub stars
are useful separate signals, not unique users or a cross-platform conversion funnel.

## Search baseline and launch check

Use `docs/search-ai-baseline-2026-10-29.md` for the starting evidence and fixed AI
query set. After deploying:

1. In an owner-authorized Google Search Console property, submit
   `https://jevstyle.com/sitemap.xml` and inspect the homepage, `/zh/`, each new
   landing page, and one representative existing guide. Check selected canonical,
   indexability and the rendered page. Request indexing where appropriate;
   submission is not a guarantee of indexing.
2. In an owner-authorized Bing Webmaster Tools property, submit the same sitemap
   and inspect the priority pages. No ownership token or verification record was
   available during this implementation; do not fabricate one.
3. Export the last 28 complete days of Search Console Web performance: query,
   page, country, device, clicks, impressions, CTR and average position. Record
   the export window, time zone and search type. Retain an unfiltered export and
   separately classify brand variants (`JevStyle`, `Jev-Style`, `jev style`). Review
   ambiguous category uses of “Jev-style” before calling them branded demand.
4. Export the same window from Cloudflare when accessible: landing pages,
   referrers and its documented visit/page-view measures. Preserve the provider's
   definitions. Do not combine these denominators with Search Console clicks.
5. Repeat the same exports after a comparable full window. Record release dates
   and known outages so a change is not automatically attributed to SEO.

Search Console's ordinary Web report includes eligible AI-feature traffic;
this is not a dedicated measurement of AI citations or all assistant referrals.
See [Google's AI-feature guidance](https://developers.google.com/search/docs/appearance/ai-features)
and [Search Console setup guidance](https://developers.google.com/search/docs/monitor-debug/search-console-start).

## Campaign convention

Use stable campaign labels in authored links:

- HF model card: `?utm_source=huggingface&utm_medium=model_card&utm_campaign=start_here`
- GitHub README: `?utm_source=github&utm_medium=readme&utm_campaign=start_here`
- Release post: `?utm_source=<channel>&utm_medium=release&utm_campaign=local_decisions`

Keep the canonical URL clean. Do not encode personal identifiers in campaign
parameters. The bridge reads allowlisted values but does not change Cloudflare's
collection protocol or guarantee that a dashboard exposes UTM breakdowns.

## Decision rules

- More non-brand clicks to a relevant guide with useful downstream activity is a
  better signal than a higher site-wide average ranking alone.
- Higher AI mention frequency with wrong hardware, license or availability claims
  is a failure, not a win. Record citation accuracy separately from mentions.
- A small manual AI sample is a diagnostic. Do not extrapolate a market share or
  claim statistical significance from it.
- Report unavailable metrics as **not measured**, not 0. When no impression or
  visitor denominator is available, do not invent a rate.

## Maintaining crawlable pages

After changing homepage data or copy, run:

```sh
python3 scripts/prerender_home.py
python3 scripts/build_discovery.py
python3 scripts/check_site.py
```

Keep language-specific canonical URLs and reciprocal `hreflang` links. New public
pages need sitemap entries and links from relevant existing pages. Model facts,
service availability and benchmark claims must remain consistent in the HTML,
structured data and any optional `llms.txt` index. None guarantees search ranking
or inclusion in an AI answer.
