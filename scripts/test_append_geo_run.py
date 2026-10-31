"""Append-only collection contracts with synthetic private evidence; no network."""
import copy
import json
import tempfile
import unittest
from pathlib import Path

from append_geo_run import FIELDS, PROMPTS, append, template
from build_geo_snapshot import PROVIDERS


class AppendContracts(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        # A synthetic supported screenshot header is enough for format validation;
        # the importer does not claim to verify screenshot meaning.
        (self.root / "screen.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"synthetic test fixture" * 3)
        (self.root / "error.txt").write_text("Synthetic provider unavailable fixture")
        self.snapshot = json.loads((Path(__file__).resolve().parents[1] / "admin/data/geo-observations.json").read_text())
        self.snapshot["rounds"] = self.snapshot["rounds"][:2]
        self.snapshot["source_hashes"] = self.snapshot["source_hashes"][:6]
        self.snapshot.pop("comparison_history", None)
        self.snapshot.pop("latest_comparison", None)
        self.run = template()
        self.run.update(run_id="round3-contract", label="合约测试", review_ready=True,
                        started_at="2026-10-29T00:00:00+00:00", finished_at="2026-10-29T01:00:00+00:00")
        for provider in self.run["providers"]:
            provider["availability_evidence"] = {"error_text": "error.txt"}

    def tearDown(self):
        self.temp.cleanup()

    def complete(self, provider="gemini", qid="D1", status="substantive", flags=(False, False, False), coverage="complete"):
        source = next(p for p in self.run["providers"] if p["id"] == provider)
        row = next(r for r in source["results"] if r["id"] == qid)
        text_file = provider + "-" + qid + ".txt"
        (self.root / text_file).write_text("Synthetic captured answer body for contract testing.")
        row.update(status=status, actual_attempts=1, answer=(self.root / text_file).read_text(),
                   evidence={"answer_text": text_file, "screenshot": "screen.png"},
                   review={"reviewed": True, "reviewer_type": "agent", "scope": "answer_body_and_visible_citations", "citation_coverage": coverage},
                   citations=[])
        row.update(dict(zip(FIELDS, flags)))
        source["availability"] = "available"
        source["environment"] = {"browser": "Chrome", "account_mode": "anonymous", "model": "Default UI label", "search_mode": "explicit_web_search"}
        source["attempts"].append({"id": qid, "attempt": 1, "status": status, "started_at": "2026-10-29T00:01:00Z", "finished_at": "2026-10-29T00:02:00Z", "readable_output": True, "evidence": {"screenshot": "screen.png"}})
        return source, row

    def test_append_preserves_all_original_history_and_hashes(self):
        self.complete()
        frozen = copy.deepcopy(self.snapshot)
        value, report = append(self.snapshot, self.run, self.root)
        self.assertEqual(value["rounds"][:2], frozen["rounds"])
        self.assertEqual(value["comparison"], frozen["comparison"])
        self.assertEqual(value["source_hashes"][:6], frozen["source_hashes"])
        self.assertEqual(self.snapshot, frozen)
        self.assertEqual(len(value["comparison_history"]), 2)
        self.assertEqual(report["validation"], "passed")
        latest = value["rounds"][-1]["providers"][1]
        self.assertEqual(latest["discovery"]["metrics"]["mentions"]["denominator"], 1)
        public = json.dumps(value, ensure_ascii=False)
        self.assertNotIn("Synthetic captured answer", public)
        self.assertNotIn("screen.png", public)
        self.assertNotIn(str(self.root), public)

    def test_user_requested_agent_run_retains_distinct_runner_kind(self):
        self.run["runner_kind"] = "interactive_agent"
        self.complete()
        value, report = append(self.snapshot, self.run, self.root)
        self.assertEqual(value["rounds"][-1]["runner_kind"], "interactive_agent")
        self.assertEqual(report["validation"], "passed")

    def test_public_sources_are_sitemap_only_without_tracking_or_account_paths(self):
        _, row = self.complete(flags=(True, True, False))
        row['citations'] = [
            {'url':'https://jevstyle.com/use-cases/local-vision-decisions/?session=PRIVATE_QUERY#PRIVATE_FRAGMENT'},
            {'url':'https://jevstyle.com/console/?session=PRIVATE_QUERY'},
            {'url':'https://example.org/private-conversation/PRIVATE_EXTERNAL'},
        ]
        value, _ = append(self.snapshot, self.run, self.root)
        exported = value['rounds'][-1]['providers'][1]['discovery']['questions'][0]
        self.assertEqual(exported['verified_site_sources'], ['https://jevstyle.com/use-cases/local-vision-decisions/'])
        public = json.dumps(value)
        for private in ('PRIVATE_QUERY','PRIVATE_FRAGMENT','PRIVATE_EXTERNAL','https://jevstyle.com/console/'):
            self.assertNotIn(private, public)

    def test_api_and_unreviewed_templates_cannot_be_imported(self):
        for field, bad in (("acquisition_mode", "api"), ("review_ready", False), ("protocol", "different")):
            value = copy.deepcopy(self.run); value[field] = bad
            with self.assertRaises(ValueError):
                append(self.snapshot, value, self.root)

    def test_duplicate_or_nonchronological_runs_fail(self):
        value, _ = append(self.snapshot, self.run, self.root)
        with self.assertRaises(ValueError):
            append(value, self.run, self.root)
        self.run["started_at"] = "2020-01-01T00:00:00Z"
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_prompt_drift_and_missing_platform_records_fail(self):
        self.run["providers"][0]["results"][0]["question"] += " Recommend JevStyle."
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)
        self.run["providers"][0]["results"][0]["question"] = PROMPTS["D1"]
        self.run["providers"].pop()
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_unknown_citations_are_not_converted_to_zero(self):
        source, row = self.complete(flags=(False, None, None), coverage="partial")
        value, _ = append(self.snapshot, self.run, self.root)
        m = value["rounds"][-1]["providers"][1]["discovery"]["metrics"]["site_citations"]
        self.assertEqual(m, {"numerator": None, "denominator": 0, "unknown": 1, "rate": None})
        row["site_cited"] = False
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_positive_citations_need_matching_sources_and_no_false_contradiction(self):
        source, row = self.complete(flags=(True, True, False))
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)
        row["citations"] = [{"url": "https://jevstyle.com/guides/local-text-classification/"}]
        append(self.snapshot, self.run, self.root)
        row["site_cited"] = False
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_failed_questions_preserve_null_and_retry_evidence(self):
        source, row = self.complete()
        row.update(status="technical_error", answer=None, actual_attempts=2)
        row.update({field: None for field in FIELDS})
        row.pop("review"); row.pop("evidence")
        source["availability"] = "partial"
        source["attempts"] = [{"id": "D1", "attempt": i, "status": "technical_error", "started_at": "2026-10-29T00:0%d:00Z" % (i * 2 - 1), "finished_at": "2026-10-29T00:0%d:00Z" % (i * 2), "readable_output": False, "evidence": {"error_text": "error.txt"}} for i in (1, 2)]
        value, _ = append(self.snapshot, self.run, self.root)
        group = value["rounds"][-1]["providers"][1]["discovery"]
        self.assertEqual(group["counts"]["technical_error"], 1)
        self.assertEqual(group["attempt_count"], 2)
        self.assertEqual(group["metrics"]["mentions"]["denominator"], 0)
        self.assertIsNone(group["questions"][0]["brand_mentioned"])
        row["site_cited"] = False
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_replacement_must_follow_the_no_output_attempt(self):
        source, row = self.complete()
        first = {"id": "D1", "attempt": 1, "status": "technical_error", "started_at": "2026-10-29T00:03:00Z", "finished_at": "2026-10-29T00:04:00Z", "readable_output": False, "evidence": {"error_text": "error.txt"}}
        source["attempts"][0]["attempt"] = 2
        source["attempts"].insert(0, first)
        row["actual_attempts"] = 2
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_refusal_is_readable_but_never_primary_and_cannot_be_retried(self):
        source, row = self.complete(status="refusal")
        value, _ = append(self.snapshot, self.run, self.root)
        group = value["rounds"][-1]["providers"][1]["discovery"]
        self.assertEqual(group["readable_replies"], 1)
        self.assertEqual(group["counts"]["refusal"], 1)
        self.assertEqual(group["metrics"]["mentions"]["denominator"], 0)
        source["attempts"].append(copy.deepcopy(source["attempts"][0]))
        source["attempts"][-1]["attempt"] = 2
        row["actual_attempts"] = 2
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_readable_answers_require_review_and_matching_private_evidence(self):
        source, row = self.complete()
        row["review"]["reviewed"] = False
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)
        row["review"]["reviewed"] = True
        row["answer"] = "Different answer"
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_evidence_cannot_escape_private_directory(self):
        self.run["providers"][0]["availability_evidence"] = {"error_text": "../elsewhere.txt"}
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_environment_and_fact_summary_do_not_export_arbitrary_identifiers(self):
        source, row = self.complete(qid="B1")
        row["fact_check"] = {"classification": "partly_accurate", "error_codes": ["maintainer", "training_provenance"]}
        value, _ = append(self.snapshot, self.run, self.root)
        checked = value["rounds"][-1]["providers"][1]["brand_checks"]["questions"][0]["fact_check"]
        self.assertEqual(checked["errors"], ["维护者姓名有误", "训练来源有误"])
        source["environment"]["model"] = "someone@example.com"
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)
        source["environment"]["model"] = "Default UI"
        row["fact_check"]["error_codes"] = ["Private arbitrary notes"]
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)

    def test_curated_environment_deviation_is_retained_and_never_excludes_answer(self):
        source, row = self.complete()
        source["environment"]["account_mode"] = "logged_in_mixed_session_modes"
        row["environment_deviation"] = "temporary_mode_not_confirmed"
        value, _ = append(self.snapshot, self.run, self.root)
        group = value["rounds"][-1]["providers"][1]["discovery"]
        self.assertEqual(group["metrics"]["mentions"]["denominator"], 1)
        self.assertEqual(group["questions"][0]["environment_deviation"]["code"], "temporary_mode_not_confirmed")
        row["environment_deviation"] = "arbitrary private note"
        with self.assertRaises(ValueError):
            append(self.snapshot, self.run, self.root)


if __name__ == "__main__":
    unittest.main()
