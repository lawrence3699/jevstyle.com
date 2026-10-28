# Search and AI discovery baseline — 29 October 2026

Observation date: 29 October 2026 (Australia/Sydney). This document separates
observed public evidence from owner-only metrics and future measurement.

## Evidence available before this update

A public web-search tool was queried with this fixed batch:

- `site:jevstyle.com`
- `JevStyle local decision models`
- `local LLM routing JevStyle`

The returned batch contained the JevStyle homepage, the console, and the package's
GitHub repository. It also included other projects in the wider Jev-style category.
The search result for the homepage used the older title “JevStyle: open decision
models and API”; the live page inspected in this task used “JevStyle: Local
Classification and Routing for AI Agents”. Search snippets can lag a deployment.
The console's presence in a result is not proof that its current `noindex` is
ineffective; use an owner's URL Inspection result to diagnose the current state.

This was a mixed tool result, not a controlled Google or Bing SERP test. The output
does not establish rank, query-level attribution, complete index coverage, search
volume, clicks or impressions. No numerical SEO/GEO score has been assigned.

## Current availability of measurements

| Measurement | State on observation date | Required source |
| --- | --- | --- |
| Google clicks, impressions, queries, selected canonicals | Not measured; property access not available | Authorized Search Console property |
| Bing clicks, impressions and URL status | Not measured; property access not available | Authorized Bing Webmaster Tools property |
| Cloudflare page views and referrers | Beacon present; dashboard not accessed | Authorized Cloudflare Web Analytics dashboard |
| Outbound demo, model and repository events | Browser dispatch interface present; historical counts not collected | Explicit event receiver, if configured |
| Successful HF model runs | Not measured | Authorized demo-side measurement |
| Installation or retained usage | Not measured | A separate, consent-appropriate source |
| AI mentions, citations and accuracy | Fixed test set prepared below; assistant-platform runs not performed | Saved answers from controlled runs |

There is no Search Console, Bing Webmaster or analytics-specific connected tool
available in this task. This implementation does not claim to have submitted a
sitemap, verified ownership, collected private analytics, or measured assistant
recommendation rates.

## Fixed AI discovery diagnostic

Run each question in a fresh chat with browsing/search enabled when supported.
Keep the wording and language stable. Use the same provider, model, account state,
country/locale and browsing mode for comparisons; record every changed setting.
For a first diagnostic, use three independent runs per question per chosen service
and keep the original answer plus citation URLs. Label this a small convenience
sample. Do not ask the assistant to include JevStyle on the discovery questions.

| ID | Type | Exact question | Relevant destination if JevStyle is included |
| --- | --- | --- | --- |
| D1 | Discovery | How can I classify customer support tickets locally in Python without sending their contents to a hosted model? | `/use-cases/support-ticket-classification/` |
| D2 | Discovery | How can I route requests to a workflow with a small local model and send uncertain cases to a larger LLM? | `/use-cases/local-llm-routing/` |
| D3 | Discovery | What are open-source options for scoring a fixed set of choices locally on Apple silicon? | `/models/compare/` |
| D4 | Discovery | How can I add a local review layer to Claude Code tool calls, and what are its limitations? | `/guides/claude-code-guard/` |
| D5 | Discovery | How should I choose a confidence threshold for automating a text classification workflow with human fallback? | `/guides/decision-evaluation/` |
| D6 | Discovery | Which small local decision models can answer yes/no questions about receipts or screenshots? | `/models/2b-v4/` |
| D7 | Discovery | What evidence should I check before replacing label-only LLM calls with a local decision model? | `/benchmarks/` |
| B1 | Brand accuracy | What is JevStyle, who maintains it, and is it affiliated with TypeSafe AI? | `/about/` |
| B2 | Brand accuracy | For JevStyle, how do the 0.8B v3 and 2B v4 models differ in input support, backends, and weight download sizes? | `/models/compare/` |
| B3 | Brand accuracy | How do I run JevStyle locally, and is its hosted API currently available? | Homepage and `/api/` |

D1–D7 test unaided discovery. B1–B3 deliberately name the brand and test whether
facts are represented accurately; exclude these from an unaided mention rate.
None of the expected destinations requires an assistant to recommend this project.

## Recording template

Store one row per answer. Suggested CSV header:

```csv
run_id,checked_at_utc,question_id,provider,model,search_enabled,locale,account_state,brand_mentioned,official_site_cited,official_repo_or_model_card_cited,cited_urls,claim_accuracy,errors,answer_archive
```

Use `not_checked` when a fact was not checked. For `claim_accuracy`, use `accurate`,
`partly_accurate`, `inaccurate`, or `not_applicable`, accompanied by a concrete note.
A citation is useful only when its linked page supports the associated claim.

Check these facts against the current site and primary model cards:

- JevStyle is an independent project; similarity or distillation does not imply
  TypeSafe endorsement or ownership.
- The local open models and hosted API are different offerings. Check live API
  status at run time rather than copying this document's observation date.
- The package's `2b` release selects 2B v4; the default local model is 0.8B v3.
- Image support is in the 2B v4 PyTorch distribution. MLX and GGUF builds are
  text-only; weight-file size is not total RAM or VRAM.
- Probabilities can be wrong or miscalibrated on a new task. Thresholds need
  held-out data; a guard is not a sandbox or a security guarantee.
- Public self-run benchmark results are not official leaderboard ranks. Do not
  combine different evaluation scales or extrapolate a small authored test.

Summarize discovery mention frequency and supporting-citation frequency separately
using D1–D7 only. Report numerator, denominator and run settings. Report brand-fact
errors from B1–B3 separately. An answer without any mention is not a fact error.

## Follow-up after deployment

Record the deployed revision and the deployment time. Run the fixed diagnostic
without rewriting questions to improve the score. Search and AI systems may need
time to revisit pages; compare later runs with the same settings. The technical
and content work is complete when verified and deployed; indexing and audience
response remain external outcomes, not guaranteed deliverables.
