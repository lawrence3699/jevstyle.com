#!/usr/bin/env python3
"""Read Search Console performance into a private, credential-free snapshot.

Only the standard library is used. OAuth credentials come from the process
environment, never a browser session or a source-tree credential file. This is
a collector, not an OAuth consent flow or a public/static data publisher.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

SITE = "https://jevstyle.com/"
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
TOKEN_URL = "https://oauth2.googleapis.com/token"
API_BASE = "https://www.googleapis.com/webmasters/v3/sites/"
try:
    PT = ZoneInfo("America/Los_Angeles")
except ZoneInfoNotFoundError:  # Windows may not ship an IANA timezone database.
    PT = None
MAX_RESPONSE_BYTES = 8 * 1024 * 1024
MAX_SAFE_INTEGER = 2**53 - 1
DISCOVERY_PATHS = (
    "guides/local-routing-tools/", "use-cases/local-vision-decisions/",
    "guides/replace-label-only-llm-calls/",
)
OAUTH_CODES = {"invalid_grant", "invalid_client", "unauthorized_client", "invalid_scope", "temporarily_unavailable", "invalid_request"}
ERROR_CODES = OAUTH_CODES | {"collection_error", "http_error", "network_error", "response_too_large", "invalid_json", "invalid_response",
    "not_configured", "invalid_token_response", "invalid_metric", "invalid_count", "invalid_ctr", "invalid_position", "invalid_row",
    "invalid_keys", "invalid_date", "out_of_window_date", "query_too_long", "invalid_rows", "unexpected_aggregation", "duplicate_row",
    "invalid_totals", "invalid_probe", "invalid_freshness_metadata", "api_not_enabled", "rate_limited", "auth_required"}
BRAND = re.compile(r"jev[\s-]*style", re.I)


class CollectionError(Exception):
    """Safe error metadata only. Never include provider bodies or credentials."""
    def __init__(self, code: str, http_status: int | None = None):
        self.code = code if code in ERROR_CODES else "collection_error"
        super().__init__(self.code)
        self.http_status = http_status if type(http_status) is int and 100 <= http_status <= 599 else None

    def report(self, stage: str) -> dict:
        return {"stage": stage, "code": self.code, "http_status": self.http_status,
                "retryable": self.http_status == 429 or bool(self.http_status and self.http_status >= 500) or self.code in {"network_error", "rate_limited"}}


def google_error_code(payload, http_status):
    """Read only allowlisted identifiers; never propagate provider messages."""
    raw = payload.get("error") if isinstance(payload, dict) else None
    if raw == "invalid_grant":
        return "auth_required"
    if isinstance(raw, str) and raw in OAUTH_CODES:
        return raw
    reasons = set()
    if isinstance(raw, dict):
        if isinstance(raw.get("status"), str):
            reasons.add(raw["status"])
        for key in ("errors", "details"):
            items = raw.get(key, [])
            if isinstance(items, list):
                for item in items[:20]:
                    if isinstance(item, dict) and isinstance(item.get("reason"), str):
                        reasons.add(item["reason"])
    if reasons & {"SERVICE_DISABLED", "accessNotConfigured", "serviceDisabled"}:
        return "api_not_enabled"
    if http_status == 429 or reasons & {"RESOURCE_EXHAUSTED", "RATE_LIMIT_EXCEEDED", "QUOTA_EXCEEDED",
                                      "rateLimitExceeded", "userRateLimitExceeded", "quotaExceeded", "dailyLimitExceeded"}:
        return "rate_limited"
    return "http_error"


def requires_auth(exc, oauth=False):
    return exc.code == "auth_required" or (exc.http_status in ((400, 401, 403) if oauth else (401, 403))
        and exc.code not in {"api_not_enabled", "rate_limited"})


def request_json(url: str, body: bytes, headers: dict, method: str = "POST") -> dict:
    """Network transport; injectable in tests. URLs are fixed Google endpoints."""
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read(MAX_RESPONSE_BYTES + 1)
    except urllib.error.HTTPError as exc:
        # OAuth error identifiers are allowlisted; Google messages can contain
        # property/account details, so they are deliberately not propagated.
        try:
            payload = json.loads(exc.read(32768))
        except (ValueError, TypeError, AttributeError):
            payload = None
        code = google_error_code(payload, exc.code)
        raise CollectionError(code, exc.code) from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise CollectionError("network_error") from None
    if len(data) > MAX_RESPONSE_BYTES:
        raise CollectionError("response_too_large")
    try:
        payload = json.loads(data)
    except (UnicodeError, ValueError):
        raise CollectionError("invalid_json") from None
    if not isinstance(payload, dict):
        raise CollectionError("invalid_response")
    return payload


def refresh_access_token(environ: dict, transport=request_json) -> str:
    values = [environ.get(key, "") for key in ("GSC_CLIENT_ID", "GSC_CLIENT_SECRET", "GSC_REFRESH_TOKEN")]
    if not all(isinstance(value, str) and value.strip() for value in values):
        raise CollectionError("not_configured")
    payload = transport(TOKEN_URL, urllib.parse.urlencode({
        "client_id": values[0], "client_secret": values[1], "refresh_token": values[2],
        "grant_type": "refresh_token"}).encode(), {"Content-Type": "application/x-www-form-urlencoded"})
    token = payload.get("access_token")
    token_type = payload.get("token_type", "Bearer")
    if not isinstance(token, str) or not token or not isinstance(token_type, str) or token_type.lower() != "bearer":
        raise CollectionError("invalid_token_response")
    # The token is held only in memory and only used in an Authorization header.
    return token


def pacific_date(now: datetime) -> date:
    if PT is not None:
        return now.astimezone(PT).date()
    # No dependency installation or machine-wide timezone change is required on
    # Windows. For modern US dates, encode the statutory post-2007 DST rule.
    # Fail explicitly on older dates rather than silently use a wrong offset.
    utc = now.astimezone(timezone.utc)
    if utc.year < 2007:
        raise ValueError("An IANA timezone database is required for dates before 2007")
    march = date(utc.year, 3, 1)
    november = date(utc.year, 11, 1)
    second_sunday = 1 + (6 - march.weekday()) % 7 + 7
    first_sunday = 1 + (6 - november.weekday()) % 7
    begins = datetime(utc.year, 3, second_sunday, 10, tzinfo=timezone.utc)
    ends = datetime(utc.year, 11, first_sunday, 9, tzinfo=timezone.utc)
    offset = -7 if begins <= utc < ends else -8
    return utc.astimezone(timezone(timedelta(hours=offset))).date()


def validate_site(site_url: str) -> None:
    if site_url.startswith("sc-domain:") and re.fullmatch(r"[A-Za-z0-9.-]+", site_url[10:]):
        return
    parts = urllib.parse.urlsplit(site_url)
    if parts.scheme != "https" or not parts.hostname or parts.username or parts.password or parts.query or parts.fragment:
        raise ValueError("Site must be a credential-free HTTPS URL-prefix or sc-domain property")


def number(value, *, count=False, optional=False):
    if value is None and optional:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise CollectionError("invalid_metric")
    if count:
        if value > MAX_SAFE_INTEGER or int(value) != value:
            raise CollectionError("invalid_count")
        return int(value)
    return value


def metrics(row: dict) -> dict:
    if not isinstance(row, dict):
        raise CollectionError("invalid_row")
    clicks = number(row.get("clicks"), count=True)
    impressions = number(row.get("impressions"), count=True)
    ctr = number(row.get("ctr"), optional=True)
    if ctr is not None and ctr > 1:
        raise CollectionError("invalid_ctr")
    position = number(row.get("position"), optional=True)
    if position == 0 or not impressions:
        position = None
    elif position is not None and position < 1:
        raise CollectionError("invalid_position")
    return {"clicks": clicks, "impressions": impressions, "ctr": clicks / impressions if impressions else None,
            "reported_ctr": ctr, "position": position}


def parse_row(row: dict, dimension: str, start: str, end: str) -> dict:
    values = row.get("keys") if isinstance(row, dict) else None
    if not isinstance(values, list) or len(values) != 1 or not isinstance(values[0], str) or not values[0].strip():
        raise CollectionError("invalid_keys")
    label = values[0]
    if dimension == "date":
        try:
            parsed = date.fromisoformat(label)
        except ValueError:
            raise CollectionError("invalid_date") from None
        if parsed.isoformat() != label or not start <= label <= end:
            raise CollectionError("out_of_window_date")
    elif len(label) > 10000:
        raise CollectionError("query_too_long")
    return {"label": label, **metrics(row), "brand": ("brand" if BRAND.search(label) else "nonbrand") if dimension == "query" else None}


def aggregate_rows(rows: list[dict]) -> dict | None:
    if not rows:
        return None
    clicks, impressions = sum(row["clicks"] for row in rows), sum(row["impressions"] for row in rows)
    rank_rows = [row for row in rows if row["position"] is not None and row["impressions"]]
    denominator = sum(row["impressions"] for row in rank_rows)
    return {"clicks": clicks, "impressions": impressions, "ctr": clicks / impressions if impressions else None,
            "position": sum(row["position"] * row["impressions"] for row in rank_rows) / denominator if denominator else None,
            "position_impressions": denominator, "position_is_estimate": True,
            "source": "returned_date_rows", "not_full_window_total": True}


class SearchClient:
    def __init__(self, site_url: str, token: str, transport=request_json, page_size=25000, max_pages=4):
        validate_site(site_url)
        if not 1 <= page_size <= 25000 or not 1 <= max_pages <= 20:
            raise ValueError("Invalid pagination limits")
        self.url = API_BASE + urllib.parse.quote(site_url, safe="") + "/searchAnalytics/query"
        self.token, self.transport, self.page_size, self.max_pages = token, transport, page_size, max_pages

    def query(self, start: str, end: str, dimensions: list[str], *, data_state="final", start_row=0) -> dict:
        return self.transport(self.url, json.dumps({"startDate": start, "endDate": end,
            "dimensions": dimensions, "type": "web", "aggregationType": "byProperty", "dataState": data_state,
            "rowLimit": self.page_size, "startRow": start_row}).encode(),
            {"Authorization": "Bearer " + self.token, "Content-Type": "application/json"})

    def dataset(self, start: str, end: str, dimension: str) -> dict:
        rows, seen, pages = [], set(), 0
        terminal_empty, client_cap = False, False
        for page in range(self.max_pages):
            payload = self.query(start, end, [dimension], start_row=page * self.page_size)
            pages += 1
            data = payload.get("rows", [])
            if not isinstance(data, list) or len(data) > self.page_size:
                raise CollectionError("invalid_rows")
            if payload.get("responseAggregationType", "byProperty") != "byProperty":
                raise CollectionError("unexpected_aggregation")
            for raw in data:
                row = parse_row(raw, dimension, start, end)
                if row["label"] in seen:
                    raise CollectionError("duplicate_row")
                seen.add(row["label"])
                rows.append(row)
            if len(data) < self.page_size:
                terminal_empty = not data
                break
        else:
            client_cap = True
        if dimension == "date":
            rows.sort(key=lambda row: row["label"])
        result = {"state": "ready" if rows else "empty", "rows": rows,
                  "pagination": {"page_size": self.page_size, "requests": pages,
                    "returned_rows": len(rows), "client_cap_reached": client_cap,
                    "terminal_empty_page": terminal_empty, "api_top_rows_only": dimension == "query"},
                  "empty_is_zero_traffic": False}
        if dimension == "date":
            first, last = date.fromisoformat(start), date.fromisoformat(end)
            result["missing_dates"] = [(first + timedelta(days=i)).isoformat() for i in range((last - first).days + 1)
                                       if (first + timedelta(days=i)).isoformat() not in seen]
            result["missing_dates_mean"] = "No returned final row; do not fill with zero or infer no traffic."
        else:
            result["coverage_warning"] = "Query rows may omit anonymized data and be internally truncated; pagination does not make them full-site totals."
            result["brand_rule"] = "Case-insensitive JevStyle / Jev-Style / jev style heuristic; ambiguous category uses need review."
        return result


def discovery_audit(token, transport, start, end, now):
    """Fixed-property, owner-only diagnostics; never changes the core totals.

    Empty responses remain unknown. Only an explicit API totals row may report
    zero. Query rows are evidence for returned queries, never full page totals.
    """
    headers = {"Authorization": "Bearer " + token, "Content-Type": "application/json"}
    analytics = API_BASE + urllib.parse.quote(SITE, safe="") + "/searchAnalytics/query"
    out = {"schema_version": 1, "observed_at": now.astimezone(timezone.utc).isoformat(),
           "requested_window": {"start": start, "end": end, "data_state": "final", "timezone": "America/Los_Angeles"},
           "privacy": "Private owner-only diagnostics; do not publish in static assets.", "pages": []}
    for path in DISCOVERY_PATHS:
        url = SITE + path
        page = {"url": url, "index": None, "summary": None, "date_rows": [], "query_rows": [], "errors": []}
        try:
            inspected = transport("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
                json.dumps({"inspectionUrl": url, "siteUrl": SITE, "languageCode": "en-US"}).encode(), headers)
            inspection = inspected.get("inspectionResult")
            status = inspection.get("indexStatusResult") if isinstance(inspection, dict) else None
            if not isinstance(status, dict) or status.get("verdict") not in {"PASS", "FAIL", "NEUTRAL", "VERDICT_UNSPECIFIED"}:
                raise CollectionError("invalid_response")
            page["index"] = {key: status.get(key) if isinstance(status.get(key), str) else None for key in
                ("verdict", "coverageState", "robotsTxtState", "indexingState", "pageFetchState", "lastCrawlTime", "googleCanonical", "userCanonical")}
        except CollectionError as exc:
            page["errors"].append(exc.report("index"))
        for dimensions in ([], ["date"], ["query"]):
            stage = dimensions[0] if dimensions else "totals"
            try:
                payload = transport(analytics, json.dumps({"startDate": start, "endDate": end,
                    "type": "web", "dataState": "final", "aggregationType": "byPage", "dimensions": dimensions,
                    "rowLimit": 1000, "dimensionFilterGroups": [{"filters": [{"dimension": "page", "operator": "equals", "expression": url}]}]}).encode(), headers)
                if payload.get("responseAggregationType", "byPage") != "byPage":
                    raise CollectionError("unexpected_aggregation")
                rows = payload.get("rows", [])
                if not isinstance(rows, list) or len(rows) > (1000 if dimensions else 1):
                    raise CollectionError("invalid_rows")
                if dimensions:
                    parsed = [parse_row(row, stage, start, end) for row in rows]
                    if len({row["label"] for row in parsed}) != len(parsed):
                        raise CollectionError("duplicate_row")
                    page[stage + "_rows"] = sorted(parsed, key=lambda row: row["label"]) if stage == "date" else parsed
                elif rows:
                    if not isinstance(rows[0], dict) or rows[0].get("keys") not in (None, []):
                        raise CollectionError("invalid_totals")
                    page["summary"] = {**metrics(rows[0]), "source": "page_total_api"}
            except CollectionError as exc:
                page["errors"].append(exc.report(stage))
        page["latest_returned_final_date"] = max((row["label"] for row in page["date_rows"]), default=None)
        out["pages"].append(page)
    return out


def collect(environ: dict | None = None, transport=request_json, now: datetime | None = None,
            *, site_url=SITE, days=28, page_size=25000, max_pages=4, include_discovery_audit=False) -> dict:
    """Collect private data. Tests inject transport; no credential discovery occurs."""
    if not 1 <= days <= 90:
        raise ValueError("days must be in 1..90")
    validate_site(site_url)
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError("now must include a timezone")
    end_date = pacific_date(now) - timedelta(days=1)
    start_date = end_date - timedelta(days=days - 1)
    start, end = start_date.isoformat(), end_date.isoformat()
    out = {"schema_version": 1, "source": "google_search_console_api", "site_url": site_url,
           "search_type": "web", "observed_at": now.astimezone(timezone.utc).isoformat(), "state": "not_configured",
           "requested_window": {"start": start, "end": end, "days": days,
                                "timezone": "America/Los_Angeles", "data_state": "final"},
           "datasets": {}, "summary": None, "freshness": {}, "errors": [],
           "privacy": "Private admin-only data; never publish query rows or credentials in static site assets.",
           "scope_required": SCOPE}
    try:
        token = refresh_access_token(os.environ if environ is None else environ, transport)
    except CollectionError as exc:
        out["state"] = "not_configured" if exc.code == "not_configured" else "auth_required" if requires_auth(exc, oauth=True) else "error"
        out["errors"].append(exc.report("oauth"))
        return out
    client = SearchClient(site_url, token, transport, page_size, max_pages)
    for dimension in ("date", "query"):
        try:
            out["datasets"][dimension] = client.dataset(start, end, dimension)
        except CollectionError as exc:
            out["datasets"][dimension] = {"state": "auth_required" if requires_auth(exc) else "error", "rows": []}
            out["errors"].append(exc.report(dimension))
    # Exact by-property totals are queried without query/page dimensions. Never
    # substitute the query table's sum as a site-wide performance total.
    try:
        response = client.query(start, end, [])
        rows = response.get("rows", [])
        if not isinstance(rows, list) or len(rows) > 1:
            raise CollectionError("invalid_totals")
        if response.get("responseAggregationType", "byProperty") != "byProperty":
            raise CollectionError("unexpected_aggregation")
        if rows:
            if not isinstance(rows[0], dict) or rows[0].get("keys") not in (None, []):
                raise CollectionError("invalid_totals")
            out["summary"] = {**metrics(rows[0]), "source": "property_total_api", "position_is_estimate": False,
                              "not_full_window_total": False}
    except CollectionError as exc:
        out["errors"].append(exc.report("totals"))
    dates = out["datasets"]["date"]
    if out["summary"] is None and dates["state"] == "ready":
        out["summary"] = aggregate_rows(dates["rows"])
    final_dates = [row["label"] for row in dates["rows"]]
    out["freshness"]["latest_returned_final_date"] = max(final_dates) if final_dates else None
    # An all/date probe is diagnostic only: its provisional metrics never enter
    # final datasets, totals or zero/nonzero statements.
    probe_has_rows = False
    try:
        probe = client.query(start, end, ["date"], data_state="all")
        probe_rows = probe.get("rows", [])
        if not isinstance(probe_rows, list) or len(probe_rows) > page_size:
            raise CollectionError("invalid_probe")
        for raw in probe_rows:
            parse_row(raw, "date", start, end)
        probe_has_rows = bool(probe_rows)
        metadata = probe.get("metadata", {})
        if not isinstance(metadata, dict):
            raise CollectionError("invalid_freshness_metadata")
        incomplete = metadata.get("first_incomplete_date")
        if incomplete is not None:
            try:
                parsed = date.fromisoformat(incomplete)
            except (ValueError, TypeError):
                raise CollectionError("invalid_freshness_metadata") from None
            if parsed.isoformat() != incomplete or not start <= incomplete <= end:
                raise CollectionError("invalid_freshness_metadata")
        out["freshness"]["first_incomplete_date"] = incomplete
        out["freshness"]["provisional_probe_has_rows"] = probe_has_rows
    except CollectionError as exc:
        out["errors"].append(exc.report("freshness_probe"))
        out["freshness"]["first_incomplete_date"] = None
    ready = any(data["state"] == "ready" for data in out["datasets"].values()) or out["summary"] is not None
    dataset_failure = any(data["state"] in {"error", "auth_required"} for data in out["datasets"].values())
    if ready:
        out["state"] = "partial_error" if out["errors"] else "ready"
    elif dataset_failure:
        out["state"] = "auth_required" if any(data["state"] == "auth_required" for data in out["datasets"].values()) else "error"
    elif probe_has_rows or out["freshness"].get("first_incomplete_date"):
        out["state"] = "pending_finalization"
    else:
        out["state"] = "empty" if not out["errors"] else "partial_error"
    if not ready:
        out["empty_reason"] = "No final rows returned. This does not distinguish zero traffic, processing, property history or provider omissions."
    if include_discovery_audit:
        if site_url != SITE:
            raise ValueError("Discovery audit is fixed to the JevStyle property")
        out["discovery_audit"] = discovery_audit(token, transport, start, end, now)
    return out


def write_private(path: Path, payload: dict) -> None:
    """Prevent an accidental raw-performance commit to the public Pages repo."""
    path = path.expanduser().resolve()
    repository = Path(__file__).resolve().parents[1]
    if path == repository or repository in path.parents:
        raise ValueError("Private SEO snapshots must be outside the public site repository")
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd, temp_path = tempfile.mkstemp(prefix=".gsc-", dir=str(path.parent))
    try:
        if hasattr(os, "fchmod"):
            os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2, allow_nan=False)
            handle.write("\n")
        os.replace(temp_path, path)
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True, help="Private output path outside the public site repository")
    parser.add_argument("--site-url", default=SITE)
    parser.add_argument("--days", type=int, default=28)
    args = parser.parse_args()
    try:
        payload = collect(site_url=args.site_url, days=args.days)
        write_private(args.output, payload)
    except (ValueError, OSError):
        print("GSC collection: invalid configuration or private output unavailable.")
        return 2
    print("GSC collection: " + payload["state"] + ". Private snapshot written; no credentials logged.")
    return 1 if payload["state"] in {"error", "auth_required", "not_configured", "partial_error"} else 0


if __name__ == "__main__":
    raise SystemExit(main())
