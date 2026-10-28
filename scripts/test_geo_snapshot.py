"""Measurement-contract tests; no network calls or private fixtures required."""
import unittest

from build_geo_snapshot import category, export_question, metric, privacy_check, question_group


class SnapshotContract(unittest.TestCase):
    def test_unknown_is_not_zero(self):
        value = metric([{"site_cited": False}, {"site_cited": None}], "site_cited")
        self.assertEqual(value, {"numerator": 0, "denominator": 1, "unknown": 1, "rate": 0.0})
        self.assertEqual(metric([], "site_cited"), {"numerator": None, "denominator": 0, "unknown": 0, "rate": None})

    def test_failures_refusals_and_retries_are_separate(self):
        rows = [
            {"id": "D1", "status": "render_error", "actual_attempts": 2, "brand_mentioned": False},
            {"id": "D2", "status": "complete", "response_type": "refusal", "brand_mentioned": False},
            {"id": "D3", "status": "not_run_platform_unavailable"},
            {"id": "D4", "status": "blocked"},
            {"id": "D5", "status": "complete", "brand_mentioned": True},
        ]
        value = question_group(rows, [{"id": "D1", "status": "render_error"}, {"id": "D1", "status": "render_error"}])
        self.assertEqual(value["counts"], {"substantive": 1, "refusal": 1, "technical_error": 1, "blocked": 1, "not_run": 1})
        self.assertEqual(value["attempt_count"], 5)
        self.assertEqual(value["technical_failure_attempts"], 2)
        self.assertEqual(value["metrics"]["mentions"]["denominator"], 1)
        self.assertEqual(value["metrics"]["mentions"]["numerator"], 1)

    def test_unreadable_question_export_has_null_flags(self):
        row = {"id": "D1", "question": "Fixed public question?", "status": "render_error", "brand_mentioned": False}
        value = export_question(row)
        self.assertIsNone(value["brand_mentioned"])
        self.assertFalse(value["primary_eligible"])

    def test_fail_closed_for_unknown_status_and_non_boolean_metric(self):
        with self.assertRaises(ValueError):
            category({"status": "mystery"})
        with self.assertRaises(ValueError):
            metric([{"site_cited": "false"}], "site_cited")

    def test_public_export_rejects_private_values_and_raw_fields(self):
        for data in [{"notes": "someone@example.com"}, {"notes": "/Users/person/private.json"},
                     {"notes": "https://chatgpt.com/c/private-id"}, {"answer": "Private answer"},
                     {"nested": [{"screenshot": "private.jpg"}]}]:
            with self.assertRaises(ValueError):
                privacy_check(data)
        privacy_check({"question": "What is JevStyle?", "brand_mentioned": None})


if __name__ == "__main__":
    unittest.main()
