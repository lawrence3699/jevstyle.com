# Append-only consumer-web GEO collection

`scripts/append_geo_run.py` is the validation/publication boundary for later real
GEO runs. It does **not** call an AI provider or create a schedule. A collector
uses the ordinary consumer UI of ChatGPT, Gemini and Perplexity, captures evidence
privately, explicitly reviews it, and then appends a sanitized summary. API
responses and synthetic tests must never enter this consumer-web history.

The initial two rounds and their source hashes remain immutable. The original
`comparison` remains the first-versus-second-round comparison. New paired results
are added to `comparison_history`; `latest_comparison` points to the most recent
adjacent-round comparison. Pairing always uses identical D-question IDs with
substantive replies in both rounds, separately per platform. Neither identical
recorded environments nor changes in rates establish causation.

## Private evidence directory

Keep the whole directory outside this public repository, for example in an
operator-controlled private evidence folder. Never commit raw answers, screenshots,
browser/account identifiers, conversation URLs or private source exports.

```sh
python3 scripts/append_geo_run.py --init-template --evidence-dir /private/evidence/run-20261030
```

This creates `run.json` with all ten exact protocol-v1 prompts for all three
platforms. The template has `review_ready: false` and cannot be published. Replace
the placeholders only with real observations. Record unavailable platforms rather
than omitting them; do not invent successful outputs to make a run complete.

Top-level manifest fields:

```json
{
  "schema_version": 1,
  "protocol": "jevstyle-geo-web-v1",
  "run_id": "round3-20261030",
  "label": "2026-10-30 定期复测",
  "acquisition_mode": "consumer_web_ui",
  "runner_kind": "scheduled_agent",
  "review_ready": true,
  "started_at": "2026-10-30T00:00:00Z",
  "finished_at": "2026-10-30T00:30:00Z",
  "providers": []
}
```

Each platform has its fixed `id` (`chatgpt`, `gemini`, `perplexity`), `availability`
(`available`, `partial`, `unavailable`), a full `attempts` log, and all ten
`results`. Its public `environment` contains exactly four fields:

- `browser`: `Chrome`, `IAB`, `Edge`, `Firefox`, `Safari`, or `unavailable`.
- `account_mode`: `anonymous`, `anonymous_incognito`, `logged_in_temporary`,
  `logged_in_no_personalization`, `logged_in`, or `logged_in_mixed_session_modes`.
  Never include account identity.
- `model`: the visible UI model label or `Not observed`; do not invent a backend.
- `search_mode`: `explicit_web_search`, `default_tools`, `search`, or
  `not_available`.

Use independent conversations and the exact D1–D7/B1–B3 prompts from the template.
D questions do not supply the brand. B questions intentionally supply it and are
fact checks, never discovery samples. Keep browser, model label, tool mode,
temporary-chat/personalization settings and language stable when feasible. Record
actual differences. Do not clear cookies, switch identities or bypass registration
or provider restrictions to evade a limit.

If a question was sent but its temporary-mode indicator was not confirmed, retain
the complete original reply without rerunning or dropping it. Set the provider to
`logged_in_mixed_session_modes` and that question's `environment_deviation` to the
only accepted code `temporary_mode_not_confirmed`. The public export adds a fixed
Chinese explanation; arbitrary free-text deviations are rejected. This annotation
does not remove the question from metrics and does not claim the mode was normal
or temporary when it was uncertain.

## Attempt and reply records

Record each request actually sent in `attempts`, including unsuccessful ones:

```json
{
  "id": "D1",
  "attempt": 1,
  "status": "substantive",
  "started_at": "2026-10-30T00:01:00Z",
  "finished_at": "2026-10-30T00:02:00Z",
  "readable_output": true,
  "evidence": {"screenshot": "gemini/D1.png"}
}
```

Statuses are `substantive`, `refusal`, `technical_error`, `blocked`, and (only in
attempt logs) `operator_aborted`. The final question result additionally allows
`not_run`. A refusal is a readable answer and must be retained. Never regenerate a
complete/refused/blocked answer to seek a mention. At most one replacement is
allowed, and only after an entirely unreadable technical failure or accidental
stop. Use sequential attempt numbers and retain both attempts.

Screenshots are relative files inside the private evidence directory; paths cannot
escape through `..` or symlinks. If a technical/browser error prevents a screenshot,
save the concrete error in a relative `error_text` file instead. A visible signup
wall or readable answer needs a screenshot. An entirely unattempted provider needs
`availability: unavailable`, `availability_evidence`, and an `unavailability_code`
of `browser_unavailable`, `authentication_required`, `provider_unavailable`, or
`not_authorized`.

A readable result has the exact question, captured body, matching private text
file, screenshot, explicit outcome flags and a completed review:

```json
{
  "id": "D1",
  "question": "How can I classify customer support tickets locally in Python without sending their contents to a hosted model?",
  "status": "substantive",
  "actual_attempts": 1,
  "answer": "Captured answer body goes here.",
  "evidence": {"answer_text": "gemini/D1.txt", "screenshot": "gemini/D1.png"},
  "brand_mentioned": false,
  "site_cited": false,
  "project_source_cited": false,
  "citations": [],
  "review": {
    "reviewed": true,
    "reviewer_type": "agent",
    "scope": "answer_body_and_visible_citations",
    "citation_coverage": "complete"
  }
}
```

The reviewer, not a string-matching script, decides whether the target appears in
the answer body. Exclude the user's prompt, advertisements, UI labels, suggested
queries and search sidebars. Save raw provider wording even when it is wrong.
`site_cited` means a `jevstyle.com` citation; project citations are the owned
GitHub project repositories or Jev-style Hugging Face model/demo pages. A positive
citation requires its captured target URL in `citations[].url`. Captured target
URLs cannot contradict a false flag. With `citation_coverage: partial` or
`unavailable`, unverified negative citation outcomes must remain `null`.

Unreadable, blocked and unexecuted question results must have `answer: null` and
all three outcome flags explicitly `null`. Unknown never becomes false or zero.
`actual_attempts` must equal the complete log; a `not_run` question has zero.

Optional B-question `fact_check` accepts only classifications `accurate`,
`partly_accurate`, `inaccurate`, `unreviewed`, with allowlisted `error_codes`:
`maintainer`, `version`, `backend`, `image_support`, `service_availability`,
`training_provenance`, `affiliation`, `installation`, `license`,
`weight_download_size`, `context_limit`, `other`. Public
summaries use curated descriptions, not arbitrary private review notes. Verify
each factual claim against the official current project sources; a mention with
incorrect facts is not an accuracy success.

## Validate, append and publish

Get the exact current snapshot hash with a local hashing tool. The lease prevents
silently overwriting an update from another writer. Then validate without changing
the public file:

```sh
python3 scripts/append_geo_run.py \
  --evidence-dir /private/evidence/run-20261030 \
  --expected-snapshot-sha256 CURRENT_SNAPSHOT_SHA256 \
  --validate-only
```

It creates a private `validation.json` containing validation status, checked
evidence hashes and source hashes. It does not prove screenshot semantics or AI
answer truth; the collector/reviewer remains responsible for those checks.

Run the same command without `--validate-only` to atomically append. The script
refuses duplicate IDs, nonchronological runs, prompt drift, API modes, unreviewed
replies, contradictory flags, missing evidence or private values in the public
export. It never overwrites prior rounds, their hashes, or the original comparison.
It uses a lock outside the public repository and checks the hash again before
writing. On validation failure, leave the previous admin data untouched and report
the concrete failure rather than publishing zeros.

```sh
python3 scripts/test_append_geo_run.py
python3 scripts/test_geo_snapshot.py
```

Before a scheduled collector publishes, review the diff: only sanitized history
and intended operational metadata should change. Push through the existing
reviewable repository deployment flow and verify the deployed snapshot/UI. Do not
claim an automatic admin update until the deployment succeeds. A scheduler needs
an available browser session, permitted accounts/tools, filesystem/network access
and a working publishing credential; this importer cannot provide those.
