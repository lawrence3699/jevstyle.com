#!/usr/bin/env python3
"""Frozen, project-run six-intent BANKING77 comparison. No provider API calls."""
from __future__ import annotations

import argparse
import csv
import hashlib
import importlib.metadata
import json
import math
import platform
import statistics
import subprocess
import time
import unicodedata
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def digest(data):
    return hashlib.sha256(data).hexdigest()


def normalized(text):
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n")


def interval(correct, count):
    if not count:
        return None
    z = 1.959963984540054
    p, d = correct / count, 1 + z * z / count
    center = (p + z * z / (2 * count)) / d
    half = z * math.sqrt(p * (1 - p) / count + z * z / (4 * count * count)) / d
    return [max(0, center - half), min(1, center + half)]


def threshold(rows, config):
    options = []
    for cut in config["grid"]:
        accepted = [r for r in rows if r["prediction"] is not None and r["top_probability"] >= cut]
        errors = sum(r["prediction"] != r["expected"] for r in accepted)
        if len(accepted) >= config["min_development_accepted"] and errors / len(accepted) <= config["max_development_error"]:
            options.append((len(accepted), -cut, cut))
    return max(options)[2] if options else 1.00000001


def summarize(rows, cut, labels):
    from sklearn.metrics import f1_score
    correct = sum(r["prediction"] == r["expected"] for r in rows)
    accepted = [r for r in rows if r["prediction"] is not None and r["top_probability"] >= cut]
    accepted_correct = sum(r["prediction"] == r["expected"] for r in accepted)
    durations = sorted(r["elapsed_ms"] for r in rows)
    return {
        "count": len(rows), "correct": correct, "accuracy": correct / len(rows),
        "accuracy_wilson_95": interval(correct, len(rows)),
        "macro_f1": float(f1_score([r["expected"] for r in rows], [r["prediction"] or "__error__" for r in rows], labels=labels, average="macro", zero_division=0)),
        "inference_errors": sum(r["prediction"] is None for r in rows),
        "warm_latency_ms": {"median": statistics.median(durations), "p95": durations[math.ceil(.95 * len(durations)) - 1], "total": sum(durations)},
        "threshold_from_development": cut, "accepted": len(accepted),
        "accepted_errors": len(accepted) - accepted_correct,
        "coverage": len(accepted) / len(rows), "fallback": len(rows) - len(accepted),
        "accepted_accuracy": accepted_correct / len(accepted) if accepted else None,
        "accepted_accuracy_wilson_95": interval(accepted_correct, len(accepted)),
        "per_class": {label: {"count": sum(r["expected"] == label for r in rows), "correct": sum(r["expected"] == label and r["prediction"] == label for r in rows)} for label in labels},
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--data-dir", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--download", action="store_true")
    args = ap.parse_args()
    here = Path(__file__).resolve().parent
    config_bytes = (here / "protocol.json").read_bytes()
    config = json.loads(config_bytes)
    args.data_dir.mkdir(parents=True, exist_ok=True)
    args.output.mkdir(parents=True, exist_ok=True)
    if (args.output / "predictions.jsonl").exists():
        raise SystemExit("Use a new output directory; never silently overwrite a completed or partial run.")
    started = datetime.now(timezone.utc).isoformat()
    raw = {}
    for split in ("train", "test"):
        path = args.data_dir / (split + ".csv")
        if not path.exists() and args.download:
            url = "https://raw.githubusercontent.com/" + config["source"]["repository"] + "/" + config["source"]["revision"] + "/banking_data/" + split + ".csv"
            path.write_bytes(urllib.request.urlopen(url, timeout=30).read())
        assert digest(path.read_bytes()) == config["source"][split + "_sha256"], "Dataset hash mismatch"
        with path.open(newline="") as handle:
            raw[split] = [{"source_id": split + ":" + str(i), "text": row["text"], "expected": row["category"], "text_sha256": digest(normalized(row["text"]).encode())} for i, row in enumerate(csv.DictReader(handle)) if row["category"] in config["labels"]]
    test, seen_test = [], set()
    for row in raw["test"]:
        if row["text_sha256"] not in seen_test:
            test.append(row)
            seen_test.add(row["text_sha256"])
    train, development, seen_train = [], [], set()
    for label in config["labels"]:
        group = []
        for row in raw["train"]:
            key = row["text_sha256"]
            if row["expected"] == label and key not in seen_test and key not in seen_train:
                seen_train.add(key)
                group.append(row)
        group.sort(key=lambda row: digest((str(config["seed"]) + "|" + normalized(row["text"])).encode()))
        assert len(group) > config["development_per_class"]
        development += group[:config["development_per_class"]]
        train += group[config["development_per_class"]:]
    assert not ({r["text_sha256"] for r in train} & {r["text_sha256"] for r in development})
    assert not ({r["text_sha256"] for r in train + development} & seen_test)
    split_manifest = {name: [{k: r[k] for k in ("source_id", "expected", "text_sha256")} for r in rows] for name, rows in (("train", train), ("development", development), ("test", test))}
    save(args.output / "split-manifest.json", split_manifest)
    save(args.output / "frozen-protocol.json", config)
    print("Frozen splits:", {k: len(v) for k, v in split_manifest.items()}, flush=True)
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import make_pipeline
    from threadpoolctl import threadpool_limits
    from jev_style import JevStyle, choice
    threadpool_limits(limits=1)
    labels = list(config["labels"])
    spec = config["baseline"]
    baseline = make_pipeline(TfidfVectorizer(ngram_range=tuple(spec["ngram_range"]), max_features=spec["max_features"]), LogisticRegression(C=spec["C"], max_iter=spec["max_iter"], random_state=spec["random_state"]))
    t = time.perf_counter()
    baseline.fit([r["text"] for r in train], [r["expected"] for r in train])
    fit_seconds = time.perf_counter() - t
    t = time.perf_counter()
    js = JevStyle(release=config["jevstyle"]["release"], backend="mlx", precision=config["jevstyle"]["precision"])
    load_seconds = time.perf_counter() - t
    question = {"intent": choice(config["instructions"], config["labels"])}

    def predict(method, row):
        t = time.perf_counter()
        try:
            if method == "tfidf_logistic":
                probabilities = baseline.predict_proba([row["text"]])[0]
                result = {str(k): float(v) for k, v in zip(baseline.classes_, probabilities)}
                model = "TF-IDF + LogisticRegression"
            else:
                response = js.decide(row["text"], question)
                model = response["model"]
                result = response["answers"]["intent"]["probabilities"]
                assert set(result) == set(labels)
            assert all(isinstance(v, (int, float)) and math.isfinite(v) and 0 <= v <= 1 for v in result.values())
            assert abs(sum(result.values()) - 1) < .001
            prediction = max(result, key=result.get)
            return {"prediction": prediction, "top_probability": result[prediction], "probabilities": result, "model": model, "elapsed_ms": (time.perf_counter() - t) * 1000}
        except Exception as exc:
            return {"prediction": None, "top_probability": None, "error": type(exc).__name__, "elapsed_ms": (time.perf_counter() - t) * 1000}

    all_results, thresholds = {}, {}
    with (args.output / "predictions.jsonl").open("w") as log:
        for method in ("tfidf_logistic", "jevstyle"):
            for row in development[:3]:
                warmup = predict(method, row)
                assert warmup["prediction"] is not None, "Warmup failed"
            all_results[method] = {}
            for split, rows in (("development", development), ("test", test)):
                if split == "test":
                    thresholds[method] = threshold(all_results[method]["development"], config["threshold"])
                    save(args.output / "thresholds.json", thresholds)
                    print(method, "threshold frozen:", thresholds[method], flush=True)
                results = []
                for i, row in enumerate(rows):
                    result = {"method": method, "split": split, **{k: row[k] for k in ("source_id", "expected", "text_sha256")}, **predict(method, row)}
                    results.append(result)
                    log.write(json.dumps(result, allow_nan=False) + "\n")
                    log.flush()
                    if (i + 1) % 30 == 0:
                        print(method, split, i + 1, "/", len(rows), flush=True)
                all_results[method][split] = results
    try:
        hardware = subprocess.check_output(["sysctl", "-n", "machdep.cpu.brand_string", "hw.memsize"], text=True).strip().splitlines()
    except (OSError, subprocess.CalledProcessError):
        hardware = ["unavailable"]
    report = {
        "schema_version": 1, "experiment_id": config["experiment_id"], "started_at": started,
        "finished_at": datetime.now(timezone.utc).isoformat(), "protocol_sha256": digest(config_bytes),
        "runner_sha256": digest(Path(__file__).read_bytes()), "source": config["source"],
        "hardware": {"platform": platform.platform(), "python": platform.python_version(), "cpu_and_memory_bytes": hardware},
        "packages": {name: importlib.metadata.version(name) for name in ("jev-style", "mlx", "mlx-lm", "scikit-learn", "numpy", "scipy", "transformers")},
        "model": config["jevstyle"], "split_sizes": {k: len(v) for k, v in split_manifest.items()},
        "baseline_fit_seconds": fit_seconds, "jevstyle_load_seconds": load_seconds,
        "results": {method: {split: summarize(rows, thresholds[method], labels) for split, rows in splits.items()} for method, splits in all_results.items()},
        "artifacts": {name: digest((args.output / name).read_bytes()) for name in ("split-manifest.json", "predictions.jsonl", "frozen-protocol.json", "thresholds.json")},
        "limitations": config["limitations"],
    }
    save(args.output / "report.json", report)
    print(json.dumps({method: report["results"][method]["test"] for method in report["results"]}, indent=2), flush=True)


if __name__ == "__main__":
    main()
