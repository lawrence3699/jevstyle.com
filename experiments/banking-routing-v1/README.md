# Local banking-support routing: reproducible project run

This is a closed-set comparison on six preselected BANKING77 intents, not the
full 77-intent benchmark. Read `protocol.json` before running. No hosted model
or customer system is contacted. The published run uses Apple M1 Max, 64 GiB,
Python 3.12.13, JevStyle 0.8B v3 / MLX 8-bit and scikit-learn 1.7.2.

The traditional classifier receives 738 labeled examples; JevStyle receives
instructions and option descriptions with no task fine-tuning. Both use 120
separate development rows for threshold selection and the same 240 test rows.
This compares deployment workflows with different supervision, not equal-data
training algorithms. Public-data pretraining overlap is unknown.

## Reproduce on an Apple silicon Mac

Use Python 3.12 and the dependency lock next to this file. The lock includes
Apple-specific MLX packages. Do not assume these timings transfer to another OS,
device, quantization, package version or process load.

```sh
git clone https://github.com/lawrence3699/jevstyle.com.git
cd jevstyle.com/experiments/banking-routing-v1
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock
.venv/bin/jev-style download --release 0.8b-v3 --backend mlx --precision 8bit
.venv/bin/python run.py --download --data-dir /tmp/jevstyle-banking77-data --output /tmp/jevstyle-banking77-run-1
```

Use a new output directory for each run. The runner rejects existing prediction
logs, verifies raw data hashes, deduplicates normalized text, removes train/test
overlap, freezes thresholds on development predictions before testing, and
records every prediction and latency. It publishes no raw customer text: source
row IDs, labels and text hashes are enough to reproduce from the original data.

`results/2026-11-01/report.json` records package versions, hardware, timings,
Wilson intervals, per-class counts and artifact hashes. `predictions.jsonl`
contains all 720 timed development/test predictions. No model or threshold was
changed in response to test accuracy. The model's top option probability is used
for selection; the separately normalized `confidence` field is not used.

The single run found 229/240 correct for TF-IDF + logistic regression and 224/240
for JevStyle. The selected JevStyle threshold accepted all test rows, giving
16/240 errors (6.7%), exceeding the development error target of 5%. The target
is an observed development rule, not a held-out guarantee. No end-to-end human
or LLM fallback quality, cost, latency or safety outcome is measured.

## Dataset attribution and changes

BANKING77 is © PolyAI Limited, CC BY 4.0. Source:
[PolyAI-LDN/task-specific-datasets](https://github.com/PolyAI-LDN/task-specific-datasets),
raw CSVs pinned to `9d081458ff52e53cf7e848f414e6e9344e4e6696`.
See the upstream [license](https://github.com/PolyAI-LDN/task-specific-datasets/blob/master/LICENSE).
We select six intents, normalize text for deduplication, derive a development
split, and publish derived IDs/hashes, labels and predictions. The upstream data
are not relabeled. The data license is separate from this project's Apache-2.0
code license.

Citation: Iñigo Casanueva, Tadas Temčinas, Daniela Gerz, Matthew Henderson,
Ivan Vulić (2020), *Efficient Intent Detection with Dual Sentence Encoders*,
NLP4ConvAI, ACL. [Paper](https://arxiv.org/abs/2003.04807).

Before any dataset predictions, a preflight corrected the upstream category ID
`pending_bank_transfer` to `pending_transfer`; the intended scenario was unchanged.
