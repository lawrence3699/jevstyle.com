# JevStyle brand and distribution copy

Reviewed: 29 October 2026. These are ready-to-use factual descriptions for the
project's owned channels. They do not claim that third-party profiles were changed
by this website deployment. Verify the channel's current content before updating it.

## Naming and identity

- Project/site: **JevStyle**.
- Python distribution and repository: **jev-style**.
- Published model names: preserve exact Hugging Face IDs, for example
  **Jev-Style-2B-Decision-v4** and **Jev-Style-0.8B-Decision-v3**.
- Maintainer: **Chaoliang Yan**; GitHub **lawrence3699**; Hugging Face
  **chaoliangUNSW**. Link identities rather than presenting them as separate teams.
- Relationship: independent project, not affiliated with or endorsed by TypeSafe
  AI or the Laya authors. Do not describe JevStyle as an official Jev distribution.
- Code and published open weights: Apache-2.0; retain each distribution's license
  and notice files. A software/model license is not a hosted-service SLA.

## Short description

> Local classification and routing for AI agents, using small open decision models with probabilities for predefined answers.

## General project description

> JevStyle is an open-source toolkit for running small decision models locally. Give it text or JSON and typed questions to classify requests, choose among defined routes, or score options. Jev-Style 2B v4 also supports image questions through its PyTorch build. The toolkit includes a local API, Python client, MCP tools and a Claude Code review hook. Applications decide when to use a result and when to request human or larger-model review.

## Suggested GitHub About text

> Local decision models for AI agents: classification, routing, probabilities, MCP tools and a Claude Code review hook. Open weights; runs locally.

Website: `https://jevstyle.com/`

Do not replace the GitHub description with benchmark scores or temporary hosted-API
promotions. These age quickly and can confuse the project with the hosted service.

## README / PyPI introduction

> Run classification and routing locally with JevStyle. Its small open decision models answer typed questions with yes/no probabilities, distributions over defined choices, and ordered scores. Start with 0.8B v3 for text; use 2B v4 with PyTorch for text and images. Keep a human or larger-model fallback for uncertain or failed requests.

Suggested links:

- [Start here](https://jevstyle.com/?utm_source=github&utm_medium=readme&utm_campaign=start_here)
- [Choose a model](https://jevstyle.com/models/compare/)
- [Route a request locally](https://jevstyle.com/use-cases/local-llm-routing/)
- [Read the evaluation evidence](https://jevstyle.com/benchmarks/)

PyPI release descriptions are part of published distribution metadata. Changing
README content in Git does not rewrite a previously published PyPI artifact; use
the approved package release workflow for the next release. Do not republish or
bump a package solely to make this website task look complete.

## Model-card introduction patterns

For **Jev-Style-2B-Decision-v4**:

> Jev-Style 2B v4 is an open decision model for typed questions about text and images. The PyTorch distribution supports both input types; MLX and GGUF distributions are text-only. It scores predefined answers rather than generating a conversational reply. Use the matching JevStyle runtime, evaluate it on your own task, and retain a fallback for uncertain results.

For **Jev-Style-0.8B-Decision-v3**:

> Jev-Style 0.8B v3 is a small open text decision model and the JevStyle package's default local release. It scores typed yes/no, choice and ordered-score questions. Use it for measured classification and routing workflows, with fallback handling chosen on held-out examples.

For model-card links, use `utm_source=huggingface&utm_medium=model_card&utm_campaign=start_here`.
Keep the model-specific training, protocol, limitations and licensing sections.
Do not overwrite detailed evidence with promotional copy. Retain distillation
provenance where applicable; independence is not a claim of no training influence.

## Claims that need context

- “Local” describes local execution after necessary assets are downloaded; the
  Hugging Face demo and hosted API are remote services.
- State image support together with the model and backend.
- Give weight download size separately from runtime memory requirements.
- State calibration as task-dependent; do not promise reliable confidence on all
  inputs.
- Attach benchmark name, version, protocol and self-run status to any score.
- Do not use “secure”, “production-safe”, “guaranteed savings” or “official Jev”
  as unsupported general claims.
- Check the current hosted-service status before promising availability or a
  free quota. A historical quota is not a current service guarantee.

## Sources checked

- Site homepage, model and use-case pages.
- Package repository snapshot `8d23c82` (28 October 2026), README and pyproject.
- [Canonical package repository](https://github.com/lawrence3699/jev-style).
- [Canonical PyPI project](https://pypi.org/project/jev-style/).
- [Canonical maintainer model collection](https://huggingface.co/chaoliangUNSW).

The local package snapshot already uses a closely aligned README introduction.
Review live channel content and permissions before treating the proposed copy as
published. No external channel, account setting or package release is changed by
this document.
