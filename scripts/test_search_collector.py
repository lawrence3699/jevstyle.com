#!/usr/bin/env python3
"""Offline contracts for the real GSC collector. No real credentials/network."""
import io
import json
import stat
import tempfile
import unittest
import urllib.error
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import collect_search_performance as collector

NOW = datetime(2026, 10, 29, 12, tzinfo=timezone.utc)
ENV = {"GSC_CLIENT_ID": "synthetic-id", "GSC_CLIENT_SECRET": "synthetic-secret", "GSC_REFRESH_TOKEN": "synthetic-refresh"}


def row(label=None, clicks=2, impressions=20, position=3):
    result = {"clicks": clicks, "impressions": impressions, "ctr": clicks / impressions if impressions else 0, "position": position}
    if label is not None:
        result["keys"] = [label]
    return result


class FakeGoogle:
    def __init__(self, dates=None, queries=None, totals=None, probe=None, failures=None):
        self.dates = [] if dates is None else dates
        self.queries = [] if queries is None else queries
        self.totals = [] if totals is None else totals
        self.probe = {"rows": self.dates} if probe is None else probe
        self.failures = failures or {}
        self.calls = []

    def __call__(self, url, body, headers, method="POST"):
        self.calls.append((url, body, headers, method))
        if url == collector.TOKEN_URL:
            fields = urllib.parse.parse_qs(body.decode())
            assert fields == {"client_id": [ENV["GSC_CLIENT_ID"]], "client_secret": [ENV["GSC_CLIENT_SECRET"]],
                              "refresh_token": [ENV["GSC_REFRESH_TOKEN"]], "grant_type": ["refresh_token"]}
            if "oauth" in self.failures:
                raise self.failures["oauth"]
            return {"access_token": "synthetic-access", "token_type": "Bearer"}
        assert url == collector.API_BASE + "https%3A%2F%2Fjevstyle.com%2F/searchAnalytics/query"
        assert headers["Authorization"] == "Bearer synthetic-access"
        payload = json.loads(body)
        assert payload["type"] == "web" and payload["aggregationType"] == "byProperty"
        group = payload["dimensions"][0] if payload["dimensions"] else "totals"
        if payload["dataState"] == "all":
            group = "probe"
        if group in self.failures:
            raise self.failures[group]
        if group == "probe":
            return self.probe
        items = {"date": self.dates, "query": self.queries, "totals": self.totals}[group]
        offset, limit = payload["startRow"], payload["rowLimit"]
        return {"rows": items[offset:offset + limit], "responseAggregationType": "byProperty"}


class CollectorTests(unittest.TestCase):
    def test_not_configured_has_no_network_or_zero_metrics(self):
        def fail(*args, **kwargs):
            raise AssertionError("No network when credentials absent")
        result = collector.collect({}, fail, NOW)
        self.assertEqual(result["state"], "not_configured")
        self.assertEqual(result["datasets"], {})
        self.assertIsNone(result["summary"])

    def test_refresh_and_private_payload_never_contain_tokens(self):
        fake = FakeGoogle(dates=[row("2026-10-27")], queries=[row("JevStyle")], totals=[row()])
        result = collector.collect(ENV, fake, NOW)
        self.assertEqual(result["state"], "ready")
        encoded = json.dumps(result)
        for secret in list(ENV.values()) + ["synthetic-access"]:
            self.assertNotIn(secret, encoded)
        self.assertEqual(result["datasets"]["query"]["rows"][0]["brand"], "brand")

    def test_property_totals_are_not_query_sums(self):
        fake = FakeGoogle(dates=[row("2026-10-27", 10, 100)], queries=[row("local decision", 2, 10)], totals=[row(None, 12, 120, 2)])
        result = collector.collect(ENV, fake, NOW)
        self.assertEqual(result["summary"]["clicks"], 12)
        self.assertEqual(result["summary"]["source"], "property_total_api")
        self.assertFalse(result["summary"]["position_is_estimate"])
        self.assertTrue(result["datasets"]["query"]["pagination"]["api_top_rows_only"])
        self.assertEqual(result["datasets"]["query"]["rows"][0]["brand"], "nonbrand")

    def test_query_pagination_and_exact_boundary_probe(self):
        fake = FakeGoogle(queries=[row("query" + str(i)) for i in range(4)])
        result = collector.collect(ENV, fake, NOW, page_size=2, max_pages=3)
        query = result["datasets"]["query"]
        self.assertEqual(len(query["rows"]), 4)
        self.assertEqual(query["pagination"]["requests"], 3)
        self.assertTrue(query["pagination"]["terminal_empty_page"])
        self.assertFalse(query["pagination"]["client_cap_reached"])
        offsets = [json.loads(body)["startRow"] for url, body, _, _ in fake.calls
                   if url != collector.TOKEN_URL and json.loads(body)["dimensions"] == ["query"]]
        self.assertEqual(offsets, [0, 2, 4])

    def test_client_cap_remains_explicit(self):
        result = collector.collect(ENV, FakeGoogle(queries=[row("a"), row("b"), row("c")]), NOW, page_size=2, max_pages=1)
        self.assertTrue(result["datasets"]["query"]["pagination"]["client_cap_reached"])
        self.assertEqual(len(result["datasets"]["query"]["rows"]), 2)

    def test_empty_success_does_not_mean_zero_traffic_or_processing(self):
        result = collector.collect(ENV, FakeGoogle(), NOW)
        self.assertEqual(result["state"], "empty")
        self.assertIsNone(result["summary"])
        self.assertFalse(result["datasets"]["date"]["empty_is_zero_traffic"])
        self.assertEqual(len(result["datasets"]["date"]["missing_dates"]), 28)

    def test_provisional_probe_never_enters_final_metrics(self):
        fake = FakeGoogle(probe={"rows": [row("2026-10-28", 99, 999)], "metadata": {"first_incomplete_date": "2026-10-28"}})
        result = collector.collect(ENV, fake, NOW)
        self.assertEqual(result["state"], "pending_finalization")
        self.assertEqual(result["datasets"]["date"]["rows"], [])
        self.assertIsNone(result["summary"])
        self.assertEqual(result["freshness"]["first_incomplete_date"], "2026-10-28")

    def test_failed_query_and_totals_keep_date_data_with_estimate(self):
        fake = FakeGoogle(dates=[row("2026-10-27", 3, 30, 4)], failures={"query": collector.CollectionError("http_error", 503), "totals": collector.CollectionError("http_error", 503)})
        result = collector.collect(ENV, fake, NOW)
        self.assertEqual(result["state"], "partial_error")
        self.assertEqual(result["datasets"]["date"]["state"], "ready")
        self.assertEqual(result["summary"]["source"], "returned_date_rows")
        self.assertTrue(result["summary"]["not_full_window_total"])
        self.assertTrue(result["summary"]["position_is_estimate"])
        self.assertTrue(all(error["retryable"] for error in result["errors"]))

    def test_permission_error_is_not_empty(self):
        fake = FakeGoogle(failures={stage: collector.CollectionError("http_error", 403) for stage in ["date", "query", "totals", "probe"]})
        result = collector.collect(ENV, fake, NOW)
        self.assertEqual(result["state"], "auth_required")
        self.assertIsNone(result["summary"])
        self.assertEqual(result["datasets"]["date"]["state"], "auth_required")

    def test_duplicate_rows_and_unknown_metrics_fail_closed(self):
        fake = FakeGoogle(dates=[row("2026-10-27")], queries=[row("a"), row("a")])
        result = collector.collect(ENV, fake, NOW)
        self.assertEqual(result["datasets"]["query"]["state"], "error")
        self.assertIn("duplicate_row", [item["code"] for item in result["errors"]])
        with self.assertRaises(collector.CollectionError):
            collector.metrics({"clicks": True, "impressions": 3})
        with self.assertRaises(collector.CollectionError):
            collector.metrics({"clicks": None, "impressions": 3})
        self.assertIsNone(collector.metrics(row(None, 0, 0, 0))["position"])

    def test_malformed_probe_does_not_discard_ready_data(self):
        result = collector.collect(ENV, FakeGoogle(dates=[row("2026-10-27")], probe={"metadata": None}), NOW)
        self.assertEqual(result["state"], "partial_error")
        self.assertIn("invalid_freshness_metadata", [item["code"] for item in result["errors"]])

    def test_pt_calendar_and_no_timezone_database_fallback(self):
        now = datetime(2026, 10, 29, 6, tzinfo=timezone.utc)  # Still Oct 28 in PT.
        result = collector.collect({}, now=now)
        self.assertEqual(result["requested_window"]["end"], "2026-10-27")
        self.assertEqual(result["requested_window"]["start"], "2026-09-30")
        samples = [datetime(2026, month, day, hour, tzinfo=timezone.utc)
                   for month, day, hour in [(3, 8, 7), (3, 8, 10), (3, 9, 7), (11, 1, 7), (11, 1, 9), (11, 2, 7)]]
        expected = [collector.pacific_date(value) for value in samples]
        with patch.object(collector, "PT", None):
            self.assertEqual([collector.pacific_date(value) for value in samples], expected)

    def test_raw_oauth_error_description_is_not_exposed(self):
        raw = json.dumps({"error": "invalid_grant", "error_description": "synthetic-secret synthetic-refresh account@example.test"}).encode()
        error = urllib.error.HTTPError(collector.TOKEN_URL, 400, "Bad Request", {}, io.BytesIO(raw))
        with patch.object(collector.urllib.request, "urlopen", side_effect=error):
            result = collector.collect(ENV, now=NOW)
        encoded = json.dumps(result)
        self.assertEqual(result["state"], "auth_required")
        self.assertNotIn("synthetic-secret", encoded)
        self.assertNotIn("account@example", encoded)
        self.assertEqual(result["errors"][0]["code"], "auth_required")
        self.assertEqual(collector.CollectionError("token=secret").code, "collection_error")

    def test_api_disabled_and_quota_identifiers_are_safe_and_not_reauth_loops(self):
        examples = [({"error": {"message": "synthetic-secret", "details": [{"reason": "SERVICE_DISABLED"}]}}, 403, "api_not_enabled"),
                    ({"error": {"errors": [{"reason": "accessNotConfigured", "message": "private-user"}]}}, 403, "api_not_enabled"),
                    ({"error": {"status": "RESOURCE_EXHAUSTED"}}, 403, "rate_limited"),
                    ({"error": {"errors": [{"reason": "userRateLimitExceeded"}]}}, 403, "rate_limited"),
                    ({"error": "invalid_grant", "error_description": "private-token"}, 400, "auth_required")]
        for payload, status, code in examples:
            self.assertEqual(collector.google_error_code(payload, status), code)
        for code in ["api_not_enabled", "rate_limited"]:
            fake = FakeGoogle(failures={stage: collector.CollectionError(code, 403) for stage in ["date", "query", "totals", "probe"]})
            result = collector.collect(ENV, fake, NOW)
            self.assertEqual(result["state"], "error")
            self.assertEqual(result["errors"][0]["code"], code)
            self.assertNotIn("synthetic-secret", json.dumps(result))

    def test_private_output_permissions_and_public_repo_rejection(self):
        with self.assertRaises(ValueError):
            collector.write_private(Path(collector.__file__).parents[1] / "admin/data/unsafe-seo.json", {})
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "private.json"
            collector.write_private(target, {"summary": None})
            self.assertEqual(json.loads(target.read_text()), {"summary": None})
            self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o600)


if __name__ == "__main__":
    unittest.main()
