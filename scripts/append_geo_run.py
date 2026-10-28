#!/usr/bin/env python3
"""Validate private consumer-web GEO evidence and append its safe public summary.

This program never calls an AI service, infers mentions from text, or creates a
schedule. The collector/reviewer supplies explicit observations with local
evidence. Raw evidence must stay outside the public repository.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from build_geo_snapshot import METRICS, PROVIDERS, metric, privacy_check

PROTOCOL = "jevstyle-geo-web-v1"
STATUSES = ("substantive", "refusal", "technical_error", "blocked", "not_run")
ATTEMPT_STATUSES = {"substantive", "refusal", "technical_error", "blocked", "operator_aborted"}
ACCOUNT_MODES = {"anonymous", "anonymous_incognito", "logged_in_temporary", "logged_in_no_personalization", "logged_in", "logged_in_mixed_session_modes"}
ENVIRONMENT_DEVIATIONS = {"temporary_mode_not_confirmed": "该题发送后未确认临时对话标识，保留原答复并单列环境偏离。"}
SEARCH_MODES = {"explicit_web_search", "default_tools", "search", "not_available"}
BROWSERS = {"Chrome", "IAB", "Edge", "Firefox", "Safari", "unavailable"}
FIELDS = tuple(METRICS.values())
ERROR_CODES = {
    "maintainer": "维护者姓名有误", "version": "模型版本有误", "backend": "后端支持有误",
    "image_support": "图片输入支持有误", "service_availability": "托管服务状态有误",
    "training_provenance": "训练来源有误", "affiliation": "项目隶属关系有误",
    "installation": "安装说明有误", "license": "许可说明有误", "weight_download_size": "权重下载大小有误",
    "context_limit": "输入上下文限制有误", "other": "存在其他已复核事实错误",
}
CLASSIFICATIONS = {"accurate", "partly_accurate", "inaccurate", "unreviewed"}
PROMPTS = {
    "D1": "How can I classify customer support tickets locally in Python without sending their contents to a hosted model?",
    "D2": "How can I route requests to a workflow with a small local model and send uncertain cases to a larger LLM?",
    "D3": "What are open-source options for scoring a fixed set of choices locally on Apple silicon?",
    "D4": "How can I add a local review layer to Claude Code tool calls, and what are its limitations?",
    "D5": "How should I choose a confidence threshold for automating a text classification workflow with human fallback?",
    "D6": "Which small local decision models can answer yes/no questions about receipts or screenshots?",
    "D7": "What evidence should I check before replacing label-only LLM calls with a local decision model?",
    "B1": "What is JevStyle, who maintains it, and is it affiliated with TypeSafe AI?",
    "B2": "For JevStyle, how do the 0.8B v3 and 2B v4 models differ in input support, backends, and weight download sizes?",
    "B3": "How do I run JevStyle locally, and is its hosted API currently available?",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def timestamp(value, field):
    require(isinstance(value, str), field + " must be an ISO timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(field + " must be an ISO timestamp") from exc
    require(parsed.tzinfo is not None and parsed.utcoffset() is not None, field + " requires a timezone")
    return parsed.astimezone(timezone.utc)


def digest(blob):
    return hashlib.sha256(blob).hexdigest()


def short(value, field, maximum=120):
    require(isinstance(value, str) and value.strip() and len(value) <= maximum, field + " is missing or too long")
    require(not re.search(r"[\x00-\x1f]|https?://|file://|/Users/|/home/|\\", value), field + " contains a URL/path/control value")
    privacy_check({"value": value})
    return value


def environment(value):
    require(isinstance(value, dict) and set(value) == {"browser", "account_mode", "model", "search_mode"}, "environment must contain only public UI metadata")
    require(value["browser"] in BROWSERS, "Unknown browser")
    require(value["account_mode"] in ACCOUNT_MODES, "Use a public account-mode category, not an identifier")
    require(value["search_mode"] in SEARCH_MODES, "Unknown search mode")
    return {key: short(value[key], "environment." + key) for key in value}


def evidence_file(root, relative, field, records):
    require(isinstance(relative, str) and relative and not Path(relative).is_absolute(), field + " must be relative to the private evidence directory")
    path = (root / relative).resolve()
    require(path.is_relative_to(root.resolve()) and path.is_file(), field + " is missing or escapes the evidence directory")
    require(path.stat().st_size <= 15 * 1024 * 1024, field + " is too large")
    blob = path.read_bytes()
    require(bool(blob), field + " is empty")
    records[relative] = digest(blob)
    return blob


def evidence(root, value, readable, answer, records, allow_error=False):
    require(isinstance(value, dict), "An attempted reply requires evidence metadata")
    if readable:
        blob = evidence_file(root, value.get("answer_text"), "answer_text", records)
        require(blob.decode("utf-8").strip() == answer.strip(), "Saved answer text differs from the reviewed answer")
    if value.get("screenshot"):
        blob = evidence_file(root, value["screenshot"], "screenshot", records)
        require(len(blob) > 32 and (blob.startswith(b"\x89PNG\r\n\x1a\n") or blob.startswith(b"\xff\xd8\xff") or (blob.startswith(b"RIFF") and blob[8:12] == b"WEBP")), "Screenshot is not a supported image")
    else:
        require(not readable and allow_error and value.get("error_text"), "A readable reply or visible restriction requires a screenshot")
        evidence_file(root, value["error_text"], "error_text", records)


def target_source(url, kind):
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower().removeprefix("www.")
    parts = [piece.lower() for piece in parsed.path.split("/") if piece]
    if kind == "site_cited":
        return host == "jevstyle.com"
    if host in {"github.com", "raw.githubusercontent.com"}:
        return len(parts) >= 2 and parts[0] == "lawrence3699" and parts[1] in {"jev-style", "jevstyle.com"}
    if host == "huggingface.co":
        if parts and parts[0] == "spaces":
            parts = parts[1:]
        return len(parts) >= 2 and parts[0] == "chaoliangunsw" and parts[1].startswith("jev")
    return False


def review(row):
    for field in FIELDS:
        require(field in row and (row[field] is None or type(row[field]) is bool), field + " must be explicit boolean/null")
    check = row.get("review")
    require(isinstance(check, dict) and check.get("reviewed") is True, "Readable answer has not been reviewed")
    require(check.get("reviewer_type") in {"agent", "human"}, "Reviewer type must be agent/human")
    require(check.get("scope") == "answer_body_and_visible_citations", "Review must exclude prompts, UI, advertisements and sidebars")
    coverage = check.get("citation_coverage")
    require(coverage in {"complete", "partial", "unavailable"}, "Citation coverage must be explicit")
    citations = row.get("citations", [])
    require(isinstance(citations, list) and len(citations) <= 100, "Invalid citation list")
    urls = []
    for citation in citations:
        require(isinstance(citation, dict) and isinstance(citation.get("url"), str), "Citation requires captured URL")
        url = citation["url"]
        parsed = urlparse(url)
        require(parsed.scheme in {"http", "https"} and parsed.hostname and not parsed.username and not parsed.password, "Invalid captured citation URL")
        urls.append(url)
    for field in ("site_cited", "project_source_cited"):
        seen = any(target_source(url, field) for url in urls)
        require(row[field] is not True or seen, "Positive citation flag requires a matching captured target URL")
        require(not (row[field] is False and seen), "Citation flag contradicts captured target URL")
        require(coverage == "complete" or row[field] is not False, "Incomplete citation review must preserve unknown as null")


def fact_check(row):
    raw = row.get("fact_check")
    if raw is None:
        return None
    require(row["id"].startswith("B"), "Fact checks belong only to branded diagnostic questions")
    require(isinstance(raw, dict) and raw.get("classification") in CLASSIFICATIONS, "Invalid fact-check classification")
    codes = raw.get("error_codes", [])
    require(isinstance(codes, list) and len(codes) == len(set(codes)) and all(code in ERROR_CODES for code in codes), "Use allowlisted fact error codes")
    require(not (raw["classification"] == "accurate" and codes), "Accurate classification cannot contain errors")
    return {"classification": raw["classification"], "errors": [ERROR_CODES[code] for code in codes], "correct": []}


def export_provider(raw, root, start, end, file_hashes):
    ident = raw.get("id")
    names = dict(PROVIDERS)
    require(ident in names, "Unsupported provider")
    env = environment(raw.get("environment"))
    require(raw.get("availability") in {"available", "partial", "unavailable"}, "Provider availability must be recorded")
    rows = raw.get("results")
    require(isinstance(rows, list) and len(rows) == len(PROMPTS), "Each provider requires ten question records, including not_run")
    require({row.get("id") for row in rows} == set(PROMPTS), "Question IDs must be unique and fixed")
    attempts = raw.get("attempts")
    require(isinstance(attempts, list), "Complete attempt log is required")
    by_id = {key: [] for key in PROMPTS}
    for item in attempts:
        require(isinstance(item, dict) and item.get("id") in PROMPTS and item.get("status") in ATTEMPT_STATUSES, "Invalid attempt record")
        began = timestamp(item.get("started_at"), "attempt.started_at")
        finished = timestamp(item.get("finished_at"), "attempt.finished_at")
        require(start <= began <= finished <= end, "Attempt time is outside run bounds")
        require(type(item.get("readable_output")) is bool, "Attempt readable_output must be explicit")
        require(item["readable_output"] == (item["status"] in {"substantive", "refusal"}), "Attempt readability contradicts status")
        evidence(root, item.get("evidence"), False, "", file_hashes, allow_error=item["status"] in {"technical_error", "operator_aborted"})
        by_id[item["id"]].append(item)
    exported_rows = []
    for row in sorted(rows, key=lambda row: list(PROMPTS).index(row["id"])):
        qid, status = row["id"], row.get("status")
        require(row.get("question") == PROMPTS[qid], "Fixed prompt drift: " + qid)
        require(status in STATUSES, "Unknown question status")
        history = by_id[qid]
        require(type(row.get("actual_attempts")) is int and row["actual_attempts"] == len(history), "Question attempt count differs from evidence log")
        require(len(history) <= 2, "At most one no-output replacement is allowed")
        if status == "not_run":
            require(not history, "not_run question cannot have a sent attempt")
            observed = None
        else:
            require(bool(history), "Attempted question has no attempt evidence")
            require([x.get("attempt") for x in history] == list(range(1, len(history) + 1)), "Attempt numbers must be sequential")
            require(all(timestamp(history[i]["started_at"], "replacement start") >= timestamp(history[i - 1]["finished_at"], "prior attempt end") for i in range(1, len(history))), "Replacement cannot precede the failed attempt")
            require(len(history) == 1 or (history[0]["status"] in {"technical_error", "operator_aborted"} and not history[0]["readable_output"]), "A complete/refused/blocked reply must not be retried")
            final = history[-1]
            require(final["status"] == status or (status == "technical_error" and final["status"] == "operator_aborted"), "Question status contradicts final attempt")
            observed = final["finished_at"]
        readable = status in {"substantive", "refusal"}
        if readable:
            require(isinstance(row.get("answer"), str) and row["answer"].strip(), "Readable answer needs captured body text")
            evidence(root, row.get("evidence"), True, row["answer"], file_hashes)
            review(row)
        else:
            require(all(field in row and row[field] is None for field in FIELDS), "No-output outcomes must be null, never false")
            require(not row.get("answer"), "No-output record cannot contain an answer")
        public = {"id": qid, "question": PROMPTS[qid], "status": status, "original_status": status,
                  "attempts": len(history), "primary_eligible": status == "substantive", "observed_at": observed}
        public.update({field: row[field] for field in FIELDS})
        if "environment_deviation" in row:
            deviation = row["environment_deviation"]
            require(deviation in ENVIRONMENT_DEVIATIONS, "Unknown environment deviation code")
            require(env["account_mode"] == "logged_in_mixed_session_modes", "Question environment deviation requires mixed-session provider metadata")
            public["environment_deviation"] = {"code": deviation, "description": ENVIRONMENT_DEVIATIONS[deviation]}
        checked = fact_check(row)
        if checked:
            require(readable, "Cannot fact-check an unreadable answer")
            public["fact_check"] = checked
        exported_rows.append(public)
    if raw["availability"] == "available":
        require(any(row["status"] in {"substantive", "refusal"} for row in exported_rows), "Available provider has no readable UI reply")
    if raw["availability"] == "unavailable":
        require(not any(row["status"] in {"substantive", "refusal"} for row in exported_rows), "A provider with readable replies must be available/partial")
    if not attempts:
        require(raw["availability"] == "unavailable", "An unattempted provider must be unavailable")
        require(raw.get("unavailability_code") in {"browser_unavailable", "authentication_required", "provider_unavailable", "not_authorized"}, "Unattempted provider needs an explicit unavailability reason")
        evidence(root, raw.get("availability_evidence"), False, "", file_hashes, allow_error=True)
    result = {"id": ident, "name": names[ident], "environment": env, "availability": raw["availability"]}
    for group, prefix in (("discovery", "D"), ("brand_checks", "B")):
        current = [row for row in exported_rows if row["id"].startswith(prefix)]
        relevant = [item for item in attempts if item["id"].startswith(prefix)]
        counts = {state: sum(row["status"] == state for row in current) for state in STATUSES}
        primary = [row for row in current if row["primary_eligible"]]
        result[group] = {"planned_questions": len(current), "attempted_questions": len(current) - counts["not_run"],
                         "readable_replies": counts["substantive"] + counts["refusal"], "counts": counts,
                         "attempt_count": len(relevant), "technical_failure_attempts": sum(a["status"] == "technical_error" for a in relevant),
                         "operator_aborted_attempts": sum(a["status"] == "operator_aborted" for a in relevant),
                         "metrics": {name: metric(primary, field) for name, field in METRICS.items()}, "questions": current}
    return result


def compare(before, after):
    old = {p["id"]: p for p in before["providers"]}
    output = []
    for current in after["providers"]:
        prior = old.get(current["id"])
        a = {r["id"]: r for r in prior["discovery"]["questions"] if r["primary_eligible"]} if prior else {}
        b = {r["id"]: r for r in current["discovery"]["questions"] if r["primary_eligible"]}
        shared = sorted(a.keys() & b.keys())
        output.append({"provider_id": current["id"], "provider_name": current["name"], "paired_ids": shared,
                       "paired_count": len(shared), "comparability": "same_recorded_environment" if prior and prior["environment"] == current["environment"] and shared else "environment_changed" if shared else "not_measurable",
                       "note": "同题实质回答的描述性对照；记录相同环境也不能证明因果提升。" if shared else "无共同实质回答，不能作数值比较或记为零命中。",
                       "metrics": {name: {"before": metric([a[key] for key in shared], field), "after": metric([b[key] for key in shared], field)} for name, field in METRICS.items()}})
    return {"before_round_id": before["id"], "after_round_id": after["id"], "providers": output}


def append(snapshot, run, root, run_bytes=None):
    require(snapshot.get("schema_version") == 1 and snapshot.get("rounds"), "Expected existing schema-v1 history")
    require(run.get("schema_version") == 1 and run.get("protocol") == PROTOCOL, "Unsupported collection protocol")
    require(run.get("acquisition_mode") == "consumer_web_ui", "API/synthetic answers must never enter consumer-web history")
    require(run.get("runner_kind") in {"scheduled_agent", "human"}, "Unknown runner kind")
    require(run.get("review_ready") is True, "Template/unreviewed run cannot be published")
    ident = run.get("run_id")
    require(isinstance(ident, str) and re.fullmatch(r"[a-z][a-z0-9_-]{2,79}", ident), "Invalid immutable run ID")
    require(ident not in {r["id"] for r in snapshot["rounds"]}, "Run ID already exists; history cannot be overwritten")
    label = short(run.get("label"), "label", 80)
    start, end = timestamp(run.get("started_at"), "started_at"), timestamp(run.get("finished_at"), "finished_at")
    require(start <= end and (end - start).total_seconds() <= 86400, "Run bounds are invalid or exceed 24 hours")
    prior_end = snapshot["rounds"][-1].get("observed_at_end")
    require(not prior_end or start >= timestamp(prior_end, "prior round end"), "New runs must be chronologically appended")
    providers = run.get("providers")
    require(isinstance(providers, list) and len(providers) == len(PROVIDERS) and {p.get("id") for p in providers} == {p[0] for p in PROVIDERS}, "Record all three platforms, including unavailable ones")
    file_hashes = {}
    public = {"id": ident, "label": label, "observed_at_start": start.isoformat(), "observed_at_end": end.isoformat(),
              "acquisition_mode": "consumer_web_ui", "runner_kind": run["runner_kind"], "protocol": PROTOCOL,
              "providers": [export_provider(p, root, start, end, file_hashes) for p in sorted(providers, key=lambda p: [x[0] for x in PROVIDERS].index(p["id"]))]}
    result = copy.deepcopy(snapshot)
    if "comparison_history" not in result:
        result["comparison_history"] = [{"before_round_id": "round1", "after_round_id": "round2", "providers": copy.deepcopy(snapshot.get("comparison", []))}]
    latest = compare(result["rounds"][-1], public)
    result["comparison_history"].append(latest)
    result["latest_comparison"] = copy.deepcopy(latest)
    result["rounds"].append(public)
    raw = run_bytes if run_bytes is not None else json.dumps(run, ensure_ascii=False, sort_keys=True).encode()
    added_hashes = [{"id": ident + "/manifest", "sha256": digest(raw)}]
    added_hashes.extend({"id": ident + "/" + p["id"], "sha256": digest(json.dumps(p, ensure_ascii=False, sort_keys=True).encode())} for p in providers)
    result["source_hashes"].extend(added_hashes)
    result["generated_at"] = datetime.now(timezone.utc).isoformat()
    result["measurement_type"] = "consumer_ai_web_probe"
    result["source_mode"] = "reviewed_run_history"
    result["is_live"] = False
    result["limitations"] = [text.replace("两轮为同日人工诊断小样本", "历史前两轮为同日人工诊断小样本").replace("快照不会自动更新。新增测试需由维护者保存证据、审核并重新导出发布。", "结果为采集、审核后发布的快照，不是实时排名；新一轮失败不会替换或删除先前结果。") for text in result.get("limitations", [])]
    privacy_check(result)
    require(result["rounds"][:-1] == snapshot["rounds"] and result["comparison"] == snapshot["comparison"] and result["source_hashes"][:len(snapshot["source_hashes"])] == snapshot["source_hashes"], "Historical data changed unexpectedly")
    report = {"schema_version": 1, "run_id": ident, "validation": "passed", "acquisition_mode": "consumer_web_ui", "source_hashes": added_hashes,
              "evidence_files_checked": len(file_hashes), "evidence_sha256": file_hashes, "public_export_contains_raw_answers": False,
              "providers": [{"id": p["id"], "availability": p["availability"], "discovery_counts": p["discovery"]["counts"], "attempt_count": p["discovery"]["attempt_count"]} for p in public["providers"]]}
    return result, report


def template():
    providers = []
    for ident, _ in PROVIDERS:
        providers.append({"id": ident, "availability": "unavailable", "unavailability_code": "browser_unavailable", "availability_evidence": {"error_text": "FILL-WITH-REAL-ERROR.txt"},
                          "environment": {"browser": "unavailable", "account_mode": "anonymous", "model": "Not observed", "search_mode": "not_available"}, "attempts": [],
                          "results": [{"id": qid, "question": prompt, "status": "not_run", "actual_attempts": 0, "answer": None, **{field: None for field in FIELDS}} for qid, prompt in PROMPTS.items()]})
    return {"schema_version": 1, "protocol": PROTOCOL, "run_id": "FILL-IMMUTABLE-RUN-ID", "label": "FILL-PUBLIC-LABEL", "acquisition_mode": "consumer_web_ui", "runner_kind": "scheduled_agent", "review_ready": False, "started_at": "FILL-ISO-TIME-WITH-TIMEZONE", "finished_at": "FILL-ISO-TIME-WITH-TIMEZONE", "providers": providers}


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix="." + path.name + ".", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(name, path)
    finally:
        if Path(name).exists():
            Path(name).unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence-dir", required=True, type=Path)
    parser.add_argument("--snapshot", type=Path, default=Path(__file__).resolve().parents[1] / "admin/data/geo-observations.json")
    parser.add_argument("--validation-report", type=Path)
    parser.add_argument("--expected-snapshot-sha256", help="Required append lease: sha256 of the current public snapshot")
    parser.add_argument("--init-template", action="store_true")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    site = Path(__file__).resolve().parents[1]
    root = args.evidence_dir.resolve()
    require(not root.is_relative_to(site), "Private evidence must stay outside the public repository")
    if args.init_template:
        root.mkdir(parents=True, exist_ok=True)
        require(not (root / "run.json").exists(), "Refusing to overwrite an existing evidence manifest")
        atomic_json(root / "run.json", template())
        print("Created a private, non-publishable collection template. No AI requests were sent.")
        return
    report_path = (args.validation_report or root / "validation.json").resolve()
    require(not report_path.is_relative_to(site), "Validation report must stay outside the public repository")
    require(bool(args.expected_snapshot_sha256), "Append requires --expected-snapshot-sha256 to prevent lost updates")
    # Advisory lock is outside the published repository. The hash lease also
    # protects other writers that do not take this lock.
    import fcntl
    lock_path = Path(tempfile.gettempdir()) / ("jevstyle-geo-" + digest(str(args.snapshot.resolve()).encode()) + ".lock")
    with lock_path.open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        prior_bytes = args.snapshot.read_bytes()
        require(digest(prior_bytes) == args.expected_snapshot_sha256, "Snapshot changed; reload current history and retry validation")
        run_bytes = (root / "run.json").read_bytes()
        require(len(run_bytes) <= 5 * 1024 * 1024, "Manifest is too large")
        updated, report = append(json.loads(prior_bytes), json.loads(run_bytes), root, run_bytes)
        atomic_json(report_path, report)
        if not args.validate_only:
            require(args.snapshot.read_bytes() == prior_bytes, "Snapshot changed during validation; nothing was published")
            atomic_json(args.snapshot, updated)
        print(json.dumps({"run_id": report["run_id"], "validation": "passed", "appended": not args.validate_only, "evidence_files_checked": report["evidence_files_checked"]}))


if __name__ == "__main__":
    main()
