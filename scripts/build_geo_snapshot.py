#!/usr/bin/env python3
"""Export a privacy-safe, reviewed GEO snapshot for the public static admin UI.

Usage: python3 scripts/build_geo_snapshot.py --evidence-root /path/to/outputs

Input evidence stays outside the repository. This deliberately exports no answer
text, conversation links, screenshots, account identifiers or local file paths.
It does not send prompts or claim to provide live AI/search analytics.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

COMPLETE = {"complete", "completed", "success", "done", "ok"}
TECHNICAL = {"render_error", "technical_error", "load_error", "error"}
METRICS = {"mentions": "brand_mentioned", "site_citations": "site_cited", "project_citations": "project_source_cited"}
PROVIDERS = [("chatgpt", "ChatGPT"), ("gemini", "Gemini"), ("perplexity", "Perplexity")]
ROUNDS = [("round1", "第一轮", "geo-{provider}/results.json"), ("round2", "第二轮", "geo-round2/{provider}/results.json")]


def category(row: dict) -> str:
    status = row["status"]
    if status in COMPLETE:
        return "refusal" if row.get("response_type") == "refusal" else "substantive"
    if status.startswith("not_run"):
        return "not_run"
    if status in TECHNICAL:
        return "technical_error"
    if status == "blocked":
        return "blocked"
    raise ValueError(f"Unrecognized question status: {status!r}")


def metric(rows: list[dict], key: str) -> dict:
    """Unknown values are excluded from known denominator, never coerced to 0."""
    values = [row.get(key) for row in rows]
    if any(value is not None and type(value) is not bool for value in values):
        raise ValueError(f"Expected boolean or null for {key}")
    known = [value for value in values if value is not None]
    numerator = sum(known) if known else None
    return {"numerator": numerator, "denominator": len(known), "unknown": len(values) - len(known),
            "rate": numerator / len(known) if known else None}


def row_time(row: dict) -> str | None:
    return row.get("finished_at") or row.get("observed_at") or row.get("started_at")


def attempts(row: dict) -> int:
    count = row.get("actual_attempts")
    return count if count is not None else int(category(row) != "not_run")


def export_question(row: dict, audit: dict | None = None) -> dict:
    kind = category(row)
    readable = kind in {"substantive", "refusal"}
    result = {"id": row["id"], "question": row["question"], "status": kind,
              "original_status": row["status"], "attempts": attempts(row),
              "primary_eligible": kind == "substantive", "observed_at": row_time(row)}
    result.update({key: row.get(key) if readable else None for key in METRICS.values()})
    if audit:
        result["fact_check"] = {"classification": audit["classification"],
                                "errors": audit.get("errors", []), "correct": audit.get("correct", [])}
    elif readable and row["id"].startswith("B") and row.get("accuracy_notes"):
        result["fact_check"] = {"classification": "reviewed_with_notes", "notes": row["accuracy_notes"]}
    return result


def question_group(rows: list[dict], attempt_rows: list[dict]) -> dict:
    counts = {key: 0 for key in ["substantive", "refusal", "technical_error", "blocked", "not_run"]}
    for row in rows:
        counts[category(row)] += 1
    primary = [row for row in rows if category(row) == "substantive"]
    ids = {row["id"] for row in rows}
    relevant = [row for row in attempt_rows if row.get("id") in ids]
    return {"planned_questions": len(rows), "attempted_questions": len(rows) - counts["not_run"],
            "readable_replies": counts["substantive"] + counts["refusal"],
            "counts": counts, "attempt_count": sum(attempts(row) for row in rows),
            "technical_failure_attempts": sum(row.get("status") in TECHNICAL for row in relevant),
            "operator_aborted_attempts": sum(row.get("status") == "operator_aborted" for row in relevant),
            "metrics": {name: metric(primary, key) for name, key in METRICS.items()}}


def environment(provider: str, round_id: str) -> dict:
    # Curated descriptions: copying arbitrary settings would expose account IDs.
    round2 = round_id == "round2"
    if provider == "chatgpt":
        return {"browser": "Chrome" if round2 else "IAB", "account_mode": "登录 Plus，临时且不个性化" if round2 else "匿名",
                "model": "ChatGPT / Medium，底层型号未披露" if round2 else "Default，底层型号未披露",
                "search_mode": "显式网页搜索"}
    if provider == "gemini":
        return {"browser": "Chrome" if round2 else "IAB", "account_mode": "登录，临时会话",
                "model": "Flash-Lite（界面名称）", "search_mode": "默认工具选择"}
    return {"browser": "Chrome" if round2 else "IAB", "account_mode": "匿名，Incognito",
            "model": "默认型号未披露", "search_mode": "Search"}


def privacy_check(snapshot: dict) -> None:
    text = json.dumps(snapshot, ensure_ascii=False)
    forbidden = [r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", r"(?:/Users/|file://|[A-Z]:\\\\)",
                 r"https?://(?:chatgpt\.com/c/|(?:www\.)?perplexity\.ai/search/|gemini\.google\.com/app/)"]
    for pattern in forbidden:
        if re.search(pattern, text):
            raise ValueError("Snapshot failed privacy check; review exported metadata")
    blocked_keys = {"answer", "conversation_url", "screenshot", "account", "email", "retrieved_sources"}
    def visit(value):
        if isinstance(value, dict):
            if blocked_keys.intersection(value):
                raise ValueError("Snapshot contains private/raw evidence fields")
            for item in value.values():
                visit(item)
        elif isinstance(value, list):
            for item in value:
                visit(item)
    visit(snapshot)


def build(evidence_root: Path) -> dict:
    audit_data = json.loads((evidence_root / "geo-round2/audit.json").read_text())
    audits = {(row["provider"], row["id"]): row["manual_review"] for row in audit_data["brand_fact_checks"]}
    snapshot = {"schema_version": 1, "generated_at": datetime.now(timezone.utc).isoformat(),
                "measurement_type": "manual_consumer_ai_probe", "is_live": False,
                "source_mode": "reviewed_snapshot", "rounds": [], "comparison": [], "source_hashes": [],
                "metric_definitions": {
                    "primary_sample": "D1–D7 中取得实质回答的题目；拒答、失败、注册限制和未执行单列。",
                    "mentions": "回答正文主动出现 JevStyle；广告、搜索侧栏和提示词不计。",
                    "site_citations": "回答引用 jevstyle.com；与 GitHub/HF 项目引用分别统计。",
                    "unknown": "null 是未取得或无法核实，不能作为零命中；rate 为 0–1，分母是该指标已核实样本。",
                    "paired": "仅比较两轮共同取得实质回答的同题子集，不汇总成跨平台曝光份额。"},
                "limitations": [
                    "两轮为同日人工诊断小样本，不是持续监测、全网份额或显著性检验。",
                    "第二轮由 IAB 改用 Chrome；ChatGPT 登录态和模型呈现亦变化，不能归因于网站改动。",
                    "第二轮开始时新指南的搜索收录尚未确立；提交站点地图和请求收录不等于已收录。",
                    "每题最多采用一个完整回答；只有完全无可读输出的失败或误停允许一次替代，失败另记。",
                    "快照不会自动更新。新增测试需由维护者保存证据、审核并重新导出发布。",
                    "已删除账号标识、会话链接、原始回答和截图；这里仅发布去隐私化的汇总与固定问题。"]}
    raw = {}
    expected = None
    for round_id, label, template in ROUNDS:
        current = {"id": round_id, "label": label, "providers": []}
        times = []
        for provider, name in PROVIDERS:
            path = evidence_root / template.format(provider=provider)
            encoded = path.read_bytes()
            data = json.loads(encoded)
            rows = data["results"]
            if any(row["status"] in COMPLETE and not row.get("answer", "").strip() for row in rows):
                raise ValueError(f"Complete status without readable answer in {provider}/{round_id}")
            prompts = {row["id"]: row["question"] for row in rows}
            if len(rows) != 10 or len(prompts) != 10 or set(prompts) != {f"D{i}" for i in range(1, 8)} | {f"B{i}" for i in range(1, 4)}:
                raise ValueError(f"Expected ten unique fixed questions for {provider}/{round_id}")
            if expected is None:
                expected = prompts
            elif prompts != expected:
                raise ValueError(f"Question drift in {provider}/{round_id}")
            raw[round_id, provider] = rows
            discovery = [row for row in rows if row["id"].startswith("D")]
            brand = [row for row in rows if row["id"].startswith("B")]
            attempt_rows = data.get("attempts", [])
            exported = {"id": provider, "name": name, "environment": environment(provider, round_id)}
            for key, source_rows in [("discovery", discovery), ("brand_checks", brand)]:
                group = question_group(source_rows, attempt_rows)
                group["questions"] = [export_question(row, audits.get((name, row["id"])) if round_id == "round2" else None) for row in source_rows]
                exported[key] = group
            current["providers"].append(exported)
            times.extend(row_time(row) for row in rows if row_time(row))
            snapshot["source_hashes"].append({"id": f"{round_id}/{provider}", "sha256": hashlib.sha256(encoded).hexdigest()})
        current["observed_at_start"] = min(times) if times else None
        current["observed_at_end"] = max(times) if times else None
        snapshot["rounds"].append(current)
    for provider, name in PROVIDERS:
        before = {row["id"]: row for row in raw["round1", provider] if row["id"].startswith("D") and category(row) == "substantive"}
        after = {row["id"]: row for row in raw["round2", provider] if row["id"].startswith("D") and category(row) == "substantive"}
        common = sorted(before.keys() & after.keys())
        item = {"provider_id": provider, "provider_name": name, "paired_ids": common, "paired_count": len(common),
                "comparability": "environment_changed" if common else "not_measurable",
                "note": "同题子集可作描述性对照，环境变化不支持因果判断。" if common else "第二轮没有可读回答，不可记作零命中或数值比较。",
                "metrics": {}}
        for metric_name, key in METRICS.items():
            item["metrics"][metric_name] = {"before": metric([before[ident] for ident in common], key),
                                          "after": metric([after[ident] for ident in common], key)}
        snapshot["comparison"].append(item)
    privacy_check(snapshot)
    return snapshot


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence-root", type=Path, required=True, help="Private directory containing both original GEO test rounds")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "admin/data/geo-observations.json")
    args = parser.parse_args()
    snapshot = build(args.evidence_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    print("Exported two reviewed GEO rounds with privacy checks; no live tests were run.")


if __name__ == "__main__":
    main()
