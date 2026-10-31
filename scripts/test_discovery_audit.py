#!/usr/bin/env python3
"""Contracts for private page diagnostics: missing is not zero; failures isolate."""
import json
import unittest
from datetime import datetime, timezone

import collect_search_performance as collector


class Diagnostics(unittest.TestCase):
    def call(self, transport):
        return collector.discovery_audit("synthetic-access", transport, "2026-10-03", "2026-10-30", datetime(2026, 11, 1, tzinfo=timezone.utc))

    def fake(self, url, body, headers):
        self.assertEqual(headers["Authorization"], "Bearer synthetic-access")
        request = json.loads(body)
        if "urlInspection" in url:
            self.assertEqual(request["siteUrl"], collector.SITE)
            self.assertIn(request["inspectionUrl"], [collector.SITE + p for p in collector.DISCOVERY_PATHS])
            return {"inspectionResult": {"indexStatusResult": {"verdict": "PASS", "coverageState": "Submitted and indexed"}}}
        self.assertEqual(request["aggregationType"], "byPage")
        self.assertEqual(request["dataState"], "final")
        page = request["dimensionFilterGroups"][0]["filters"][0]
        self.assertEqual(page["dimension"], "page")
        self.assertEqual(page["operator"], "equals")
        self.assertIn(page["expression"], [collector.SITE + p for p in collector.DISCOVERY_PATHS])
        if request["dimensions"]:
            return {"responseAggregationType": "byPage"}
        return {"rows": [{"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}], "responseAggregationType": "byPage"}

    def test_explicit_zero_and_empty_query_are_distinct(self):
        result = self.call(self.fake)
        self.assertEqual(len(result["pages"]), 3)
        for page in result["pages"]:
            self.assertEqual(page["summary"]["impressions"], 0)
            self.assertIsNone(page["summary"]["position"])
            self.assertEqual(page["query_rows"], [])
            self.assertIsNone(page["latest_returned_final_date"])
            self.assertEqual(page["index"]["verdict"], "PASS")
        self.assertNotIn("synthetic-access", json.dumps(result))

    def test_empty_totals_are_unknown(self):
        def empty(url, body, headers):
            if "urlInspection" in url:
                return self.fake(url, body, headers)
            return {"responseAggregationType": "byPage"}
        for page in self.call(empty)["pages"]:
            self.assertIsNone(page["summary"])
            self.assertEqual(page["errors"], [])

    def test_index_failure_keeps_performance_and_other_pages(self):
        def failed(url, body, headers):
            if "urlInspection" in url and json.loads(body)["inspectionUrl"].endswith(collector.DISCOVERY_PATHS[0]):
                raise collector.CollectionError("rate_limited", 429)
            return self.fake(url, body, headers)
        pages = self.call(failed)["pages"]
        self.assertIsNone(pages[0]["index"])
        self.assertEqual(pages[0]["summary"]["impressions"], 0)
        self.assertEqual(pages[0]["errors"][0]["code"], "rate_limited")
        self.assertEqual(pages[1]["index"]["verdict"], "PASS")

    def test_malformed_totals_do_not_become_zero(self):
        def malformed(url, body, headers):
            if "urlInspection" not in url and not json.loads(body)["dimensions"]:
                return {"rows": ["invalid"], "responseAggregationType": "byPage"}
            return self.fake(url, body, headers)
        for page in self.call(malformed)["pages"]:
            self.assertIsNone(page["summary"])
            self.assertEqual(page["errors"][0]["code"], "invalid_totals")


if __name__ == "__main__":
    unittest.main()
