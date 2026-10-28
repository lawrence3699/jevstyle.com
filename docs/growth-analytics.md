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

Search Console's ordinary Web report is not a dedicated measurement of all AI
citations or assistant referrals. Google's current guidance also describes a
separate Generative AI performance report, where available for the property.
Keep Google Search data separate from consumer ChatGPT/Gemini/Perplexity probes.
See [Google's current AI measurement guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
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


## Automated admin SEO/GEO dashboard

The owner dashboard `/admin/` mounts all measurement panels only after the
existing `/admin/stats` authorization succeeds. API-usage 7/30/90-day controls,
GSC's rolling 28-day final-data window and GEO test rounds remain separate.

### Private SEO collection

The existing control backend exposes owner-only
`GET /control/v1/admin/search-performance`. The administrator connects Google
once through a separate Search Console read-only/offline OAuth flow. Ordinary
Google login remains `openid email profile`. No browser cookie or OAuth token is
copied into the public site repository. Refresh tokens, verifiers and cached
performance data use authenticated Fernet encryption with a dedicated random
key in a separate private key directory. Both directories have protected Windows
DACLs granting only the service account and SYSTEM. This supports the existing
S4U background task without storing a Windows password. No new database or
public storage is used.

The backend checks due work on startup and every minute, calling Google only
when connected and due (24 hours). It fetches the last 28 complete Pacific-time
calendar days with `dataState=final`, independent property totals, date rows and
query rows. Provisional diagnostics never enter final metrics. Empty responses
are not evidence of zero traffic. Query rows are only the API's top rows and may
omit anonymous/truncated queries; they are not a site-wide total.

The admin automatically reads the private cache and polls status every minute
while visible. It labels collection errors, last successful API responses and
stale snapshots. Connection, refresh and disconnect POSTs require the existing
admin session and configured same-site Origin. OAuth consent and Google API
availability are required; a configured schedule alone is not successful data
collection. See [collector contract](seo-collector.md) and
[Google's Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).

`search-performance.js` still supports the older browser-only CSV viewer as a
separate component, but the admin uses its automatic API-data mode. That mode
shows no upload or local-save controls and never reads/writes localStorage.

### Scheduled consumer-web GEO probes

The active chat task is scheduled for Monday 09:00 Australia/Sydney. It uses the
normal consumer web UIs of ChatGPT, Gemini and Perplexity with the fixed
`jevstyle-geo-web-v1` questions, independent conversations and documented modes.
It is a local scheduled agent, so the computer, app and browser access must be
available. It does not substitute API replies for consumer results or bypass
provider access walls. Failures, refusals, incomplete citations and unexecuted
questions retain their true status and null outcomes.

Raw answers/screenshots stay outside this public repository. A reviewer checks
body mentions, visible citations and current project facts. The append-only
publisher validates exact prompts, evidence, attempts and explicit review before
adding a sanitized round. It retains all prior rounds and source hashes. CI,
PR merge and successful GitHub Pages deployment complete publication; a failed
publish must not be described as an admin update. See
[run protocol and publication commands](geo-live-runs.md).

`admin/data/geo-observations.json` is intentionally public and sanitized.
`admin/data/monitoring-status.json` contains only non-sensitive schedule metadata.
`noindex` does not protect static files. No raw answers, screenshots, account
identifiers, private conversation URLs or GSC query exports may be committed.
The admin polls for changed GEO snapshots every five minutes while visible;
refreshing a page never starts new AI requests. A record more than nine days old
is visibly stale, even if the local schedule is enabled.

Cloudflare traffic remains a separate private dashboard; the temporary journey
event bridge is still not a historical conversion collector. Google Search
metrics, assistant citations and AI referral clicks have different denominators.

### Checks

```sh
python3 scripts/test_geo_snapshot.py
python3 scripts/test_append_geo_run.py
python3 scripts/test_search_collector.py
node scripts/check_search_performance.cjs
node scripts/check_search_monitor.cjs
node scripts/check_admin_gate.cjs
node --check admin/discovery.js
node --check admin/search-performance.js
node --check admin/search-monitor.js
```
