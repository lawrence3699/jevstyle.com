# Automatic private Search Console collection

`scripts/collect_search_performance.py` is the reusable server-side collector.
It uses the Python standard library, reads credentials only from the process
environment, and returns a credential-free payload for an authenticated private
admin API. It does not grant OAuth consent, create credentials, scrape Google
cookies, or publish search queries into the static site repository.

## Authorization and deployment

The operator must configure an OAuth client whose owner has access to the
`https://jevstyle.com/` Search Console URL-prefix property. The API must be
enabled and the grant should request only
`https://www.googleapis.com/auth/webmasters.readonly` with offline access. A
normal Google sign-in's `openid email profile` grant is insufficient. Existing
website ownership verification does not automatically grant API access.

The collector supports these process environment variables:

- `GSC_CLIENT_ID`
- `GSC_CLIENT_SECRET`
- `GSC_REFRESH_TOKEN`

Use a private backend's secret store. Never put these values in HTML, JavaScript,
workflow logs, static JSON, a public GitHub repository, or a browser's local
storage. Google recommends established OAuth libraries for implementing the
consent/callback flow; this module only exchanges an already provisioned refresh
token at the fixed Google token endpoint. No service-account private-key signing
or credential-file discovery is implemented. An existing secure backend can
provide an equivalent transport/token layer instead of installing credentials
in the static site.

Official references, checked 29 October 2026:

- [Search Analytics query reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Getting performance data and data limitations](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data)
- [Google server OAuth and offline access](https://developers.google.com/identity/protocols/oauth2/web-server#offline)

## Server integration

The pure collector does not persist data:

```python
from collect_search_performance import collect

snapshot = collect()  # Reads the three GSC_* environment variables only.
# Store snapshot in a private database/cache and serve it only after the same
# server-side admin check as /control/v1/admin/stats.
```

`collect(environ, transport, now, *, site_url, days, page_size, max_pages)` can be
injected for deterministic offline tests. The default site is JevStyle and the
default window is 28 calendar days ending yesterday in Google Search Console's
Pacific timezone. Every performance dataset uses `dataState=final`; unavailable
or provisional days are never silently converted to zero. `days` is bounded to
1–90. Display `requested_window` and freshness next to the charts.

The default transport is
`transport(url, body_bytes, headers, method="POST") -> dict`. It performs HTTPS
POST requests only to the fixed Google token or Search Console endpoints, with
an access token in an `Authorization: Bearer` header. Safe `CollectionError`
codes omit provider error bodies and descriptions because those can contain
account or resource details. The access token exists only in memory during a
collection call and is never included in the result.

For a standalone collector job, use a private destination **outside** the public
site checkout:

```sh
python3 scripts/collect_search_performance.py --days 28 --output /private/cache/gsc-performance.json
```

The CLI writes atomically with mode `0600` where POSIX permissions are supported,
prints only the state, and rejects paths within its public source repository.
Do not commit the resulting file. A private backend should normally invoke
`collect()` directly and apply its own storage ACLs, retention and authentication.
The collection module is not itself a scheduler. Keep a last-good result when a
new run fails, expose the failed attempt state and last-success timestamp, and
do not overwrite useful historical metrics with zeros or call stale data fresh.

On systems with IANA timezone data, Python `ZoneInfo` handles Pacific dates.
Windows may lack this data; the module has a dependency-free fallback for the
current US DST rule for dates from 2007 onward. Prefer an up-to-date IANA
database when available, and review that fallback if US law changes. See
[Python timezone data portability](https://docs.python.org/3/library/zoneinfo.html#data-sources)
and [NIST's current DST rules](https://www.nist.gov/pml/time-and-frequency-division/popular-links/daylight-saving-time-dst).

## Payload contract (schema version 1)

The top-level object includes:

- `source: "google_search_console_api"`, `site_url`, `search_type: "web"`,
  `observed_at`, `requested_window` with timezone and final-data state.
- `state`: `not_configured`, `auth_required`, `error`, `partial_error`, `empty`,
  `pending_finalization`, or `ready`.
- `datasets.date` and `datasets.query`, each with its own state, rows and
  pagination metadata. Errors in one dataset do not invalidate the other.
- `summary`: the unfiltered by-property API total without query/page dimensions,
  when available. If that request fails, returned date rows may provide a
  clearly marked estimate (`not_full_window_total=true`). The query table's sum
  is never used as the whole site's total.
- `freshness`: `latest_returned_final_date`, plus `first_incomplete_date` when a
  separate `dataState=all`, date-only diagnostic probe returns it. Provisional
  probe metrics are discarded and never enter charts or totals.
- `errors`: only allowlisted codes, stage, HTTP status and a retryability hint.

Rows use `label`, `clicks`, `impressions`, `ctr`, `reported_ctr`, `position`,
and `brand`. `ctr` is recomputed from returned counts; `reported_ctr` preserves
the provider value. Rank zero or rank with no impressions becomes `null`.
Query brand matching is a heuristic for `JevStyle`, `Jev-Style` and `jev style`;
ambiguous category references still require review.

Important distinctions:

- Successful empty API responses cannot establish either zero traffic or that
  Google is processing a newly verified property. They are `empty`, with
  `summary=null` and an explicit uncertainty explanation. The UI must not say
  zero clicks merely because no rows were returned.
- `pending_finalization` requires evidence from the fresh-data diagnostic probe:
  fresh rows or incomplete-date metadata while no final data was returned.
- Date responses omit days with no returned data. `missing_dates` stay unknown;
  they are not filled with zero and are not inferred to be no-traffic days.
- Query responses may omit anonymized data and be internally truncated. The
  collector pages using `rowLimit`/`startRow` and marks client caps, but even
  successful pagination cannot guarantee all query rows. Do not combine query
  totals with date or property totals as though they had one denominator.
- Ordinary `web` performance is separate from consumer ChatGPT/Gemini/Perplexity
  testing and cannot establish each assistant's unclicked brand mentions.

## Verification

```sh
python3 scripts/test_search_collector.py
python3 -c "from pathlib import Path; compile(Path('scripts/collect_search_performance.py').read_text(), 'collector', 'exec')"
```

Tests use synthetic credentials and an injected transport. They make no Google
requests and cover OAuth failures/redaction, pagination/caps, proper totals,
provisional-vs-final data, missing values, partial failures, PT date boundaries,
Windows timezone fallback, and private-output protections.
