/* Homepage script, shared by / and /zh/. Translations live in I18N below (prerender_home.py rewrites them); page data is the inline site-data JSON in index.html. */
(function(){
const $ = id => document.getElementById(id);
const DATA = JSON.parse($('site-data').textContent);
const I18N = {
 "en": {
  "guide.0.h": "Local LLM routing",
  "guide.0.p": "Choose a route locally; send uncertain decisions to your LLM.",
  "guide.1.h": "Support ticket classification",
  "guide.1.p": "Route each ticket to a team and flag refund requests in one call.",
  "guide.2.h": "Claude Code guard",
  "guide.2.p": "Inspect tool calls with a local model and explicit rules.",
  "guide.3.h": "Evaluate your own data",
  "guide.3.p": "Measure accuracy, calibration, coverage, and latency.",
  "nav.models": "Models",
  "nav.api": "Free API",
  "nav.getkey": "Get API key",
  "nav.console": "Console",
  "api.lead": "Free hosted 2B Decision API — typed noul / choice / score.",
  "api.docs": "Free API docs",
  "api.create": "Create key",
  "api.badge": "Independent · non-TypeSafe",
  "api.strip.h": "Free Decision API",
  "api.strip.p": "Fair-use free tier. Create a key, then call api.jevstyle.com. Docs for auth, limits, and errors.",
  "nav.tl": "Timeline",
  "sec.tl": "Release timeline",
  "tl.next.when": "Next",
  "nav.demos": "Demos",
  "sec.demos": "Demos",
  "dm.sub": "Jev-Style v3, running locally",
  "dm.play": "Play video",
  "dm.more": "More demos",
  "hl.pub": "Public holdout hard agreement",
  "hl.soft": "Sensitive safe-class soft (v4)",
  "hl.adapter": "Deployable LoRA + head",
  "an.tag": "New",
  "an.text": "Jev-Style 2B v4: reads images, on the Decision Index 0.3 board (Public 44.37, Full 34.53), 32,768-token inputs",
  "one.v3-2b": "Long-input decisions at 2B. Every option scored in one pass.",
  "tl.v3-2b": "2B full fine-tune: 73.6% on JevBench, 25,600-token inputs, no option cap.",
  "planned": "planned",
  "s.optcap": "Option cap",
  "s.nocap": "None",
  "s.jb": "JevBench",
  "k.nocap": "no option cap",
  "dl.soon": "with the release",
  "pts": "points",
  "hl.jb": "JevBench v1.4.1 public accuracy, 231 items",
  "hl.ctx2b": "Input tokens, no option cap",
  "hl.jbgain": "JevBench points over the 0.8B v3",
  "sp2.c1": "JevBench v1.4.1, 231 public items",
  "sp2.c2": "JevBench, vs Jev-Style 0.8B v3",
  "sp2.c3": "tweet_topic accuracy, zero-shot, 1,693 items",
  "sp2.f1": "Macro-F1",
  "sp2.note": "JevBench v1.4.1: GGUF F16, run once with one global temperature. The lead over decider-2b (Qwen3.5-2B-Base) is inside the 95% CI (67.6–78.9%); Jev 1.13.0 is well ahead at 86.6%; 42 of 82 board systems score higher, almost all 4B or larger. tweet_topic is zero-shot (not in the training data). Trained on a reduced data pool (60M tokens); needs the shipped runtimes.",
  "demo.try": "Try it in your browser",
  "demo.soon": "Browser demo: with the release",
  "f.demo08": "Live demo (0.8B)",
  "one.v4-2b": "Decisions about text and images at 2B. Every option scored in one pass.",
  "tl.v4-2b": "2B with a vision tower: Decision Index 0.3 board Public 44.37 (Full 34.53), Vision 57.55, 32,768-token inputs.",
  "hl.di4": "Decision Index 0.3 Public score (board)",
  "hl.vis4": "Decision Index Vision Public score (board)",
  "hl.ctx4": "Input tokens, images included",
  "s.di4": "DI 0.3 public",
  "s.vis4": "Vision public",
  "b.4di": "Jev-Style 2B v4 on the Decision Index 0.3 board: Public 44.37 (Full 34.53), replacing 2B v3 (34.05) on 2026-11-04",
  "b.4jb": "Jev-Style 2B v4 accuracy on JevBench v1.4.1 (231 public items)",
  "m.di4": "Decision Index 0.3 Public score",
  "m.vis4": "Decision Index Vision Public score",
  "m.lat4": "Median latency per request",
  "m.lat4s": "750 Decision Index requests, A100, bfloat16 + CUDA graphs",
  "k.req": "requests, all answered",
  "k.rows": "rows, all answered",
  "c.di4": "Decision Index 0.3 public areas, skill × 100 (v4 replaced v3 on the board on 2026-11-04)",
  "c.jb4": "JevBench v1.4.1 public accuracy, 231 items",
  "ar.kr": "Knowledge & Reasoning",
  "ar.lu": "Language Understanding",
  "ar.rc": "Retrieval & Classification",
  "ar.ta": "Tools & Automation",
  "ar.at": "Arts & Human Taste",
  "coll.v4": "All v4 builds",
  "pr.di": "Decision Index board",
  "note.v4-2b": "Decision Index public suite 0.3 (kit 25c6ec7, the kit's own runner and scorer): one complete self-run, 140,178 requests, all answered, bfloat16 on one A100; Vision public suite: one complete run, 12,210 rows. Both are on the public Decision Index 0.3 board since 2026-11-04, replacing 2B v3: Public 44.37, Full 34.53, Breadth 41.75; Vision Public 57.55, Full 51.94. Public comes from the public suite that anyone can run; Full also includes the maintainers' private tests, which is why it is lower. JevBench v1.4.1 public items: the official harness, float32 on Apple MPS, run once (decider-2b is inside the 95% CI; Jev 1.13.0 is well ahead). Several benchmarks' official train splits are in the training data, so those results are not zero-shot. Trained in part on soft labels distilled from TypeSafe Jev 1.14 via its public API. Images need the PyTorch runtime; the GGUF and MLX builds read text only.",
  "b.2bjb": "Jev-Style 2B v3 accuracy on JevBench v1.4.1 (231 public items)",
  "b.2bjb.n": "Qwen3.5-2B family; lead inside the 95% CI",
  "b.2bjb08": "Jev-Style 2B v3 vs Jev-Style 0.8B v3 on JevBench v1.4.1",
  "b.2btt": "Jev-Style 2B v3 zero-shot accuracy on tweet_topic (1,693 items)",
  "m.jb": "JevBench v1.4.1, 231 public items",
  "m.jbgain": "JevBench points over the 0.8B v3",
  "m.tt": "tweet_topic accuracy, zero-shot, 1,693 items",
  "c.jb": "JevBench v1.4.1 public accuracy, 231 items (GGUF F16, run once)",
  "note.v3-2b": "Highest JevBench public accuracy among the Qwen3.5-2B-family systems on the v1.4.1 board (decider-2b 71.0%, open-jev-zefan-2b 64.5%). The 95% CI is 67.6–78.9%, so the lead over decider-2b is inside it. Jev is well ahead; 42 of 82 board systems score higher, almost all 4B or larger. Contamination check against the training pool: 0 hits on 4 checks. Scope: needs the shipped runtimes (block attention; stock llama.cpp, Ollama, LM Studio and mlx_lm.generate load the weights but cannot produce the scores), 25,600-token limit, trained on a reduced data pool (60M tokens).",
  "sp.new": "New model",
  "sp.tag": "One state. One pass. Every option scored.",
  "sp.c1": "Typed decisions, 2,000 items",
  "sp.c2": "Intent accuracy, 51 languages",
  "sp.c3": "Calibration error (ECE), 49 suites",
  "sp.note": "Laya: official checkpoints re-run on identical rows with their shipped temperatures. Typed decisions: both models were trained on that dataset's train split. Protocols and confidence intervals are on the model card.",
  "hl.params": "Parameters, full fine-tune",
  "hl.ctx": "Input tokens",
  "hl.opts": "Options scored in one pass (largest tested)",
  "hl.langs": "Languages evaluated",
  "hl.q4": "4-bit Q4_K_M file",
  "tl.v1": "First Jev-style release: 2B, LoRA, one option letter per answer.",
  "tl.macjev": "A 322M encoder for local Mac agents.",
  "tl.v2": "Calibrated English classification across 11 held-out tasks.",
  "tl.v3": "0.8B full fine-tune: long inputs, 51 languages, no cap on options.",
  "tl.next": "Dedicated models for LLM routing and guardrails.",
  "one.v3": "Long-input, multilingual decisions in 0.8B.",
  "note.v3": "Laya: best of the three official checkpoints per task, re-run on identical rows with shipped temperatures. Every paired 95% CI excludes zero; details on the model card. Also listed on the public Decision Index 0.3 board: Public 17.0, Full 12.5.",
  "m.massive51": "Intent accuracy, 51 languages",
  "m.ece49": "Calibration error, 49 suites",
  "c.beyond": "v3 vs the best official Laya checkpoint, 5 tasks",
  "b.v3typed": "v3 accuracy on 2,000 typed decisions",
  "b.v3massive": "v3 intent accuracy across 51 languages (MASSIVE)",
  "b.v3ece": "v3 calibration error across 49 suites (ECE)",
  "nav.releases": "Releases",
  "nav.bench": "Benchmarks",
  "nav.dev": "Quickstart",
  "nav.road": "Roadmap",
  "nav.about": "About",
  "ab.h1": "Why small",
  "ab.p1": "A decision needs a label and a probability, not a paragraph. A model built for one job can stay small (322M–2B parameters): fast, private and cheap to run.",
  "ab.h2": "How I measure",
  "ab.p2": "Held-out data only, compared against a baseline, with calibration error next to accuracy.",
  "ab.h3": "What's next",
  "ab.p3": "Next: dedicated models for LLM routing and guardrails. Requests and collaborations welcome.",
  "search": "Search",
  "search.ph": "Search models, repositories and pages",
  "search.none": "No matches",
  "menu": "Menu",
  "page": "Page",
  "hero.h": "Small models. Calibrated decisions.",
  "chip.qs": "Quickstart",
  "details": "Details",
  "sec.models": "Models",
  "side.all": "All",
  "side.released": "Released",
  "side.planned": "Planned",
  "s.input": "Input tokens",
  "s.langs": "Languages",
  "s.dl": "Downloads · 30 d",
  "s.dlall": "All-time downloads",
  "nav.dl": "Downloads",
  "dl.upd": "Updated",
  "sec.dl": "Downloads",
  "dl.all": "All-time downloads",
  "dl.30": "Last 30 days",
  "dl.likes": "Likes",
  "dl.repos": "Repositories",
  "dl.live": "Live from Hugging Face",
  "dl.snap": "As of",
  "dl.allShort": "all time",
  "dl.note": "Pulled from the Hugging Face API every 3 hours, and live when your browser can reach Hugging Face. Hugging Face itself can lag by up to a day.",
  "dl.models": "Models",
  "dl.reposSub": "repositories on Hugging Face",
  "dl.30s": "30 days",
  "dl.unit": "downloads",
  "new": "New",
  "pause": "Pause animation",
  "play": "Play animation",
  "search.res": "results",
  "title": "JevStyle Decision Models",
  "s.acc11": "Accuracy · 11 tasks",
  "cat.model": "Model",
  "cat.bench": "Benchmark",
  "cat.plan": "Planned",
  "cat.arch": "Archived",
  "feat.macjev": "MacJev 322M: decisions on your own Mac",
  "feat.v2": "Decision 2B v2: calibrated English classification",
  "feat.eval": "v2 evaluated on held-out tasks",
  "feat.v1": "Decision 2B v1: the first release",
  "tasks": "held-out tasks",
  "sec.releases": "Recent releases",
  "sec.bench": "Benchmarks",
  "sec.dev": "Quickstart",
  "sec.road": "Roadmap",
  "viewall": "View all",
  "dl30": "downloads · 30 days",
  "dev.repo": "Open repository",
  "cta.h": "Get started with JevStyle",
  "f.models": "Models",
  "f.formats": "Formats",
  "f.research": "Research",
  "f.dev": "Developers",
  "f.comm": "Community",
  "f.calib": "Calibration",
  "f.contact": "Contact",
  "f.demo": "Live demo",
  "prev": "Previous",
  "next": "Next",
  "lang.name": "English",
  "one.macjev": "Decisions for local Mac agents.",
  "one.v2": "Calibrated English classification.",
  "one.v1": "First release. Superseded by v3 (0.8B) and v4 (2B).",
  "one.mj08": "Next MacJev. Longer input, more languages.",
  "one.router": "Send each request to the right LLM.",
  "one.guard": "Safety checks before an LLM call.",
  "b.open": "Open weights",
  "b.latest": "Latest",
  "b.archived": "Previous",
  "m1": "v2 accuracy across 11 tasks",
  "m1s": "English Laya 75.1%",
  "m2": "MacJev yes/no accuracy on 2K–4K-token inputs",
  "m2s": "Laya multilingual 31.0%",
  "m3": "v1 calibration error (ECE)",
  "m3s": "Qwen3.5-2B-Base 0.065",
  "m4": "v2 decisions that flip when options are reordered",
  "m4s": "English Laya 12.0%",
  "copy": "Copy",
  "copied": "Copied",
  "snap": "Stats as of ",
  "down": "lower is better",
  "hf": "Open on Hugging Face",
  "newer": "See 2B v4",
  "close": "Close",
  "vs": "vs",
  "formats": "Formats",
  "code": "Quickstart",
  "k.params": "Parameters",
  "k.ctx": "input tokens",
  "c.tasks": "Accuracy by task",
  "c.rel": "Reliability · confidence vs accuracy",
  "c.pair": "Held-out accuracy",
  "rel.x": "Stated confidence",
  "rel.n": "decisions per bin",
  "lower": "lower is better",
  "m.yesno_long": "Yes/no, 2K–4K tokens",
  "m.rule_long": "Rules, 2K–4K tokens",
  "m.rule_all": "Rules, all long inputs",
  "m.typed": "Typed decisions",
  "m.ece_long": "Calibration error, long inputs",
  "m.mnli": "MNLI",
  "m.sst5": "SST-5",
  "m.boolq": "BoolQ",
  "m.sst2": "SST-2",
  "m.ag_news": "AG News",
  "m.ece5": "Calibration error (ECE)",
  "t.ag_news": "AG News",
  "t.anli": "ANLI",
  "t.boolq": "BoolQ",
  "t.emotion": "Emotion",
  "t.enron_spam": "Enron spam",
  "t.hans": "HANS",
  "t.imdb": "IMDb",
  "t.mnli": "MNLI",
  "t.rte": "RTE",
  "t.sst2": "SST-2",
  "t.sst5": "SST-5",
  "note.v2": "Single training seed; per-task gaps are point estimates. Full records ship in the repository.",
  "note.v1": "1,500 held-out decisions across 5 tasks.",
  "note.macjev": "Same 4,096-token budget. Gains reproduced across 3 seeds.",
  "an.c9": "Jev-Style Cascade 9B: 87.9% on JevBench public items, the 2B settles half itself",
  "one.cascade-9b": "Our 2B answers first; questions it is unsure of go to JevK5-9B by alibiserikbay.",
  "tl.cascade-9b": "2B first, JevK5-9B when unsure: 87.9% on JevBench public items.",
  "s.tiers": "Tiers",
  "s.jbpub": "JevBench public items",
  "s.settled": "Settled by the 2B",
  "s.ece": "Calibration error (ECE)",
  "b.cfg": "Cascade",
  "c9.k.jb": "JevBench, 231 public items",
  "c9.k.settled": "Items the 2B settled itself",
  "c9.k.rest": "JevK5-9B answers the rest",
  "c9.k.ece": "Calibration error (ECE) on JevBench",
  "c9.k.lat": "Median latency, JevBench items",
  "c9.k.lats": "RTX 5090 · one request at a time",
  "c9.cap.jb": "JevBench, 231 public items (our run; Jev 1.13.0 as published)",
  "c9.cap.tier": "Jev-Style Cascade 9B by difficulty",
  "c9.b.k5": "JevK5-9B alone",
  "c9.b.2b": "Jev-Style 2B v3 alone",
  "c9.s.ours": "our run",
  "c9.s.k5": "alibiserikbay · our run",
  "c9.s.pub": "published result",
  "c9.t.easy": "Easy",
  "c9.t.standard": "Standard",
  "c9.t.hard": "Hard",
  "c9.t1": "tier 1",
  "c9.t2": "tier 2",
  "c9.rt": "downloaded at run time",
  "c9.same": "same accuracy ({acc} each)",
  "b.c9jb": "Jev-Style Cascade 9B vs Jev 1.13.0 on JevBench public items (231)",
  "b.c9jb.n": "our run; Jev as published",
  "b.c9ece": "Calibration error (ECE) on JevBench public items, vs JevK5-9B alone",
  "note.cascade-9b": "How it works: Jev-Style 2B v3 (PyTorch float32, CUDA graphs) answers every question; questions with normalized confidence below τ = 0.75 go to JevK5-9B v0.3.3 by alibiserikbay (third party, Apache-2.0; runtime allebee/jevk5). No new weights: the repo holds the frozen config, the calibration record and the evaluation. JevBench: our own run on the 231 public items with harness bb05a335 (v1.4.2.2 + 5 commits), not a board row; Jev 1.13.0's 86.6% is its published public accuracy in the harness's results/v1.4.2. Calibration set (4,992 questions, 29 public datasets): cascade 73.1%, JevK5-9B alone 74.1%, 2B alone 66.2%; the 2B settled 42.8%. Decision Index 0.2.1 offline forecast: 46.08, vs 34.83 for the 2B alone (composed from public per-row results at the frozen τ, scored with the official kit; not a board entry). RTX 5090, one request at a time: median 37.5 ms on the calibration set; 29.7 GB after start-up, 31.8 GB peak; start-up 47 s; a 25,275-token request ran in 2.4 s.",
  "ng.api": "API",
  "ng.models": "Models",
  "nav.overview": "Overview",
  "nav.play": "Playground",
  "nav.limits": "Limits",
  "nav.docs": "Docs",
  "duo.api.go": "Create free key",
  "duo.api.docs": "API docs",
  "st.up": "API operational",
  "st.down": "Inference unavailable",
  "mt.note": "Inference is temporarily unavailable. Check the console service status before sending requests.",
  "api.k": "Hosted API",
  "api.h": "2B v4, hosted for free",
  "api.p": "Send text and typed questions to the hosted Jev-Style 2B v4 model and receive probabilities for every option. Capacity is shared, with no fixed per-account limits at the moment; see the current API documentation.",
  "api.indep": "Independent project · not affiliated with TypeSafe",
  "ex.h": "One request, every option scored",
  "ex.aside": "Illustrative request and response",
  "ex.p": "A real support ticket with three questions, sent in one call from Sydney: about 0.42 s end-to-end.",
  "ex.req": "request",
  "ex.res": "Response",
  "ex.res.meta": "29.7 ms on the GPU",
  "q.yes": "yes",
  "q.no": "no",
  "q.conf": "confidence",
  "q.py": "probability of yes",
  "q.exp": "expected level, 0–2",
  "q.d.noul": " — a yes/no question. You get the probability that the answer is yes.",
  "q.d.choice": " — pick one of your named options. Every option gets a probability; descriptions are optional.",
  "q.d.score": " — an ordered scale with 2–10 levels. You get the expected level and a probability for each level.",
  "code.h": "Hosted API reference",
  "code.p": "One POST with your key, from any language.",
  "code.ep": "Endpoint",
  "code.auth": "Auth",
  "code.body": "Body",
  "code.bodyv": "state + up to 64 questions",
  "code.cap": "Input",
  "code.capv": "up to 8,000 tokens per request",
  "code.ref": "Full API reference",
  "pf.h": "Fast and calibrated",
  "pf.when": "Measured Oct 8, 2026",
  "pf.1": "Median end-to-end for a short request, Sydney to API over the public internet",
  "pf.2": "Model compute for a short request",
  "pf.3": "Model compute at 7.9k input tokens",
  "pf.4": "inference worker",
  "pf.5": "Top answers identical to FP32 (BF16 serving, JevBench + sample tickets)",
  "pf.same": "The API serves Jev-Style 2B v4 for text.",
  "pf.model": "See the model",
  "uc.h": "Use cases",
  "uc.sub": "Demos recorded with the open Jev-Style v3 models",
  "uc.t1": "Ticket routing",
  "uc.p1": "Send each ticket to the right team and flag refund requests, all in one call.",
  "uc.t2": "Moderation",
  "uc.p2": "Check posts against your own policy, then threshold the probability: allow, review or remove.",
  "uc.t3": "LLM routing",
  "uc.p3": "Decide whether a small model or a frontier model should answer, before you spend the tokens.",
  "lim.h": "Free tier",
  "lim.full": "Full limits",
  "lim.1": "shared capacity",
  "lim.2": "no fixed per-account request rate",
  "lim.3": "no fixed daily count",
  "lim.4": "input tokens per request",
  "lim.5": "API keys per account",
  "lim.note": "Limits are per account and shared by all of its keys. Failed, rejected and timed-out requests are not charged. Fair use, best effort.",
  "steps.h": "Get started in 3 steps",
  "step1.h": "Create an account",
  "step1.p": "Email or Google. Email accounts verify their address first.",
  "step2.h": "Create a key in Console",
  "step2.p": "Up to 3 keys. A new key is shown once, so copy it.",
  "step3.h": "Call the API",
  "step3.p": "POST to /v1/systemone with your key. The docs cover errors and retries.",
  "faq.h": "FAQ",
  "faq.q1": "Do you store what I send?",
  "faq.a1": "No. The request text (state and questions) is not stored. Only metadata such as time, status and key ID is logged, for rate limits and security. Please don't send secrets or government IDs.",
  "faq.q2": "Is there an SLA?",
  "faq.a2": "No. It's a free, fair-use service run on a best-effort basis, and limits may change. Retry with backoff on 429 and 5xx. If you need guaranteed capacity, run the open weights yourself.",
  "faq.q3": "Is this affiliated with TypeSafe or Jev?",
  "faq.a3": "No. JevStyle is an independent project by Chaoliang Yan (UNSW). It is not affiliated with TypeSafe AI or its Jev models. The model weights are Apache-2.0.",
  "faq.q4": "Which model is served?",
  "faq.a4": "Jev-Style 2B v4 (jev-style-2b-decision-v4), for text only. One worker processes requests sequentially. Each request accepts up to 8,000 input tokens.",
  "faq.q5": "What happens when I hit a limit?",
  "faq.a5": "You get HTTP 429 (with Retry-After when shared capacity is busy). Failed and rejected requests are not charged.",
  "faq.q6": "How long can a request be?",
  "faq.a6": "Up to 8,000 tokens and 64 questions. Larger requests get HTTP 413 and are not charged.",
  "om.k": "Open models",
  "om.h": "Open weights you can run anywhere",
  "om.p": "Apache-2.0 decision models on Hugging Face in Transformers, GGUF and MLX formats, plus a pip package that serves them on your own machine.",
  "dl.allrepos": "All {n} repositories",
  "title3": "Local Text Classification and AI Routing in Python | JevStyle",
  "n3.api": "How it works",
  "n3.uc": "Use cases",
  "n3.models": "Open models",
  "n3.login": "Log in",
  "h3.title": "Local classification and routing for AI agents",
  "h3.sub": "Small open models that score your options in one call. Run them yourself, or use the free API.",
  "h3.cta": "Try the live demo",
  "h3.key": "Get a free API key",
  "om.note.how": "How they are counted",
  "fc.key.h": "Use the hosted API",
  "fc.key.1": "Free, with no fixed per-account limits at the moment",
  "fc.key.2": "Text input, up to 8,000 tokens per request",
  "start.local": "Run locally",
  "start.demo": "Try demo",
  "learn.h": "Build with JevStyle",
  "learn.p": "Complete guides, runnable examples, and model choices for your project.",
  "dd.qs": "Quickstart",
  "dd.qs.d": "Your first request in a few minutes",
  "dd.pg.d": "Try requests in the browser",
  "dd.lim": "Limits",
  "dd.lim.d": "Rate limits, quotas and retries",
  "pr.label": "Project facts",
  "pr.pypi": "jev-style package",
  "pr.gh": "Source code",
  "pr.mcp": "jev-style server",
  "pr.weights": "Open weights",
  "pm.h": "Powered by Jev-Style 2B v4",
  "pm.p": "The same open weights you can download, served on GPUs and free to call.",
  "pm.badge": "Hosted · free tier",
  "pm.d": "A 2B decision model. Give it text and typed questions, and it scores every option in one pass.",
  "pm.more": "Learn more",
  "pm.det": "Benchmarks and details",
  "ps.price": "Price",
  "ps.price.v": "Free",
  "ps.price.s": "No fixed per-account limits at the moment; capacity is shared",
  "ps.rate": "Rate limit",
  "ps.rate.v": "Shared",
  "ps.rate.s": "Busy capacity returns 429 with Retry-After; retry",
  "ps.ctx": "Context",
  "ps.ctx.v": "8,192 tokens",
  "ps.ctx.s": "Free tier: up to 8,000 input tokens per request",
  "ps.out": "Output",
  "ps.out.v": "A probability per option",
  "ps.out.s": "No generated text, nothing to parse",
  "ps.types": "Question types",
  "ps.types.s": "Up to 64 questions per request",
  "ps.jb.s": "v1.4.1, 231 public items",
  "pmdl.h": "Downloads on Hugging Face",
  "pmdl.all": "See all repositories →",
  "band.h": "Start building with the free API",
  "band.p": "Create an account, make a key in Console, and send your first request in a few minutes.",
  "band.docs": "Read the docs",
  "res.h": "Get started",
  "res.qs.h": "Quickstart",
  "res.qs.p": "Create a key and make your first call with curl, Python or JavaScript.",
  "res.pg.h": "Playground",
  "res.pg.p": "Write a state and questions in the browser and see every probability.",
  "res.lim.h": "Limits and errors",
  "res.lim.p": "Quotas, rate limits, error codes and when to retry.",
  "res.om.h": "Open-source models",
  "res.om.p": "Download the same weights and run them on your own machine with Transformers, GGUF or MLX.",
  "res.om.a": "Browse models",
  "res.lim.a": "Limits",
  "res.err.a": "Error codes",
  "try.p": "One support ticket, three questions, one call.",
  "ty.noul": "Yes / no",
  "ty.choice": "Pick one",
  "ty.score": "Scale",
  "ty.noul.h": "Yes or no, with a probability",
  "ty.noul.p": "Ask a yes/no question. Get the probability of yes.",
  "ty.choice.h": "Pick one of your options",
  "ty.choice.p": "List your options. Each gets a probability; the top one comes back with a confidence.",
  "ty.score.h": "Place it on a scale",
  "ty.score.p": "Give 2–10 ordered levels. Get the expected level and a probability for each.",
  "ty.reqh": "In the request",
  "ty.resh": "In the response",
  "ty.state": "One state for all three questions",
  "ty.meta": "illustrative example · results depend on the model and input",
  "code.res": "Response",
  "uc3.p": "A few typed questions, one call.",
  "uc.more": "More use cases",
  "uc.tk.h": "Ticket routing",
  "uc.tk.p": "Route each ticket to a team and flag refund requests in the same call.",
  "uc.ag.h": "Agent action approval",
  "uc.ag.p": "Before each coding-agent command runs, decide: allow, ask or deny.",
  "uc.md.h": "Moderation",
  "uc.md.p": "Check posts against your own policy, then threshold the probability: allow, review or remove.",
  "uc.rt.h": "LLM routing",
  "uc.rt.p": "Decide whether a small model or a frontier model should answer, before you spend the tokens.",
  "uc.in.h": "Intent classification",
  "uc.in.p": "Map each message to an intent, with a probability for every intent. The demo shows Chinese tickets and 51 languages (0.8B v3).",
  "uc.mv.h": "Agent move picking",
  "uc.mv.p": "Code lists the legal moves; the model picks every step in about 0.1 s.",
  "uc.see": "See example",
  "uc.try": "Try it in Playground",
  "pd.h": "Built for production",
  "pd.p": "What runs behind the free tier, measured on Oct 8, 2026.",
  "pd.c1": "Privacy and security",
  "pd.c1.1": "Request text is not stored. Only metadata such as time, status and key ID is logged, for rate limits and security.",
  "pd.c1.2": "API keys are stored hashed and shown only once.",
  "pd.c1.3": "HTTPS (TLS) on every request.",
  "pd.c1.4": "Keys, limits and usage are scoped to your account.",
  "pd.c2": "Limits and reliability",
  "pd.c2.1": "No fixed per-account limits at the moment: no daily count and no per-minute cap. Capacity is shared; a busy service returns 429 with Retry-After, and clients should retry.",
  "pd.c2.2": "Failed, rejected and timed-out requests are not charged.",
  "pd.c2.3": "Latency depends on input length, shared load and network conditions.",
  "pd.c3": "Developer tools",
  "pd.c3.1": "Console with a Playground for trying requests.",
  "pd.c3.2": "Usage charts for the last 30 days.",
  "pd.c3.3": "Up to 3 named keys, revocable at any time.",
  "pd.c3.4": "/v1/systemone-compatible requests: a state plus typed questions.",
  "om3.h": "Or run it yourself",
  "om3.p": "The same models, Apache-2.0. Run them with Transformers, GGUF or MLX.",
  "fc.api.h": "Try it in your browser",
  "fc.api.1": "No installation or API key",
  "fc.api.2": "Text and image examples on Hugging Face",
  "fc.api.3": "Playground and usage charts in Console",
  "fc.api.4": "Docs for auth, limits and error codes",
  "fc.os.h": "Run it yourself",
  "fc.os.1": "Apache-2.0 weights",
  "fc.os.2": "CPU, CUDA and Apple silicon",
  "fc.os.3": "Runs on CPU, CUDA and Apple silicon",
  "fc.os.4": "Up to 32,768 input tokens with 2B v4, images included",
  "k3.free": "daily quota per account",
  "k3.lat": "hosted API status",
  "k3.tok": "input tokens per request",
  "k3.out.v": "Probabilities",
  "k3.out": "for every option, nothing to parse",
  "tr.1": "Request text isn't stored",
  "tr.2": "Failed requests don't count",
  "tr.3": "Open local models remain available",
  "om.stats": "{dl} downloads · {m} models · Apache-2.0",
  "om.s.dl": "downloads",
  "om.s.m": "models",
  "om.s.likes": "likes",
  "run.send": "Sending",
  "run.ok": "Recorded example · {s} s GPU time",
  "run.see": "See response",
  "news.h": "Latest updates",
  "news.all": "All updates",
  "uc.all": "All use cases",
  "bench.all": "Full evaluation",
  "final.h": "Start with one decision",
  "final.p": "Use the hosted API, or run the same kind of model on your own machine.",
  "final.models": "Explore models",
  "h3.em": "Local",
  "ann.k": "Announcement",
  "ann.h": "Jev-Style 2B v4 reads images",
  "ann.p": "Our first model with image input, through its PyTorch build.",
  "ann.a": "Read about 2B v4",
  "go.key": "Free, no fixed per-account limits",
  "go.demo": "No install, no API key",
  "go.local": "CPU, CUDA and Apple silicon",
  "h3.meta": "Classify text, route requests, and score fixed choices in Python. Use the free hosted API, or run small open models on CPU, CUDA, or Apple silicon.",
  "k.full": "Full",
  "k.listed": "on the board since",
  "ty.q.refund": "Refund?",
  "ty.q.team": "Which team?",
  "ty.q.today": "Action today?",
  "one.v42-2b": "The v4.2 decision model, with PyTorch, GGUF and MLX downloads. PyTorch supports text and images; GGUF and MLX support text."
 },
 "zh": {
  "guide.0.h": "本地大模型路由",
  "guide.0.p": "在本地选择路由，将不确定的决策交给大模型。",
  "guide.1.h": "客服工单分类",
  "guide.1.p": "一次请求判断负责团队与退款诉求。",
  "guide.2.h": "Claude Code 调用审核",
  "guide.2.p": "通过本地模型和明确规则检查工具调用。",
  "guide.3.h": "评估你自己的数据",
  "guide.3.p": "衡量准确率、校准、覆盖率和延迟。",
  "nav.models": "模型",
  "nav.api": "免费 API",
  "nav.getkey": "获取 API key",
  "nav.console": "控制台",
  "api.lead": "免费托管 2B Decision API — typed noul / choice / score。",
  "api.docs": "API 文档",
  "api.create": "创建 key",
  "api.badge": "Independent · non-TypeSafe",
  "api.strip.h": "免费 Decision API",
  "api.strip.p": "公平使用免费额度。注册后在 Console 建 key，调用 api.jevstyle.com。认证、限额与错误见文档。",
  "nav.tl": "时间线",
  "sec.tl": "发布时间线",
  "tl.next.when": "下一步",
  "nav.demos": "演示",
  "sec.demos": "演示",
  "dm.sub": "Jev-Style v3，本机运行",
  "dm.play": "播放视频",
  "dm.more": "更多演示",
  "hl.pub": "公开 holdout 硬一致率",
  "hl.soft": "敏感 safe-class 软一致（v4）",
  "hl.adapter": "可部署 LoRA + head",
  "an.tag": "新",
  "an.text": "Jev-Style 2B v4：能看图，已收录 Decision Index 0.3 公开榜（Public 44.37，Full 34.53），输入 32,768 token",
  "one.v3-2b": "2B 模型，长输入决策，一次前向给每个选项打分。",
  "tl.v3-2b": "2B 全量微调：JevBench 73.6%，25,600 token 输入，选项数不设上限。",
  "planned": "计划中",
  "s.optcap": "选项上限",
  "s.nocap": "无",
  "s.jb": "JevBench",
  "k.nocap": "选项数不设上限",
  "dl.soon": "随发布上线",
  "pts": "个百分点",
  "hl.jb": "JevBench v1.4.1 公开集准确率，231 题",
  "hl.ctx2b": "输入 token，选项数不设上限",
  "hl.jbgain": "JevBench 比 0.8B v3 高出的百分点",
  "sp2.c1": "JevBench v1.4.1，231 道公开题",
  "sp2.c2": "JevBench，对比 Jev-Style 0.8B v3",
  "sp2.c3": "tweet_topic 准确率，零样本，1,693 条",
  "sp2.f1": "Macro-F1",
  "sp2.note": "JevBench v1.4.1：GGUF F16，只跑一次，使用一个全局温度。对 decider-2b（Qwen3.5-2B-Base）的领先在 95% 置信区间（67.6–78.9%）之内；Jev 1.13.0 以 86.6% 明显领先；榜单 82 个系统中有 42 个得分更高，几乎都是 4B 及以上的模型。tweet_topic 为零样本（不在训练数据中）。训练使用缩减的数据池（60M token）；需要配套的运行时。",
  "demo.try": "在浏览器里试用",
  "demo.soon": "在线试用：随发布上线",
  "f.demo08": "在线试用（0.8B）",
  "one.v4-2b": "2B 规模、能看图的决策模型，一次前向给每个选项打分。",
  "tl.v4-2b": "2B 加视觉塔：Decision Index 0.3 公开榜 Public 44.37（Full 34.53），Vision 57.55，输入 32,768 token。",
  "hl.di4": "Decision Index 0.3 Public 分（榜单）",
  "hl.vis4": "Decision Index Vision Public 分（榜单）",
  "hl.ctx4": "输入 token（含图片）",
  "s.di4": "DI 0.3 公开",
  "s.vis4": "Vision 公开",
  "b.4di": "Jev-Style 2B v4 在 Decision Index 0.3 公开榜：Public 44.37（Full 34.53），2026-11-04 起替换 2B v3（34.05）",
  "b.4jb": "Jev-Style 2B v4 在 JevBench v1.4.1（231 道公开题）上的准确率",
  "m.di4": "Decision Index 0.3 Public 分",
  "m.vis4": "Decision Index Vision Public 分",
  "m.lat4": "单个请求延迟中位数",
  "m.lat4s": "750 个 Decision Index 请求，A100，bfloat16 + CUDA graphs",
  "k.req": "个请求，全部作答",
  "k.rows": "行，全部作答",
  "c.di4": "Decision Index 0.3 公开分类，技能分 × 100（2026-11-04 起 v4 在榜单上替换 v3）",
  "c.jb4": "JevBench v1.4.1 公开集准确率，231 题",
  "ar.kr": "知识与推理",
  "ar.lu": "语言理解",
  "ar.rc": "检索与分类",
  "ar.ta": "工具与自动化",
  "ar.at": "艺术与审美",
  "coll.v4": "v4 全部版本",
  "pr.di": "Decision Index 榜单",
  "note.v4-2b": "Decision Index 公开套件 0.3（kit 25c6ec7，用 kit 自带的运行器和打分器）：完整自测一次，140,178 个请求全部作答，一张 A100 上 bfloat16；Vision 公开套件：完整跑一次，12,210 行。两项自 2026-11-04 起正式收录在 Decision Index 0.3 公开榜，替换了 2B v3：Public 44.37、Full 34.53、Breadth 41.75；Vision Public 57.55、Full 51.94。Public 来自任何人都能跑的公开套件；Full 还包含维护者的私有测试，所以更低。JevBench v1.4.1 公开题：官方评测脚本，Apple MPS 上 float32，只跑一次（对 decider-2b 的领先在 95% 置信区间之内；Jev 1.13.0 明显领先）。训练数据含若干基准的官方 train 切分，这些基准上的结果不算零样本。部分训练标签是通过 TypeSafe Jev 1.14 公开 API 蒸馏的软标签（Soft labels distilled from TypeSafe Jev 1.14 via its public API）。看图需要 PyTorch 运行时；GGUF 和 MLX 版只读文字。",
  "b.2bjb": "Jev-Style 2B v3 在 JevBench v1.4.1（231 道公开题）上的准确率",
  "b.2bjb.n": "Qwen3.5-2B 系列；领先在 95% 置信区间内",
  "b.2bjb08": "JevBench v1.4.1：Jev-Style 2B v3 对比 Jev-Style 0.8B v3",
  "b.2btt": "Jev-Style 2B v3 在 tweet_topic（1,693 条）上的零样本准确率",
  "m.jb": "JevBench v1.4.1，231 道公开题",
  "m.jbgain": "JevBench 比 0.8B v3 高出的百分点",
  "m.tt": "tweet_topic 准确率，零样本，1,693 条",
  "c.jb": "JevBench v1.4.1 公开集准确率，231 题（GGUF F16，只跑一次）",
  "note.v3-2b": "在 v1.4.1 榜单的 Qwen3.5-2B 系列系统中，JevBench 公开集准确率最高（decider-2b 71.0%，open-jev-zefan-2b 64.5%）。95% 置信区间为 67.6–78.9%，对 decider-2b 的领先在区间之内。Jev 明显领先；榜单 82 个系统中有 42 个得分更高，几乎都是 4B 及以上的模型。与训练数据的污染检查：4 项检查均为 0 命中。适用范围：需要配套的运行时（块注意力；原版 llama.cpp、Ollama、LM Studio 和 mlx_lm.generate 能加载权重，但算不出决策分数），输入上限 25,600 token，训练使用缩减的数据池（60M token）。",
  "sp.new": "新模型",
  "sp.tag": "读一次输入，一次前向，给每个选项打分。",
  "sp.c1": "多题型决策，2,000 条",
  "sp.c2": "意图识别准确率，51 种语言",
  "sp.c3": "校准误差（ECE），49 个测试集",
  "sp.note": "Laya：官方权重在相同样本上重跑，使用其自带温度。多题型决策：两个模型都用该数据集的训练集训练过。完整协议与置信区间见模型页。",
  "hl.params": "参数，全量微调",
  "hl.ctx": "输入 token",
  "hl.opts": "一次打分的选项数（实测最多）",
  "hl.langs": "评测语言数",
  "hl.q4": "4-bit Q4_K_M 文件",
  "tl.v1": "首个 Jev-style 模型：2B、LoRA，每个答案用一个选项字母读出。",
  "tl.macjev": "给本地 Mac agent 用的 322M 编码器模型。",
  "tl.v2": "概率校准的英文分类，覆盖 11 个留出任务。",
  "tl.v3": "0.8B 全量微调：长输入、51 种语言、选项数不设上限。",
  "tl.next": "专门的大模型路由和安全护栏模型。",
  "one.v3": "0.8B 模型，支持长输入与多语言的决策。",
  "note.v3": "Laya：每个任务取三个官方权重中最好的一个，在相同样本上重跑，使用其自带温度。所有配对 95% 置信区间都不含零，详见模型页。 另外也在 Decision Index 0.3 公开榜上：Public 17.0、Full 12.5。",
  "m.massive51": "51 种语言意图识别准确率",
  "m.ece49": "49 个测试集校准误差",
  "c.beyond": "v3 对比最佳官方 Laya 权重，5 个任务",
  "b.v3typed": "v3 在 2,000 个多题型决策上的准确率",
  "b.v3massive": "v3 在 51 种语言上的意图识别准确率（MASSIVE）",
  "b.v3ece": "v3 在 49 个测试集上的校准误差（ECE）",
  "nav.releases": "发布",
  "nav.bench": "评测",
  "nav.dev": "快速开始",
  "nav.road": "路线图",
  "nav.about": "关于我们",
  "ab.h1": "为什么做小模型",
  "ab.p1": "做判断只需要一个标签和一个概率，不需要长篇回答。只做一件事的模型可以很小（322M–2B 参数）：更快、更私密，也更便宜。",
  "ab.h2": "怎么评测",
  "ab.p2": "只用留出集，与基线模型对比，准确率旁边同时给出校准误差。",
  "ab.h3": "接下来",
  "ab.p3": "下一步：专门的大模型路由和安全护栏模型。欢迎提需求或合作。",
  "search": "搜索",
  "search.ph": "搜索模型、仓库与页面",
  "search.none": "没有匹配项",
  "menu": "菜单",
  "page": "页面",
  "hero.h": "小模型，校准过的决策。",
  "chip.qs": "快速开始",
  "details": "详情",
  "sec.models": "模型",
  "side.all": "全部",
  "side.released": "已发布",
  "side.planned": "规划中",
  "s.input": "输入 token",
  "s.langs": "语言",
  "s.dl": "近 30 天下载",
  "s.dlall": "累计下载",
  "nav.dl": "下载量",
  "dl.upd": "更新于",
  "sec.dl": "下载量",
  "dl.all": "累计下载",
  "dl.30": "近 30 天",
  "dl.likes": "点赞",
  "dl.repos": "仓库",
  "dl.live": "Hugging Face 实时数据",
  "dl.snap": "截至",
  "dl.allShort": "累计",
  "dl.note": "每 3 小时自动从 Hugging Face API 同步一次；浏览器能访问 Hugging Face 时显示实时数据。平台统计本身最多可能延迟一天。",
  "dl.models": "模型",
  "dl.reposSub": "个 Hugging Face 仓库",
  "dl.30s": "近 30 天",
  "dl.unit": "次下载",
  "new": "新",
  "pause": "暂停动画",
  "play": "播放动画",
  "search.res": "个结果",
  "title": "JevStyle 决策模型",
  "s.acc11": "11 个任务准确率",
  "cat.model": "模型",
  "cat.bench": "评测",
  "cat.plan": "规划中",
  "cat.arch": "已归档",
  "feat.macjev": "MacJev 322M：在你自己的 Mac 上做决定",
  "feat.v2": "Decision 2B v2：概率校准的英文分类",
  "feat.eval": "v2 在留出任务上的评测",
  "feat.v1": "Decision 2B v1：首个版本",
  "tasks": "个留出任务",
  "sec.releases": "最新发布",
  "sec.bench": "评测",
  "sec.dev": "快速开始",
  "sec.road": "路线图",
  "viewall": "查看全部",
  "dl30": "次下载 · 近 30 天",
  "dev.repo": "打开仓库",
  "cta.h": "开始使用 JevStyle",
  "f.models": "模型",
  "f.formats": "格式",
  "f.research": "研究",
  "f.dev": "开发者",
  "f.comm": "社区",
  "f.calib": "校准",
  "f.contact": "联系我们",
  "f.demo": "在线试用",
  "prev": "上一个",
  "next": "下一个",
  "lang.name": "简体中文",
  "one.macjev": "本地 Mac agent 的决策模型。",
  "one.v2": "概率校准的英文分类模型。",
  "one.v1": "首个版本，已由 v3（0.8B）和 v4（2B）取代。",
  "one.mj08": "下一代 MacJev：更长输入，更多语言。",
  "one.router": "把每个请求交给合适的大模型。",
  "one.guard": "调用大模型之前的安全检查。",
  "b.open": "开放权重",
  "b.latest": "最新",
  "b.archived": "旧版",
  "m1": "v2 在 11 个任务上的准确率",
  "m1s": "英文 Laya 75.1%",
  "m2": "MacJev 在 2K–4K token 输入上的是/否准确率",
  "m2s": "Laya 多语版 31.0%",
  "m3": "v1 校准误差 ECE",
  "m3s": "Qwen3.5-2B-Base 0.065",
  "m4": "v2 打乱选项顺序后改判的比例",
  "m4s": "英文 Laya 12.0%",
  "copy": "复制",
  "copied": "已复制",
  "snap": "数据更新于 ",
  "down": "越低越好",
  "hf": "在 Hugging Face 打开",
  "newer": "查看 2B v4",
  "close": "关闭",
  "vs": "对比",
  "formats": "格式",
  "code": "快速开始",
  "k.params": "参数量",
  "k.ctx": "token 输入",
  "c.tasks": "分任务准确率",
  "c.rel": "可靠性图 · 置信度与准确率",
  "c.pair": "留出集准确率",
  "rel.x": "模型置信度",
  "rel.n": "每档样本数",
  "lower": "越低越好",
  "m.yesno_long": "是/否，2K–4K token",
  "m.rule_long": "规则，2K–4K token",
  "m.rule_all": "规则，全部长输入",
  "m.typed": "多题型决策",
  "m.ece_long": "长输入校准误差",
  "m.mnli": "MNLI",
  "m.sst5": "SST-5",
  "m.boolq": "BoolQ",
  "m.sst2": "SST-2",
  "m.ag_news": "AG News",
  "m.ece5": "校准误差 ECE",
  "t.ag_news": "AG News",
  "t.anli": "ANLI",
  "t.boolq": "BoolQ",
  "t.emotion": "Emotion",
  "t.enron_spam": "Enron 垃圾邮件",
  "t.hans": "HANS",
  "t.imdb": "IMDb",
  "t.mnli": "MNLI",
  "t.rte": "RTE",
  "t.sst2": "SST-2",
  "t.sst5": "SST-5",
  "note.v2": "单个训练种子；分任务差异为点估计。完整记录见仓库。",
  "note.v1": "5 个任务共 1,500 条留出决策。",
  "note.macjev": "输入预算同为 4,096 token；提升在 3 个随机种子上均可复现。",
  "an.c9": "Jev-Style Cascade 9B：JevBench 公开题 87.9%，半数题目由 2B 自己完成",
  "one.cascade-9b": "我们的 2B 先作答；没有把握的题交给 alibiserikbay 的 JevK5-9B。",
  "tl.cascade-9b": "先由 2B 作答，没有把握时交给 JevK5-9B：JevBench 公开题 87.9%。",
  "s.tiers": "层级",
  "s.jbpub": "JevBench 公开题",
  "s.settled": "由 2B 直接作答",
  "s.ece": "校准误差（ECE）",
  "b.cfg": "级联",
  "c9.k.jb": "JevBench，231 道公开题",
  "c9.k.settled": "由 2B 直接作答的题",
  "c9.k.rest": "其余交给 JevK5-9B",
  "c9.k.ece": "JevBench 校准误差（ECE）",
  "c9.k.lat": "JevBench 题目延迟中位数",
  "c9.k.lats": "RTX 5090 · 每次一个请求",
  "c9.cap.jb": "JevBench 231 道公开题（本项目实测；Jev 1.13.0 为官方公布结果）",
  "c9.cap.tier": "Jev-Style Cascade 9B 分难度结果",
  "c9.b.k5": "JevK5-9B（单独）",
  "c9.b.2b": "Jev-Style 2B v3（单独）",
  "c9.s.ours": "本项目实测",
  "c9.s.k5": "alibiserikbay · 本项目实测",
  "c9.s.pub": "官方公布结果",
  "c9.t.easy": "简单",
  "c9.t.standard": "标准",
  "c9.t.hard": "困难",
  "c9.t1": "第 1 级",
  "c9.t2": "第 2 级",
  "c9.rt": "运行时下载",
  "c9.same": "准确率相同（均为 {acc}）",
  "b.c9jb": "JevBench 231 道公开题：Jev-Style Cascade 9B 对比 Jev 1.13.0",
  "b.c9jb.n": "本项目实测；Jev 为官方公布结果",
  "b.c9ece": "JevBench 公开题校准误差（ECE）：对比单独使用 JevK5-9B",
  "note.cascade-9b": "工作方式：Jev-Style 2B v3（PyTorch float32，CUDA graphs）先回答所有问题；归一化置信度低于 τ = 0.75 的问题交给 alibiserikbay 的 JevK5-9B v0.3.3（第三方模型，Apache-2.0；运行时 allebee/jevk5）。不含新权重：仓库里是冻结的配置、校准记录和评测结果。JevBench：本项目用 harness bb05a335（v1.4.2.2 之后 5 个提交）在 231 道公开题上自行运行，不是榜单成绩；Jev 1.13.0 的 86.6% 是 harness 的 results/v1.4.2 中公布的公开题准确率。校准集（4,992 题，29 个公开数据集）：级联 73.1%，单独 JevK5-9B 74.1%，单独 2B 66.2%；2B 直接作答 42.8%。Decision Index 0.2.1 离线预估：46.08，单独 2B 为 34.83（在冻结的 τ 下由公开的逐行结果组合，并用官方工具评分；不是榜单成绩）。RTX 5090、每次一个请求：校准集延迟中位数 37.5 ms；启动后显存 29.7 GB，峰值 31.8 GB；启动 47 秒；一个 25,275 token 的请求用时 2.4 秒。",
  "ng.api": "API",
  "ng.models": "开源模型",
  "nav.overview": "概览",
  "nav.play": "在线试用",
  "nav.limits": "限额",
  "nav.docs": "文档",
  "duo.api.go": "免费创建 key",
  "duo.api.docs": "API 文档",
  "st.up": "API 运行正常",
  "st.down": "推理暂不可用",
  "mt.note": "推理服务暂时不可用，请先在控制台查看服务状态。",
  "api.k": "托管 API",
  "api.h": "2B v4，免费托管",
  "api.p": "把文本和类型化问题发给托管的 Jev-Style 2B v4 模型，得到每个选项的概率。容量共享，目前没有按账号的固定限额；以当前 API 文档为准。",
  "api.indep": "独立项目 · 与 TypeSafe 无关",
  "ex.h": "一次请求，每个选项都有分数",
  "ex.aside": "示例请求与响应",
  "ex.p": "一张真实的客服工单，三个问题，从悉尼一次调用，端到端约 0.42 秒。",
  "ex.req": "请求",
  "ex.res": "响应",
  "ex.res.meta": "GPU 计算 29.7 毫秒",
  "q.yes": "是",
  "q.no": "否",
  "q.conf": "置信度",
  "q.py": "答案为“是”的概率",
  "q.exp": "期望等级（0–2）",
  "q.d.noul": "：是非题，返回答案为“是”的概率。",
  "q.d.choice": "：从你给出的选项里选一个，每个选项都有概率；选项说明可以留空。",
  "q.d.score": "：2–10 级的有序刻度，返回期望等级和每一级的概率。",
  "code.h": "托管 API 文档",
  "code.p": "带上 key 发一个 POST，任何语言都行。",
  "code.ep": "接口",
  "code.auth": "认证",
  "code.body": "请求体",
  "code.bodyv": "state + 最多 64 个问题",
  "code.cap": "输入",
  "code.capv": "每次请求最多 8,000 个 token",
  "code.ref": "完整接口文档",
  "pf.h": "速度快，概率准",
  "pf.when": "2026 年 10 月 8 日实测",
  "pf.1": "短请求端到端耗时中位数，从悉尼经公网访问",
  "pf.2": "短请求的模型计算时间",
  "pf.3": "输入 7.9k token 时的模型计算时间",
  "pf.4": "推理工作进程",
  "pf.5": "首选答案与 FP32 一致（BF16 线上推理，JevBench + 示例工单）",
  "pf.same": "API 使用 Jev-Style 2B v4，仅支持文本。",
  "pf.model": "查看模型",
  "uc.h": "应用场景",
  "uc.sub": "演示录制自开源的 Jev-Style v3 模型",
  "uc.t1": "工单分派",
  "uc.p1": "一次调用把工单分给对应团队，同时标出是否要求退款。",
  "uc.t2": "内容审核",
  "uc.p2": "按你自己的规则检查内容，再按概率设阈值：放行、人工复核或删除。",
  "uc.t3": "LLM 路由",
  "uc.p3": "在花 token 之前，先判断该由小模型还是前沿大模型来回答。",
  "lim.h": "免费额度",
  "lim.full": "完整限额说明",
  "lim.1": "共享容量",
  "lim.2": "不设固定的账号请求速率",
  "lim.3": "不设固定的每日次数",
  "lim.4": "单次请求输入 token",
  "lim.5": "每个账号的 API key",
  "lim.note": "限额按账号计算，账号下所有 key 共用。失败、被拒绝和超时的请求不扣额度。公平使用，尽力而为。",
  "steps.h": "三步开始使用",
  "step1.h": "注册账号",
  "step1.p": "支持邮箱或 Google。邮箱账号需要先验证邮箱。",
  "step2.h": "在控制台创建 key",
  "step2.p": "最多 3 个 key。新 key 只显示一次，请及时复制。",
  "step3.h": "调用 API",
  "step3.p": "带上 key 请求 /v1/systemone。错误码和重试方法见文档。",
  "faq.h": "常见问题",
  "faq.q1": "会保存我发送的内容吗？",
  "faq.a1": "不会。请求文本（state 和问题）不保存，只记录时间、状态、key ID 等元数据，用于限流和安全。请不要发送密钥或证件号码。",
  "faq.q2": "有 SLA 吗？",
  "faq.a2": "没有。这是公平使用、尽力而为的免费服务，限额可能调整。遇到 429 和 5xx 请退避后重试。需要稳定容量的话，可以自己部署开源权重。",
  "faq.q3": "和 TypeSafe 或 Jev 有关系吗？",
  "faq.a3": "没有。JevStyle 是 Chaoliang Yan（UNSW）的独立项目，与 TypeSafe AI 及其 Jev 模型无关。模型权重采用 Apache-2.0 许可。",
  "faq.q4": "线上用的是哪个模型？",
  "faq.a4": "Jev-Style 2B v4（jev-style-2b-decision-v4），仅支持文本。单个工作进程依次处理请求，每次最多 8,000 个输入 token。",
  "faq.q5": "超出限额会怎样？",
  "faq.a5": "返回 HTTP 429（全站繁忙时带 Retry-After）。失败和被拒绝的请求不扣额度。",
  "faq.q6": "单次请求最多能多长？",
  "faq.a6": "最多 8,000 个 token、64 个问题。超出返回 HTTP 413，不扣额度。",
  "om.k": "开源模型",
  "om.h": "开源权重，随处运行",
  "om.p": "Apache-2.0 许可的决策模型，在 Hugging Face 上提供 Transformers、GGUF 和 MLX 格式，另有 pip 包可以在你自己的机器上运行。",
  "dl.allrepos": "全部 {n} 个仓库",
  "title3": "Python 本地文本分类与 AI 路由模型 | JevStyle",
  "n3.api": "工作原理",
  "n3.uc": "应用场景",
  "n3.models": "开源模型",
  "n3.login": "登录",
  "h3.title": "AI Agent 的本地分类与路由",
  "h3.sub": "小型开放模型，一次调用给每个选项打分。可本地运行，也可用免费 API。",
  "h3.cta": "直接体验 Demo",
  "h3.key": "免费获取 API key",
  "om.note.how": "统计口径",
  "fc.key.h": "使用托管 API",
  "fc.key.1": "免费，目前没有按账号的固定限额",
  "fc.key.2": "文本输入，单次最多 8,000 个 token",
  "start.local": "本地运行",
  "start.demo": "体验 Demo",
  "learn.h": "将 JevStyle 接入你的项目",
  "learn.p": "从完整教程、可运行案例和模型选择开始。",
  "dd.qs": "快速开始",
  "dd.qs.d": "几分钟发出第一个请求",
  "dd.pg.d": "在浏览器里试请求",
  "dd.lim": "限额",
  "dd.lim.d": "速率、额度和重试",
  "pr.label": "项目数据",
  "pr.pypi": "jev-style 包",
  "pr.gh": "源代码",
  "pr.mcp": "已收录 jev-style",
  "pr.weights": "开源权重",
  "pm.h": "由 Jev-Style 2B v4 驱动",
  "pm.p": "就是你可以下载的那份开源权重，跑在 GPU 上，免费调用。",
  "pm.badge": "托管 · 免费额度",
  "pm.d": "一个 2B 决策模型。给它文本和带类型的问题，一次前向就给每个选项打分。",
  "pm.more": "了解更多",
  "pm.det": "评测与详情",
  "ps.price": "价格",
  "ps.price.v": "免费",
  "ps.price.s": "目前没有按账号的固定限额；容量共享",
  "ps.rate": "速率限制",
  "ps.rate.v": "共享容量",
  "ps.rate.s": "服务器忙时返回 429 并带 Retry-After，请重试",
  "ps.ctx": "上下文",
  "ps.ctx.v": "8,192 token",
  "ps.ctx.s": "免费额度：单次请求最多 8,000 个输入 token",
  "ps.out": "输出",
  "ps.out.v": "每个选项一个概率",
  "ps.out.s": "不生成文本，无需解析",
  "ps.types": "问题类型",
  "ps.types.s": "单次请求最多 64 个问题",
  "ps.jb.s": "v1.4.1，231 道公开题",
  "pmdl.h": "Hugging Face 下载量",
  "pmdl.all": "查看全部仓库 →",
  "band.h": "用免费 API 开始构建",
  "band.p": "注册账号，在控制台创建 key，几分钟就能发出第一个请求。",
  "band.docs": "阅读文档",
  "res.h": "快速上手",
  "res.qs.h": "快速开始",
  "res.qs.p": "创建 key，用 curl、Python 或 JavaScript 发出第一个请求。",
  "res.pg.h": "在线试用",
  "res.pg.p": "在浏览器里写下情况和问题，直接看到每个概率。",
  "res.lim.h": "限额与错误码",
  "res.lim.p": "额度、速率限制、错误码，以及什么时候该重试。",
  "res.om.h": "开源模型",
  "res.om.p": "下载同样的权重，在自己的机器上运行，支持 Transformers、GGUF 和 MLX。",
  "res.om.a": "浏览模型",
  "res.lim.a": "限额",
  "res.err.a": "错误码",
  "try.p": "一张客服工单，三个问题，一次调用。",
  "ty.noul": "是 / 否",
  "ty.choice": "单选",
  "ty.score": "打分",
  "ty.noul.h": "是非题，附带概率",
  "ty.noul.p": "问一个是非题，返回答案为“是”的概率。",
  "ty.choice.h": "从你的选项里选一个",
  "ty.choice.p": "列出选项，每个都有概率，最可能的那个附带置信度。",
  "ty.score.h": "放到刻度上",
  "ty.score.p": "给出 2–10 个有序等级，返回期望等级和每级概率。",
  "ty.reqh": "请求里",
  "ty.resh": "响应里",
  "ty.state": "三个问题共用一段 state",
  "ty.meta": "示例，实际结果取决于模型与输入",
  "code.res": "响应",
  "uc3.p": "几个带类型的问题，一次调用。",
  "uc.more": "更多场景",
  "uc.tk.h": "工单分派",
  "uc.tk.p": "一次调用把工单分给对应团队，同时标出是否要求退款。",
  "uc.ag.h": "Agent 操作审批",
  "uc.ag.p": "编程 Agent 每条命令执行前，判断放行、询问还是拒绝。",
  "uc.md.h": "内容审核",
  "uc.md.p": "按你自己的规则检查内容，再按概率设阈值：放行、人工复核或删除。",
  "uc.rt.h": "LLM 路由",
  "uc.rt.p": "在花 token 之前，先判断该由小模型还是前沿大模型来回答。",
  "uc.in.h": "意图识别",
  "uc.in.p": "把每条消息归到一个意图，每个意图都有概率。演示里是中文工单和 51 种语言（0.8B v3）。",
  "uc.mv.h": "Agent 走步选择",
  "uc.mv.p": "代码列出能走的方向，模型每一步约 0.1 秒做出选择。",
  "uc.see": "查看示例",
  "uc.try": "在线试一试",
  "pd.h": "为生产环境而建",
  "pd.p": "免费额度背后的运行方式，2026 年 10 月 8 日实测。",
  "pd.c1": "隐私与安全",
  "pd.c1.1": "不保存请求文本，只记录时间、状态、key ID 等元数据，用于限流和安全。",
  "pd.c1.2": "API key 以哈希形式保存，只显示一次。",
  "pd.c1.3": "所有请求都走 HTTPS（TLS）。",
  "pd.c1.4": "key、限额和用量都按账号隔离。",
  "pd.c2": "限额与可靠性",
  "pd.c2.1": "目前没有按账号的固定限额：没有每日次数，也没有每分钟次数上限。容量是共享的，服务器忙时返回 429 并带 Retry-After，客户端应重试。",
  "pd.c2.2": "失败、被拒绝和超时的请求不扣额度。",
  "pd.c2.3": "延迟取决于输入长度、共享负载和网络状况。",
  "pd.c3": "开发者工具",
  "pd.c3.1": "控制台自带 Playground，可以直接试请求。",
  "pd.c3.2": "最近 30 天的用量图表。",
  "pd.c3.3": "最多 3 个可命名的 key，随时可以吊销。",
  "pd.c3.4": "兼容 /v1/systemone 的请求格式：一段 state 加上带类型的问题。",
  "om3.h": "也可以自己运行",
  "om3.p": "同样的模型，Apache-2.0 许可，可用 Transformers、GGUF 或 MLX 运行。",
  "fc.api.h": "在浏览器中直接体验",
  "fc.api.1": "无需安装或 API Key",
  "fc.api.2": "在 Hugging Face 体验文本和图片案例",
  "fc.api.3": "控制台里有 Playground 和用量图表",
  "fc.api.4": "认证、限额、错误码都有文档",
  "fc.os.h": "自己运行",
  "fc.os.1": "Apache-2.0 权重",
  "fc.os.2": "支持 CPU、CUDA 和 Apple silicon",
  "fc.os.3": "支持 CPU、CUDA 和 Apple silicon",
  "fc.os.4": "2B v4 最多支持 32,768 个输入 token（含图片）",
  "k3.free": "每个账号的每日额度",
  "k3.lat": "托管 API 状态",
  "k3.tok": "每次输入 token",
  "k3.out.v": "概率",
  "k3.out": "每个选项一个，无需解析文本",
  "tr.1": "不存储请求内容",
  "tr.2": "失败请求不计次",
  "tr.3": "开源本地模型仍可使用",
  "om.stats": "{dl} 次下载 · {m} 个模型 · Apache-2.0",
  "om.s.dl": "下载",
  "om.s.m": "模型",
  "om.s.likes": "点赞",
  "run.send": "发送中",
  "run.ok": "已记录的示例 · GPU 计算 {s} 秒",
  "run.see": "查看响应",
  "news.h": "最新动态",
  "news.all": "全部更新",
  "uc.all": "全部场景",
  "bench.all": "完整评测",
  "final.h": "从一个判断开始",
  "final.p": "使用托管 API，或在自己的机器上运行同类模型。",
  "final.models": "查看模型",
  "h3.em": "本地",
  "ann.k": "公告",
  "ann.h": "Jev-Style 2B v4 可以读图",
  "ann.p": "第一个支持图片输入的模型（PyTorch 版）。",
  "ann.a": "了解 2B v4",
  "go.key": "免费，目前不设账号固定限额",
  "go.demo": "无需安装和 API key",
  "go.local": "CPU、CUDA 和 Apple silicon",
  "h3.meta": "在 Python 中完成文本分类、请求路由和固定选项评分。可用免费托管 API，也可在 CPU、CUDA 与 Apple silicon 上运行小型开源模型。",
  "k.full": "Full",
  "k.listed": "上榜日期",
  "ty.q.refund": "要退款？",
  "ty.q.team": "哪个团队？",
  "ty.q.today": "今天要处理？",
  "one.v42-2b": "v4.2 决策模型，提供 PyTorch、GGUF 和 MLX 下载。PyTorch 支持文本和图片，GGUF 与 MLX 支持文本。"
 }
};
let lang = location.pathname.startsWith('/zh/') ? 'zh' : 'en';   // English by default; 中文 only when the visitor picks it
const t = k => I18N[lang][k] ?? I18N.en[k] ?? k;
const pct = (v,d=1) => (Math.round(v*100*10**d + 1e-6)/10**d).toFixed(d)+'%';   // round half up: 0.7915 -> 79.2%
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fam = id => DATA.families.find(f => f.id === id);
const HF = 'https://huggingface.co/';
const display = f => ({'v42-2b':'Jev-Style 2B v4.2', 'v4-2b':'Jev-Style 2B v4', 'v3-2b':'Jev-Style 2B v3', v3:'Jev-Style 0.8B v3', macjev:'MacJev 322M', v2:'Decision 2B v2', v1:'Decision 2B v1', 'cascade-9b':'Jev-Style Cascade 9B'})[f.id] || f.name;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LBL = {en:{'MASSIVE intent':'MASSIVE, 37 held-out locales'}, zh:{'Laya typed':'Laya typed 版','Laya multi':'Laya 多语版','Best Laya':'最佳 Laya','Best official Laya':'最佳官方 Laya','Jailbreak':'越狱检测','Toxicity':'毒性检测','Model routing':'模型路由','MASSIVE intent':'MASSIVE，37 个留出语种','English Laya':'英文 Laya','Laya EN':'英文 Laya','Laya multilingual':'Laya 多语版','Laya':'Laya','Qwen3.5-2B-Base zero-shot':'Qwen3.5-2B-Base 零样本','Qwen base':'Qwen 底座'}};
const lbl = x => (LBL[lang] && LBL[lang][x]) || x;
function keepFocus(box, fn){
  const a = document.activeElement, key = box.contains(a) ? ['hm','qs','mf','ap','ty'].find(k => a.dataset && k in a.dataset) : null, val = key && a.dataset[key];
  fn();
  if (key) box.querySelector(`[data-${key}="${val}"]`)?.focus();
}
const fmtDate = iso => { if (!iso) return ''; const d = new Date(iso.length <= 10 ? iso+'T00:00:00Z' : iso);
  return new Intl.DateTimeFormat(lang==='zh' ? 'zh-CN' : 'en-US', {year:'numeric', month:'short', day:'numeric', timeZone:'UTC'}).format(d); };
const relDate = f => fmtDate(f.released) + (f.release_planned ? ` · ${t('planned')}` : '');   // patch_2b.py: planned date mark
function hash(s){ let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function rng(seed){ let a = hash(seed); return () => { a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

/* ---------- generative gradient art (one seeded composition per tile) ---------- */
const PAL = {
  macjev:['#E9EEFF','#8FB0FF','#A8EBD7','#6A86F5','#DCE7FF'],
  v2:['#FFF0E8','#FFB39A','#F59AC0','#B7A2FF','#FFE3D3'],
  v1:['#F2EEE3','#C9DDB6','#9CC7D6','#E7D9B8','#F7F4EC'],
  eval:['#EEF7FF','#9ED3F7','#C3B8FF','#86E0C8','#F2F0FF'],
  b1:['#F4FFE9','#B9EE8C','#77D9C9','#E8F99F','#DFF8F0'],
  b2:['#EAF3FF','#7FB2FF','#A99CFF','#A6E3FF','#E4ECFF'],
  b3:['#FFF6E5','#FFCE7A','#FF9C8A','#FFE5A8','#FFF0DD'],
  b4:['#F3ECFF','#C7A5FF','#FF9FD0','#9AB8FF','#F7EEFF'],
  plan:['#F1F1F1','#CFCFD6','#E6E3DA','#BCC6D2','#F7F7F7'],
  'cascade-9b':['#FFF8E6','#FFD98A','#9EE0D2','#B7C4FF','#FFFBF0'],   // patch_9b.py
  b11:['#F3FFF7','#A8EBC4','#FFE08F','#9CC9FF','#F7FFFA'],
  b12:['#FFF4F8','#FFC2D6','#FFE3A0','#A9D8FF','#FFF8FB'],
  v3:['#F1ECFF','#B9A6FF','#8FD3FF','#FFC2E2','#E9F4FF'],
  b5:['#EEF0FF','#9AA8FF','#C9B8FF','#9FE3F0','#F4F1FF'],
  b6:['#EFFBF5','#8FE0C0','#A7C8FF','#D8F59A','#F0FAFF'],
  b7:['#FFF1F4','#FFB0C4','#D1B4FF','#FFD8A8','#FFF6EE'],
  'v3-2b':['#EAF7FF','#8CCBFF','#A0E6D6','#C6B6FF','#F1F8FF'],
  'v4-2b':['#EEF1FF','#7F99FF','#9EE6F0','#D2B8FF','#F3F5FF'],   // site_v4.py
  b13:['#EEF2FF','#8FA6FF','#A5E8DE','#C9B5FF','#F4F6FF'],
  b14:['#F2F6FF','#9CB4FF','#FFD2A6','#A8E3F5','#F7F9FF'],
  b8:['#EAF8FF','#86C9F5','#9BE3CF','#B9B4FF','#F0FAFF'],
  b9:['#F0F4FF','#A6B8FF','#8FDDF0','#E0C2FF','#F5F7FF'],
  b10:['#FFF6EC','#FFC98F','#9FDCF5','#FFB5C8','#FFF9F2'],
};
function art(cv, seed, pal){
  const n = 48, x = cv.getContext('2d'), r = rng(seed);
  cv.width = cv.height = n;
  x.fillStyle = pal[0]; x.fillRect(0,0,n,n);
  for (let i=0;i<6;i++){
    const cx = r()*n, cy = r()*n, rad = n*(.3 + r()*.55), c = pal[1 + i%(pal.length-1)];
    const g = x.createRadialGradient(cx,cy,0,cx,cy,rad); g.addColorStop(0,c); g.addColorStop(1,c+'00');
    x.fillStyle = g; x.fillRect(0,0,n,n);
  }
  const a = r()*Math.PI, dx = Math.cos(a)*n, dy = Math.sin(a)*n, lg = x.createLinearGradient(n/2-dx, n/2-dy, n/2+dx, n/2+dy);
  lg.addColorStop(.4,'rgba(255,255,255,0)'); lg.addColorStop(.5,'rgba(255,255,255,.5)'); lg.addColorStop(.6,'rgba(255,255,255,0)');
  x.fillStyle = lg; x.fillRect(0,0,n,n);
}
function media(seed, pal, cls='', ov=''){
  return `<div class="media ${cls}"><div class="mi"><canvas class="art" data-seed="${esc(seed)}" data-pal="${pal}" aria-hidden="true"></canvas>${ov}</div></div>`;
}
function paintArt(root){
  root.querySelectorAll('canvas.art').forEach(cv => {
    art(cv, cv.dataset.seed, PAL[cv.dataset.pal] || PAL.plan);
    const r = rng(cv.dataset.seed+'/drift');
    cv.style.setProperty('--dur', (18 + r()*14).toFixed(1)+'s'); cv.style.setProperty('--dl', (-r()*20).toFixed(1)+'s');
  });
}

/* ---------- hero: model switcher (countdown tabs) driving the live stage ---------- */
const dlAll = r => r.downloadsAllTime ?? r.downloads ?? 0, dl30 = r => r.downloads ?? 0;
const famDl = f => f.repos.reduce((s,r) => s + dlAll(r), 0);
const onHub = r => r.downloads != null || !!r.createdAt;   // patch_2b.py: repos not on the Hub yet (planned release) stay out of Downloads/Releases

/* ---------- featured canvas: tokens stream through one lens into weighted answers ---------- */
const ICON_PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.5v9l7.5-4.5z" fill="currentColor"/></svg>';

/* ---------- sections ---------- */

const MODEL_PAGES = {'v42-2b':'/models/#v42-2b', 'v4-2b':'/models/2b-v4/', v3:'/models/0-8b-v3/'};
const SPOT_ID = 'v4-2b';
const jbRef = (f, k) => f.bench.jevbench.board.find(b => b.key === k).acc;
const BENCH_NAME = {'v4-2b':'Jev-Style 2B v4', 'v3-2b':'Jev-Style 2B v3', v3:'Jev-Style 0.8B v3'};   // JevBench labels: never "Decision 2B" (FlyMy.AI's model)

/* ---------- demos: featured tiles (autoplay while on screen), "More demos" expander with cards (hover preview), lightbox ---------- */
let DLIST = null, moreOpen = false, featIO = null, visSeen = '';
const DEMOS = () => DLIST || (DLIST = (l => [...l.filter(d => d.featured), ...l.filter(d => !d.featured)])(DATA.demos || []));   // lightbox order = page order
const dtxt = (d, k) => d[k + '_' + lang] || d[k + '_en'] || '';
const fmtDur = s => { s = Math.max(0, Math.round(+s || 0)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
const quiet = () => REDUCED;   // no video motion under reduced motion
const ICON_EXPAND = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 2.5h3v3M5.5 11.5h-3v-3M11.5 2.5 8 6M2.5 11.5 6 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const FEAT_ON = new Set();   // featured tiles currently on screen
function vidSources(v, d){
  v.textContent = '';
  [[d.video, 'video/mp4'], [d.webm, 'video/webm']].forEach(([src, type]) => { if (!src) return; const s = document.createElement('source'); s.src = src; s.type = type; v.append(s); });
  v.load();
}
const dLabel = d => `${esc(dtxt(d, 'title'))}<span class="sr-only"> · ${t('dm.play')}${+d.duration_s > 0 ? ' · ' + fmtDur(d.duration_s) : ''}</span>`;
function dcard(d, i, j, big){
  const cap = dtxt(d, 'caption');
  return `<article class="dcard hov${big ? ' big' : ''}" style="--i:${j}"><div class="media vid"><div class="mi"><img src="${esc(d.poster)}" alt="" loading="lazy" decoding="async"><video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video></div><div class="dov">${+d.duration_s > 0 ? `<span class="ovtag num">${fmtDur(d.duration_s)}</span>` : '<span></span>'}<span class="dpl" aria-hidden="true">${big ? ICON_EXPAND : ICON_PLAY}</span></div></div><h3 class="card-t"><button type="button" class="mt" data-demo="${i}">${dLabel(d)}</button></h3><p class="dcap"${cap ? '' : ' hidden'}>${esc(cap)}</p></article>`;
}
function setMore(open){
  moreOpen = open;
  $('dMoreBtn').setAttribute('aria-expanded', String(open)); $('dMore').hidden = !open;
  if (open && !REDUCED){ const g = $('dGrid'); g.classList.remove('in'); void g.offsetWidth; g.classList.add('in'); }
  if (!open) gridPreviewsOff();
}
/* featured tiles: muted loop while at least a quarter is on screen; paused off screen, in a hidden tab and while the
   lightbox is open; never loaded under reduced motion or the 'still' state, where the poster shows instead */
function featWatch(){
  if (featIO) featIO.disconnect();
  FEAT_ON.clear();
  if (!('IntersectionObserver' in window)) return;
  featIO = new IntersectionObserver(es => { es.forEach(e => { const c = e.target.closest('.dcard'); if (e.isIntersecting) FEAT_ON.add(c); else FEAT_ON.delete(c); }); featArm(); }, {threshold:.25});
  $('dFeat').querySelectorAll('.vid').forEach(el => featIO.observe(el));
}
function featArm(){
  document.querySelectorAll('#dFeat .dcard').forEach(card => {
    const v = card.querySelector('video'), box = card.querySelector('.vid'), d = DEMOS()[+card.querySelector('[data-demo]').dataset.demo];
    const live = () => FEAT_ON.has(card) && card.isConnected && !quiet() && !document.hidden && $('vbox').hidden;
    if (!d || !v) return;
    if (!live()){ if (!v.paused) v.pause(); if (quiet()) box.classList.remove('playing'); return; }
    if (!v.firstChild) vidSources(v, d);
    v.muted = true;
    const p = v.play(); if (p) p.then(() => { if (live()) box.classList.add('playing'); else v.pause(); }, () => {});
  });
}
function previewOn(card){
  const d = DEMOS()[+card.querySelector('[data-demo]').dataset.demo], v = card.querySelector('video');
  if (!d || !v || quiet() || !$('vbox').hidden) return;
  if (!v.firstChild) vidSources(v, d);
  v.muted = true;
  const p = v.play(); if (p) p.then(() => { if (v.closest('.dcard:hover')) card.querySelector('.vid').classList.add('playing'); else v.pause(); }, () => {});
}
function previewOff(card){ const v = card.querySelector('video'); if (v) v.pause(); card.querySelector('.vid')?.classList.remove('playing'); }
const gridPreviewsOff = () => document.querySelectorAll('#dGrid .dcard').forEach(previewOff);
const previewsOff = () => document.querySelectorAll('.dcard').forEach(previewOff);   // every card and tile back to its poster
let vbI = -1, vbFocus;
function vbFill(){
  const d = DEMOS()[vbI]; if (!d) return;
  $('vbTitle').textContent = dtxt(d, 'title');
  $('vbCap').textContent = [dtxt(d, 'caption'), +d.duration_s > 0 ? fmtDur(d.duration_s) : ''].filter(Boolean).join(' · ');
  $('vbPrev').hidden = $('vbNext').hidden = DEMOS().length < 2;
}
function vbLoad(){
  const d = DEMOS()[vbI], v = $('vbVideo');
  vbFill(); v.pause(); v.muted = true; v.poster = d.poster || ''; vidSources(v, d);
  if (!quiet()){ const p = v.play(); if (p) p.catch(() => {}); }   // muted autoplay; the controls unmute
}
function openDemo(i){
  if (!DEMOS()[i]) return;
  if ($('vbox').hidden) vbFocus = document.activeElement;
  gridPreviewsOff(); setMenu(false); vbI = i;
  $('vbox').hidden = false; setInert(true); document.body.style.overflow = 'hidden';
  featArm(); vbLoad(); $('vbClose').focus();
}
function closeDemo(){
  if ($('vbox').hidden) return;
  const v = $('vbVideo'); v.pause(); v.textContent = ''; v.removeAttribute('poster'); v.load();
  $('vbox').hidden = true; setInert(false); document.body.style.overflow = '';
  const shown = el => el && el.isConnected && el.getClientRects().length > 0;   // a card in the collapsed "More demos" is not
  const back = [document.querySelector(`[data-demo="${vbI}"]`), vbFocus, $('dMoreBtn')].find(shown);
  back?.focus();
  featArm();
}
function stepDemo(k){ const n = DEMOS().length; if ($('vbox').hidden || n < 2) return; vbI = (vbI + k + n) % n; vbLoad(); }

/* ---------- downloads: totals + one bar per repository ---------- */
const LIVE = {ok:false, src:null, at:null};
function renderDownloads(){
  // Totals cover every published repository.
  const hub = [...DATA.families.flatMap(f => f.repos), ...(DATA.extra || [])].filter(onHub);
  const tot = hub.reduce((s,r) => s + dlAll(r), 0), likes = hub.reduce((s,r) => s + (r.likes || 0), 0);
  const published = DATA.families.filter(f => f.repos.some(onHub)).length;
  $('omStats').innerHTML = [[tot, t('om.s.dl')], [likes, t('om.s.likes')], [published, t('om.s.m')]].map(([v, k]) => `<div><dt>${esc(k)}</dt><dd>${v.toLocaleString('en-US')}</dd></div>`).join('');
}
const guessFormat = id => /gguf/i.test(id) ? 'GGUF' : /mlx/i.test(id) ? 'MLX' : 'HF';
function applyStats(list, src, at){
  const byId = Object.fromEntries(list.map(m => [m.id, m]));
  const before = JSON.stringify(DATA.families.map(f => f.repos.map(r => [dlAll(r), dl30(r), r.likes])));
  DATA.families.forEach(f => f.repos.forEach(r => { const m = byId[r.repo]; if (m) Object.assign(r, {downloads:m.downloads ?? 0, downloadsAllTime:m.downloadsAllTime ?? r.downloadsAllTime ?? m.downloads ?? 0, likes:m.likes ?? 0, createdAt:m.createdAt || r.createdAt}); }));
  const known = new Set(DATA.families.flatMap(f => f.repos.map(r => r.repo)));
  DATA.extra = list.filter(m => !known.has(m.id)).map(m => ({repo:m.id, format:guessFormat(m.id), downloads:m.downloads ?? 0, downloadsAllTime:m.downloadsAllTime ?? m.downloads ?? 0, likes:m.likes ?? 0, createdAt:m.createdAt, fid:'new'}));
  LIVE.ok = true; LIVE.src = src; LIVE.at = at;
  const changed = before !== JSON.stringify(DATA.families.map(f => f.repos.map(r => [dlAll(r), dl30(r), r.likes]))) || DATA.extra.length;
  if (changed){
    if (visKey() !== visSeen){ visSeen = visKey(); renderBench(); applyVisibility(); if (!$('srch').hidden) renderSearch(); }
    drawDrawer();
  }
  renderDownloads();
}
async function getJSON(url, ms){
  const ctl = window.AbortController ? new AbortController() : null, timer = ctl && setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, {cache:'no-store', signal:ctl ? ctl.signal : undefined}); return r.ok ? await r.json() : null; }
  catch(e) { return null; } finally { clearTimeout(timer); }
}
async function liveStats(){
  try {
    // 1) stats.json: same origin, refreshed every 3 h by a GitHub Action, so it works where huggingface.co is blocked
    const site = await getJSON('/stats.json', 5000);
    if (site && Array.isArray(site.models)) applyStats(site.models, 'site', new Date(site.updated));
    // 2) Hugging Face API directly: newest numbers when the visitor can reach it
    const hf = await getJSON(`https://huggingface.co/api/models?author=${encodeURIComponent(DATA.author)}&limit=200&expand[]=downloads&expand[]=downloadsAllTime&expand[]=likes&expand[]=createdAt`, 8000);
    if (Array.isArray(hf)) applyStats(hf, 'hf', new Date());
  } catch(e) { /* keep the build-time snapshot */ }
}
function renderBench(){
  const v2 = DATA.eval.v2, mj = fam('macjev').metrics[0], v1 = fam('v1').metrics.find(m => m.key==='ece5');
  const e3 = DATA.eval.v3, f3 = fam('v3'), ty = f3 && f3.metrics.find(m => m.key === 'typed');
  const c9f = fam('cascade-9b'), c9 = c9f && c9f.cascade, c9r = k => c9.jevbench.board.find(b => b.key === k);   // patch_9b.py: its two cards go first
  const c9i = c9 ? [
    {me:c9.jevbench.acc, base:c9r('jev').acc, fmt:v => pct(v), who:'Cascade 9B', vs:'Jev 1.13.0', lab:'b.c9jb', up:true, open:'cascade-9b', pal:'b11', model:display(c9f), note:t('b.c9jb.n')},
    {me:c9.jevbench.ece, base:c9r('jevk5').ece, fmt:v => v.toFixed(3), who:'Cascade 9B', vs:'JevK5-9B', lab:'b.c9ece', up:false, open:'cascade-9b', pal:'b12', model:display(c9f), note:t('c9.same').replace('{acc}', pct(c9.jevbench.acc))},
  ] : [];
  const f2 = fam('v3-2b'), b2 = f2 && f2.bench;
  const f4 = fam('v4-2b'), v4 = f4 && f4.v4, jb4 = v4 && v4.jevbench, j4 = k => jb4.board.find(b => b.key === k).acc;   // site_v4.py
  const items = [
    ...(v4 ? [
      {me:v4.di.index, base:v4.di.v3, fmt:v => v.toFixed(2), who:BENCH_NAME['v4-2b'], vs:BENCH_NAME['v3-2b'], lab:'b.4di', up:true, open:'v4-2b', pal:'b13', model:BENCH_NAME['v4-2b'], wide:true},
      {me:jb4.acc, base:j4('decider-2b'), fmt:v => pct(v), who:BENCH_NAME['v4-2b'], vs:'decider-2b', lab:'b.4jb', up:true, open:'v4-2b', pal:'b14', model:BENCH_NAME['v4-2b'], wide:true},
    ] : []),
    ...(b2 ? [
      {me:b2.jevbench.acc, base:jbRef(f2, 'decider-2b'), fmt:v => pct(v), who:BENCH_NAME['v3-2b'], vs:'decider-2b', lab:'b.2bjb', up:true, open:'v3-2b', pal:'b8', model:BENCH_NAME['v3-2b'], wide:true, note:t('b.2bjb.n')},
      {me:b2.jevbench.acc, base:jbRef(f2, 'v3'), fmt:v => pct(v), who:BENCH_NAME['v3-2b'], vs:BENCH_NAME.v3, lab:'b.2bjb08', up:true, open:'v3-2b', pal:'b9', model:BENCH_NAME['v3-2b'], wide:true, note:`+${((b2.jevbench.acc - jbRef(f2, 'v3'))*100).toFixed(1)} ${t('pts')}`},
      {me:b2.tweet_topic.acc, base:b2.tweet_topic.jev_acc, fmt:v => pct(v), who:BENCH_NAME['v3-2b'], vs:'Jev', lab:'b.2btt', up:true, open:'v3-2b', pal:'b10', model:BENCH_NAME['v3-2b'], wide:true, note:`macro-F1 ${b2.tweet_topic.macro_f1.toFixed(3)} ${t('vs')} Jev ${b2.tweet_topic.jev_macro_f1.toFixed(3)}`},
    ] : []),
    ...(e3 && ty ? [
      {me:ty.model, base:ty.base, fmt:v => pct(v), who:'v3', vs:lbl('Laya typed'), lab:'b.v3typed', up:true, open:'v3', pal:'b5', model:'Jev-Style 0.8B v3'},
      {me:e3.massive.macro_v3, base:e3.massive.macro_laya_multilingual, fmt:v => pct(v), who:'v3', vs:lbl('Laya multi'), lab:'b.v3massive', up:true, open:'v3', pal:'b6', model:'Jev-Style 0.8B v3'},
      {me:e3.calib.ECE.v3, base:e3.calib.ECE.best_laya, fmt:v => v.toFixed(3), who:'v3', vs:lbl('Best Laya'), lab:'b.v3ece', up:false, open:'v3', pal:'b7', model:'Jev-Style 0.8B v3'},
    ] : []),
    {me:v2.overview.v2.accuracy, base:v2.overview.laya.accuracy, fmt:v => pct(v), who:'v2', vs:lbl('Laya EN'), lab:'m1', up:true, open:'v2', pal:'b2', model:'Decision 2B v2'},
    {me:mj.model, base:mj.base, fmt:v => pct(v), who:'MacJev', vs:lbl('Laya'), lab:'m2', up:true, open:'macjev', pal:'b1', model:'MacJev 322M'},
    {me:v1.model, base:v1.base, fmt:v => v.toFixed(3), who:'v1', vs:lbl('Qwen base'), lab:'m3', up:false, open:'v1', pal:'b3', model:'Decision 2B v1'},
    {me:v2.permutation.v2.semantic_flip_rate, base:v2.permutation.laya.semantic_flip_rate, fmt:v => pct(v), who:'v2', vs:lbl('Laya EN'), lab:'m4', up:false, open:'v2', pal:'b4', model:'Decision 2B v2'},
  ];
  items.unshift(...c9i);   // patch_9b.py
  const HOME = ['b.4di', 'b.4jb', 'b.v3massive'];   // three cards on the home page; the rest live in each model's drawer
  $('carTrack').innerHTML = items.filter(it => famVis(fam(it.open)) && HOME.includes(it.lab)).sort((a,b) => HOME.indexOf(a.lab) - HOME.indexOf(b.lab)).map((it,i) => {
    const mx = Math.max(it.me, it.base);
    const row = (cls, name, v) => `<div class="${cls}"><span>${esc(name)}</span><span class="tk"><i style="width:${(v/mx*100).toFixed(1)}%"></i></span><span>${it.fmt(v)}</span></div>`;
    const ov = `<div class="ov"><b class="big" data-cu="${it.fmt(it.me)}">${it.fmt(it.me)}</b><div class="cmp${it.wide ? ' wide' : ''}">${row('a', it.who, it.me)}${row('b', it.vs, it.base)}${it.up ? '' : `<p>${t('down')}</p>`}</div></div>`;
    return `<a class="bcard" href="#${it.open}" data-open="${it.open}">${media('bench-'+i, it.pal, '', ov)}<h3 class="card-t">${esc(t(it.lab))}</h3></a>`;
  }).join('');
  paintArt($('carTrack'));
}
/* ---------- carousel with progress ring ---------- */
const CAR = {i:0, auto:false, vis:false};
function carPer(){ const tr = $('carTrack'), it = tr.firstElementChild; return it ? Math.max(1, Math.round((tr.clientWidth + 24) / (it.offsetWidth + 24))) : 1; }
function carGo(i){
  const tr = $('carTrack'), n = tr.children.length, max = Math.max(0, n - carPer());
  CAR.i = i > max ? 0 : i < 0 ? max : i;
  tr.scrollTo({left: tr.children[CAR.i].offsetLeft - tr.firstElementChild.offsetLeft, behavior: REDUCED ? 'auto' : 'smooth'});
  carArm();
}
function carArm(){ const r = $('ring'); if (!r) return; r.classList.remove('run'); void r.getBoundingClientRect(); if (CAR.auto && CAR.vis) r.classList.add('run'); }
function carStop(){ if (!CAR.auto) return; CAR.auto = false; carArm(); }

/* ---------- quickstart tabs with countdown ---------- */
const QS = [
 {id:'start-torch', url:'https://github.com/lawrence3699/jev-style#quick-start', label:'Run locally · PyTorch', file:'shell', code:`# Python 3.10+; run inside a virtual environment.
python -m pip install "jev-style[torch]"
jev-style serve --release 2b --backend torch
# Open http://127.0.0.1:8765
# First start downloads the model. This build supports text and images.`},
 {id:'start-mac', url:'https://github.com/lawrence3699/jev-style#quick-start', label:'Run locally · Apple silicon', file:'shell', code:`# Python 3.10+; run inside a virtual environment.
python -m pip install "jev-style[mlx]"
jev-style serve --release 2b --backend mlx
# Open http://127.0.0.1:8765
# MLX is text-only. Use PyTorch for images.
# For the smaller 0.8B text model: jev-style serve --release 0.8b`},
 {id:'pip', url:'https://pypi.org/project/jev-style/', label:'pip · jev-style · 2B v4', file:'python', code:`# pip install "jev-style[torch]"    PyTorch: text and images, including on Apple MPS
# Save a receipt image as receipt.png before running the image example below.
from jev_style import JevStyle, choice, image, noul

js = JevStyle(release="2b", backend="torch")  # Explicitly select the image-capable build on every platform
teams = {"billing": "payments, refunds", "tech": "bugs, crashes", "sales": "pricing, plans"}
out = js.decide({"messages": ["Refund still missing after 3 weeks"]},
                {"team": choice("Which team should handle this ticket?", teams)})
print(out["answers"]["team"]["choice"])     # billing

# images (PyTorch build only): the state names an asset, the image goes in assets
state = {"receipt": "r1", "policy": "Meals over 50 EUR need a manager approval."}
out = js.decide(state, {"approval": noul("Does this receipt need a manager approval?")},
                assets={"r1": image("receipt.png")})     # PNG or JPEG, 280 to 1,568 px a side`},
 {id:'c9', repo:'chaoliangUNSW/Jev-Style-Cascade-9B', label:'Cascade 9B · jev-style', file:'shell', code:`pip install "jev-style[torch]>=0.4.0" "jevk5[fast] @ git+https://github.com/allebee/jevk5@v0.3.3"
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
jev-style serve --cascade cascade-9b --backend torch --device cuda    # one /v1/systemone model

# From Python:
#   from jev_style import JevStyle
#   c = JevStyle(cascade="cascade-9b")
#   c.decide(state, questions)       # each answer carries "tier": 1 = the 2B, 2 = JevK5-9B`},
 {id:'b4t', repo:'chaoliangUNSW/Jev-Style-2B-Decision-v4', label:'2B v4 · Transformers', file:'python', code:`# hf download chaoliangUNSW/Jev-Style-2B-Decision-v4 --local-dir jev-v4-2b
# cd jev-v4-2b && pip install -r requirements.txt
from jev_style_decision import JevStyleDecision

m = JevStyleDecision(".")        # CUDA, Apple MPS or CPU; float32 by default
receipt = {"receipt": "<|image_1|>", "policy": "Meals over 50 EUR need a manager approval."}
r = m.decide(receipt, "Does this receipt need a manager approval?", images=["assets/receipt.png"])
print(r["answer"], r["probabilities"])     # true {'false': 0.116, 'true': 0.884}`},
 {id:'b4g', repo:'chaoliangUNSW/Jev-Style-2B-Decision-v4-GGUF', label:'2B v4 · GGUF', file:'shell', code:`hf download chaoliangUNSW/Jev-Style-2B-Decision-v4-GGUF --local-dir jev-v4-2b-gguf
cd jev-v4-2b-gguf && pip install -r requirements.txt

git clone https://github.com/ggml-org/llama.cpp
git -C llama.cpp checkout 441df11f65ea0b6d0c72965aaf70c8241070ddcb
sh build_jev_score.sh llama.cpp          # -> ./build/jev-score-v2 (NVIDIA: LLAMA_CMAKE_FLAGS="-DGGML_CUDA=ON")

python jev_style_decision_gguf.py \\
  --state "The user said: 'Write a reply to Bob with the Q3 report attached, but let me check it before it goes out.' The draft is written and the report is attached." \\
  --question "What should the assistant do next?" \\
  --options '{"send": "press Send now", "ask_user": "ask the user to review the draft", "discard": "delete the draft"}'
# -> "answer": "ask_user", probability 0.728 (F16, CUDA)`},
 {id:'b4m', repo:'chaoliangUNSW/Jev-Style-2B-Decision-v4-MLX', label:'2B v4 · MLX', file:'shell', code:`hf download chaoliangUNSW/Jev-Style-2B-Decision-v4-MLX --local-dir Jev-Style-2B-Decision-v4-MLX
cd Jev-Style-2B-Decision-v4-MLX && pip install -r requirements.txt     # mlx-lm must be exactly 0.31.3

python jev_style_decision_mlx.py --model-dir bf16 \\
  --state "Finder is open on ~/Reports. The user asked: email report.pdf to Ana." \\
  --question "What should the agent do next?" \\
  --options '{"attach_report": "attach report.pdf to a new email to Ana", "rename_report": null, "close_finder": "close the Finder window"}'`},
 {id:'b2t', repo:'chaoliangUNSW/Jev-Style-2B-Decision-v3', label:'2B v3 · Transformers', file:'python', code:`# hf download chaoliangUNSW/Jev-Style-2B-Decision-v3 --local-dir jev-v3-2b
# cd jev-v3-2b && pip install -r requirements.txt
from jev_style_decision import JevStyleDecision

m = JevStyleDecision(".")        # CUDA, Apple MPS or CPU; float32 by default
r = m.decide("The user asked to cancel the order", "What should happen?",
             options={"cancel": "cancel the order", "ship": "ship it"})
print(r["answer"], r["probabilities"])`},
 {id:'b2g', repo:'chaoliangUNSW/Jev-Style-2B-Decision-v3-GGUF', label:'2B v3 · GGUF', file:'shell', code:`hf download chaoliangUNSW/Jev-Style-2B-Decision-v3-GGUF --local-dir jev-v3-2b-gguf
cd jev-v3-2b-gguf && pip install -r requirements.txt

git clone https://github.com/ggml-org/llama.cpp
git -C llama.cpp checkout 441df11f65ea0b6d0c72965aaf70c8241070ddcb
sh build_jev_score.sh llama.cpp          # -> ./build/jev-score-v2

python jev_style_decision_gguf.py \\
  --state "The user said: 'Write a reply to Bob with the Q3 report attached, but let me check it before it goes out.' The draft is written and the report is attached." \\
  --question "What should the assistant do next?" \\
  --options '{"send": "press Send now", "ask_user": "ask the user to review the draft", "discard": "delete the draft"}'
# -> "answer": "ask_user", probability 0.860 (F16, Metal)`},
 {id:'b2m', repo:'chaoliangUNSW/Jev-Style-2B-Decision-v3-MLX', label:'2B v3 · MLX', file:'shell', code:`hf download chaoliangUNSW/Jev-Style-2B-Decision-v3-MLX --local-dir Jev-Style-2B-Decision-v3-MLX
cd Jev-Style-2B-Decision-v3-MLX && pip install -r requirements.txt     # mlx-lm must be exactly 0.31.3

python jev_style_decision_mlx.py --model-dir bf16 \\
  --state "Finder is open on ~/Reports. The user asked: email report.pdf to Ana." \\
  --question "What should the agent do next?" \\
  --options '{"attach_report": "attach report.pdf to a new email to Ana", "rename_report": null, "close_finder": "close the Finder window"}'`},
 {id:'v3t', repo:'chaoliangUNSW/Jev-Style-0.8B-Decision-v3', label:'0.8B v3 · Transformers', file:'python', code:`# hf download chaoliangUNSW/Jev-Style-0.8B-Decision-v3 --local-dir jev-v3
# cd jev-v3 && pip install -r requirements.txt
from jev_style_decision import JevStyleDecision

m = JevStyleDecision(".")        # CUDA, Apple MPS or CPU
r = m.decide(
    {"ticket": "I was charged twice for my subscription this month.", "customer_tier": "pro"},
    "Which team should handle this ticket?",
    options={"billing": "payments, invoices, refunds",
             "technical": "bugs and outages",
             "sales": "new purchases"},
    category="theme_routing",
)
print(r["answer"], r["probabilities"])`},
 {id:'v3g', repo:'chaoliangUNSW/Jev-Style-0.8B-Decision-v3-GGUF', label:'0.8B v3 · GGUF', file:'shell', code:`hf download chaoliangUNSW/Jev-Style-0.8B-Decision-v3-GGUF --local-dir jev-v3-gguf
cd jev-v3-gguf && pip install -r requirements.txt

git clone https://github.com/ggml-org/llama.cpp
git -C llama.cpp checkout 441df11f65ea0b6d0c72965aaf70c8241070ddcb
sh build_jev_score.sh llama.cpp          # -> ./build/jev-score

python jev_style_decision_gguf.py --quant Q4_K_M \\
  --state "The film was excellent." \\
  --question "What is the sentiment of this review?" \\
  --options '["negative", "positive"]' --category general_sentiment`},
 {id:'mj', repo:'chaoliangUNSW/MacJev-322M-4K-Laya', label:'MacJev · PyTorch', file:'python', code:`# hf download chaoliangUNSW/MacJev-322M-4K-Laya --local-dir MacJev
from macjev import MacJev

model = MacJev(".", device="mps")
result = model.decide(
    state={"request": "打开浏览器",
           "available_actions": ["open_browser", "copy_file", "ask_user"]},
    question={"t": "choice",
              "ins": "Which available action best matches the user's request?",
              "crit": {"open_browser": "Open the user's browser",
                       "copy_file": "Copy a file inside the approved folder",
                       "ask_user": "Ask for clarification"}},
)
print(result["answer"], result["probabilities"])`},
 {id:'mjx', repo:'chaoliangUNSW/MacJev-322M-4K-Laya-MLX', label:'MacJev · MLX', file:'python', code:`# hf download chaoliangUNSW/MacJev-322M-4K-Laya-MLX --local-dir MacJev-MLX
from macjev_mlx import MacJevMLX

model = MacJevMLX(".")
result = model.decide(
    state={"request": "打开浏览器"},
    question={"t": "noul", "ins": "Does the request ask to open a browser?"},
)
print(result["answer"], result["top_probability"])`},
 {id:'v2g', repo:'chaoliangUNSW/Jev-Style-Qwen3.5-2B-Decision-v2-GGUF', label:'v2 · GGUF', file:'shell', code:`hf download chaoliangUNSW/Jev-Style-Qwen3.5-2B-Decision-v2-GGUF --local-dir jev-v2-gguf
cd jev-v2-gguf
llama-server -m Jev-Style-v2-Calibrated-Q8_0.gguf -c 2048 -ngl 99 --port 8080

python jev_decision_client.py --url http://127.0.0.1:8080 \\
  --state "The film was excellent." \\
  --question "What is the sentiment of this review?" \\
  --options negative positive`},
];
const QS_FOR = {'v4-2b':'pip', 'v3-2b':'b2t', v3:'v3t', macjev:'mj', v2:'v2g', 'cascade-9b':'c9'};
function hl(code){
  return esc(code).split('\n').map(line => {
    const i = line.indexOf('#'); let head = i>=0 ? line.slice(0,i) : line; const tail = i>=0 ? `<span class="c1">${line.slice(i)}</span>` : '';
    head = head.replace(/(&quot;.*?&quot;)|\b(from|import|print|python|hf|cd|llama-server|git|sh|pip)\b/g, (m, s, k) => s ? `<span class="s2">${s}</span>` : `<span class="k">${k}</span>`);   // one pass (patch_9b.py)
    return head + tail;
  }).join('\n');
}

/* ---------- charts (drawer) ---------- */
function txt(x,y,s,o={}){ return `<text x="${x}" y="${y}" fill="${o.fill||css('--ink2')}" font-size="${o.size||12}" font-family="${o.mono?css('--mono'):css('--sans')}" text-anchor="${o.anchor||'start'}" dominant-baseline="${o.base||'middle'}"${o.weight?` font-weight="${o.weight}"`:''}>${esc(s)}</text>`; }
function svg(w,h,g,label=''){ return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"${label ? ` aria-label="${esc(label)}"` : ''}>${g}</svg>`; }
function dotPlot(el, rows, series, o={}){
  const W = Math.max(280, el.clientWidth), narrow = W<480, labW = narrow?100:150, rowH = 30, top = 22;
  const x0 = labW, x1 = W-50, H = top+rows.length*rowH+4, [lo,hi] = o.domain||[0,1], X = v => x0+(v-lo)/(hi-lo)*(x1-x0);
  let g = '';
  (o.ticks||[0,.25,.5,.75,1]).forEach(v => { g += `<line x1="${X(v)}" x2="${X(v)}" y1="${top-6}" y2="${H-4}" stroke="${css('--line')}"/>` + txt(X(v), top-14, Math.round(v*100)+'%', {size:10.5, mono:true, anchor:'middle', fill:css('--ink3')}); });
  rows.forEach((r,i) => {
    const y = top+i*rowH+rowH/2, vs = r.values.map(v => v.v);
    g += txt(0, y, r.label, {size:12, fill:css('--ink')});
    g += `<line x1="${X(Math.min(...vs))}" x2="${X(Math.max(...vs))}" y1="${y}" y2="${y}" stroke="${css('--muted')}" stroke-width="2"/>`;
    r.values.forEach(v => { const s = series[v.key]; g += `<circle cx="${X(v.v)}" cy="${y}" r="${s.r}" fill="${s.color}" stroke="${css('--bg')}" stroke-width="1.5"><title>${esc(s.label)}: ${pct(v.v)}</title></circle>`; });
    const h = r.values.find(v => v.key===o.highlight);
    if (h) g += txt(W, y, pct(h.v), {size:12, mono:true, anchor:'end', fill:css('--acc-ink'), weight:500});
  });
  el.innerHTML = svg(W,H,g, rows.map(r => `${r.label}: ${r.values.map(v => `${series[v.key].label} ${pct(v.v)}`).join(', ')}`).join('; '));
}
function legend(series){ return `<div class="legend">${Object.values(series).map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div>`; }
function reliability(el, rel){
  const W = Math.max(260, el.clientWidth), H = Math.round(Math.min(W*.62, 300)), l = 40, r = 8, tp = 8, histH = 30, b = 36+histH, lo = .3;
  const X = v => l+(v-lo)/(1-lo)*(W-l-r), Y = v => tp+(1-v)/(1-lo)*(H-tp-b);
  let g = '';
  [.3,.5,.7,.9].forEach(v => { g += `<line x1="${l}" x2="${W-r}" y1="${Y(v)}" y2="${Y(v)}" stroke="${css('--line')}"/>` + txt(l-6, Y(v), Math.round(v*100)+'%', {size:10.5, mono:true, anchor:'end', fill:css('--ink3')}) + txt(X(v), H-b+14, Math.round(v*100)+'%', {size:10.5, mono:true, anchor:'middle', fill:css('--ink3')}); });
  g += `<line x1="${X(lo)}" y1="${Y(lo)}" x2="${X(1)}" y2="${Y(1)}" stroke="${css('--ink3')}" stroke-dasharray="4 4"/>`;
  const maxN = Math.max(...rel.bins.map(x => x.n)), bw = (X(1)-X(lo))/(1-lo)/15 - 2;
  rel.bins.forEach(bn => {
    const cx = X(bn.mean_confidence), cy = Y(Math.max(lo,bn.accuracy)), s = 3+3.5*Math.sqrt(bn.n/maxN);
    g += `<line x1="${cx}" x2="${cx}" y1="${Y(Math.max(lo,bn.wilson95[0]))}" y2="${Y(Math.min(1,bn.wilson95[1]))}" stroke="${css('--acc')}" opacity=".45" stroke-width="1.5"/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="${s}" fill="${css('--acc')}"><title>${pct(bn.mean_confidence)} → ${pct(bn.accuracy)} (n=${bn.n})</title></circle>`;
    const hh = (histH-6)*bn.n/maxN; g += `<rect x="${X((bn.lo+bn.hi)/2)-bw/2}" y="${H-hh}" width="${bw}" height="${hh}" rx="1.5" fill="${css('--muted')}"/>`;
  });
  g += txt(X(lo), H-b+29, t('rel.x'), {size:11, fill:css('--ink3')}) + txt(W-r, H-histH-4, t('rel.n'), {size:10.5, anchor:'end', fill:css('--ink3'), base:'auto'});
  el.innerHTML = svg(W,H,g, t('c.rel'));
}

/* ---------- drawer ---------- */
let openId = null, lastFocus;
function kpi(v, label, sub){ return `<div><span>${label}</span><b>${v}</b>${sub?`<small>${sub}</small>`:''}</div>`; }
function drawDrawer(){
  if (!openId) return;
  const f = fam(openId), name = display(f);
  $('drCap').textContent = f.repos[0].repo.split('/')[1];
  let k, charts;
  if (f.id === 'v2'){
    const ev = DATA.eval.v2;
    const L = lbl('English Laya');
    k = kpi(pct(ev.overview.v2.accuracy), t('m1'), `${t('vs')} ${L} ${pct(ev.overview.laya.accuracy)}`) + kpi(ev.overview.v2.ece.toFixed(3), t('m.ece5'), `${t('vs')} ${L} ${ev.overview.laya.ece.toFixed(3)} · ${t('lower')}`) + kpi(pct(ev.permutation.v2.semantic_flip_rate), t('m4'), `${t('vs')} ${L} ${pct(ev.permutation.laya.semantic_flip_rate)} · ${t('lower')}`) + kpi(f.params, t('k.params'), `${f.context} ${t('k.ctx')}`);
    charts = `<div><p class="cap">${t('c.tasks')}</p><div class="chart" id="dc1" style="margin-top:10px"></div><div id="dl1"></div></div><div><p class="cap">${t('c.rel')}</p><div class="chart" id="dc2" style="margin-top:10px"></div></div><p class="dr-note">${t('note.v2')}</p>`;
  } else if (f.cascade){   // patch_9b.py
    const c = f.cascade, jb = c.jevbench, ref = x => jb.board.find(b => b.key === x), mx = Math.max(...jb.board.map(b => b.acc));
    k = kpi(pct(jb.acc), t('c9.k.jb'), `${jb.correct}/${jb.items} · ${t('c9.b.k5')} ${pct(ref('jevk5').acc)} · Jev 1.13.0 ${pct(ref('jev').acc)}`)
      + kpi(pct(jb.settled_by_2b / jb.items, 0), t('c9.k.settled'), `${jb.settled_by_2b}/${jb.items} · ${t('c9.k.rest')}`)
      + kpi(jb.ece.toFixed(3), t('c9.k.ece'), `JevK5-9B ${ref('jevk5').ece.toFixed(3)} · 2B ${ref('v3-2b').ece.toFixed(3)} · ${t('lower')}`)
      + kpi(`${c.rtx5090.median_ms_jevbench} ms`, t('c9.k.lat'), t('c9.k.lats'));
    const bars = (rows, cls) => `<div class="jbars${cls}" role="list">${rows.map(r => `<div role="listitem"${r.me ? ' class="me"' : ''}><span class="n">${esc(r.n)}${r.s ? `<small>${esc(r.s)}</small>` : ''}</span><span class="tk" aria-hidden="true"><i style="width:${(r.w*100).toFixed(1)}%"></i></span><span class="v">${esc(r.v)}</span></div>`).join('')}</div>`;
    charts = `<div><p class="cap">${t('c9.cap.jb')}</p>${bars(jb.board.map(b => ({n:b.label ? t(b.label) : b.name, s:b.sub ? t(b.sub) : '', w:b.acc/mx, v:pct(b.acc), me:b.key === f.id})), '')}</div>`
      + `<div><p class="cap">${t('c9.cap.tier')}</p>${bars(jb.by_tier.map(r => ({n:t('c9.t.' + r.key), s:pct(r.correct/r.n), w:r.correct/r.n, v:`${r.correct}/${r.n}`, me:true})), ' wv')}</div>`
      + `<p class="dr-note">${t('note.cascade-9b')}</p>`;
  } else if (f.v4){   // site_v4.py: Decision Index areas and JevBench as HTML bars
    const v = f.v4, di = v.di, jb = v.jevbench, amx = Math.max(...di.areas.map(a => a[1])), jmx = Math.max(...jb.board.map(b => b.acc));
    k = kpi(di.index.toFixed(2), t('m.di4'), `${t('k.full')} ${di.full.toFixed(2)} · ${t('k.listed')} ${di.listed}`)
      + kpi(v.vision.index.toFixed(2), t('m.vis4'), `${t('k.full')} ${v.vision.full.toFixed(2)} · ${v.vision.rows.toLocaleString('en-US')} ${t('k.rows')}`)
      + kpi(pct(jb.acc), t('m.jb'), `${jb.correct}/${jb.items} · 2B v3 ${pct(jb.board.find(b => b.key === 'v3-2b').acc)} · 95% CI ${pct(jb.ci95[0])}–${pct(jb.ci95[1])}`)
      + kpi(`${v.speed.median_ms} ms`, t('m.lat4'), t('m.lat4s'));
    const bars = rows => `<div class="jbars" role="list">${rows.map(r => `<div role="listitem"${r.me ? ' class="me"' : ''}><span class="n">${esc(r.n)}${r.s ? `<small>${esc(r.s)}</small>` : ''}</span><span class="tk" aria-hidden="true"><i style="width:${(r.w*100).toFixed(1)}%"></i></span><span class="v">${esc(r.v)}</span></div>`).join('')}</div>`;
    const links = `<p class="dr-note"><a href="https://huggingface.co/spaces/${esc(f.space)}" target="_blank" rel="noopener">${t('demo.try')} <span aria-hidden="true">↗</span></a> · <a href="${esc(f.collection)}" target="_blank" rel="noopener">${t('coll.v4')} <span aria-hidden="true">↗</span></a> · <a href="${esc(di.board)}" target="_blank" rel="noopener">${t('pr.di')} <span aria-hidden="true">↗</span></a></p>`;
    charts = `<div><p class="cap">${t('c.di4')}</p>${bars(di.areas.map(([n, a4, a3]) => ({n:t(n), s:`2B v3 ${a3.toFixed(1)}`, w:a4/amx, v:a4.toFixed(1), me:true})))}</div>`
      + `<div><p class="cap">${t('c.jb4')}</p>${bars(jb.board.map(b => ({n:b.name, s:b.note || '', w:b.acc/jmx, v:pct(b.acc), me:b.key === f.id})))}</div>`
      + `${links}<p class="dr-note">${t('note.v4-2b')}</p>`;
  } else if (f.bench){
    const jb = f.bench.jevbench, tt = f.bench.tweet_topic, gain = ((jb.acc - jbRef(f, 'v3'))*100).toFixed(1);
    k = kpi(pct(jb.acc), t('m.jb'), `${t('vs')} decider-2b ${pct(jbRef(f, 'decider-2b'))} · 95% CI ${pct(jb.ci95[0])}–${pct(jb.ci95[1])}`)
      + kpi('+' + gain, t('m.jbgain'), `${BENCH_NAME.v3} ${pct(jbRef(f, 'v3'))}`)
      + kpi(pct(tt.acc), t('m.tt'), `${t('vs')} Jev ${pct(tt.jev_acc)} · macro-F1 ${tt.macro_f1.toFixed(3)} ${t('vs')} ${tt.jev_macro_f1.toFixed(3)}`)
      + kpi(f.params, t('k.params'), `${f.context} ${t('k.ctx')} · ${t('k.nocap')}`);
    const mx = Math.max(...jb.board.map(b => b.acc));
    charts = `<div><p class="cap">${t('c.jb')}</p><div class="jbars" role="list">${jb.board.map(b => `<div role="listitem"${b.key === f.id ? ' class="me"' : ''}><span class="n">${esc(b.name)}${b.note ? `<small>${esc(b.note)}</small>` : ''}</span><span class="tk" aria-hidden="true"><i style="width:${(b.acc/mx*100).toFixed(1)}%"></i></span><span class="v">${pct(b.acc)}</span></div>`).join('')}</div></div><p class="dr-note">${t('note.v3-2b')}</p>`;
  } else if (f.id === 'v3'){
    const e3 = DATA.eval.v3, typed = f.metrics.find(m => m.key === 'typed');
    k = kpi(pct(typed.model), t('m.typed'), `${t('vs')} ${lbl('Laya typed')} ${pct(typed.base)}`) + kpi(e3.calib.ECE.v3.toFixed(3), t('m.ece49'), `${t('vs')} ${lbl('Best Laya')} ${e3.calib.ECE.best_laya.toFixed(3)} · ${t('lower')}`) + kpi(pct(e3.massive.macro_v3), t('m.massive51'), `${t('vs')} ${lbl('Laya multi')} ${pct(e3.massive.macro_laya_multilingual)}`) + kpi(f.params, t('k.params'), `${f.context} ${t('k.ctx')}`);
    charts = `<div><p class="cap">${t('c.beyond')}</p><div class="chart" id="dc1" style="margin-top:10px"></div><div id="dl1"></div></div><p class="dr-note">${t('note.v3')}</p>`;
  } else if (!(f.metrics && f.metrics.length)) {
    // families with no numeric metrics yet — use headline chips
    const hl = f.headline || [];
    k = hl.slice(0, 4).map(([v, key]) => kpi(v, t(key), '')).join('') || kpi(f.params, t('k.params'), f.context ? `${f.context} ${t('k.ctx')}` : (f.langs || ''));
    const space = f.space ? `<p class="dr-note"><a href="https://huggingface.co/spaces/${esc(f.space)}" target="_blank" rel="noopener">${t('demo.try')} <span aria-hidden="true">↗</span></a></p>` : '';
    charts = `${space}<p class="dr-note">${t('one.'+f.id)}</p>`;
  } else {
    const top = f.metrics.find(m => m.better==='up'), ece = f.metrics.find(m => m.better==='down');
    k = kpi(pct(top.model), t('m.'+top.key), `${t('vs')} ${lbl(f.compare_label)} ${pct(top.base)}`) + kpi(ece.model.toFixed(3), t('m.'+ece.key), `${t('vs')} ${ece.base.toFixed(3)} · ${t('lower')}`) + kpi(f.params, t('k.params'), f.context ? `${f.context} ${t('k.ctx')}` : f.langs);
    charts = `<div><p class="cap">${t('c.pair')}</p><div class="chart" id="dc1" style="margin-top:10px"></div><div id="dl1"></div></div><p class="dr-note">${t('note.'+f.id)}</p>`;
  }
  const fmts = f.repos.map(r => `<a class="fmt" href="${HF+r.repo}" target="_blank" rel="noopener"><span class="f">${esc(r.format)} <span aria-hidden="true">↗</span></span><span class="m">${esc(r.size)} · ${esc(r.runs)}</span>${onHub(r) ? `<span class="d">${dlAll(r).toLocaleString('en-US')}<small>${t('dl.allShort')} · ${t('dl.30s')} ${dl30(r).toLocaleString('en-US')}${r.likes?` · ♥ ${r.likes}`:''}</small></span>` : `<span class="d"><small>${t('dl.soon')}</small></span>`}</a>`).join('')
    + (f.cascade ? f.cascade.tiers.map(d => `<a class="fmt" href="${esc(d.url)}" target="_blank" rel="noopener"><span class="f">${esc(d.model)} <span aria-hidden="true">↗</span></span><span class="m">${esc(d.size)} · ${t('c9.t' + d.tier)}${d.by ? ' · ' + esc(d.by) : ''}${d.license ? ' · ' + esc(d.license) : ''}</span><span class="d"><small>${t('c9.rt')}</small></span></a>`).join('') : '');   // patch_9b.py: the two models the cascade downloads
  const q = QS.find(x => x.id === QS_FOR[f.id]);
  $('drBody').innerHTML = `
    <div><div class="badges" style="margin-bottom:14px"><span class="badge">${t(f.cascade ? 'b.cfg' : 'b.open')}</span><span class="badge ${f.status==='latest'?'new':''}">${t(f.status==='latest'?'b.latest':'b.archived')}</span></div><h2 id="drTitle">${esc(name)}</h2><p style="color:var(--ink2);margin-top:10px">${t('one.'+f.id)}</p>
      <div class="dr-actions"><a class="btn dark" href="${HF+f.repos[0].repo}" target="_blank" rel="noopener">${t('hf')} <span class="ar ne" aria-hidden="true">↗</span></a>${f.github ? `<a class="btn" href="${esc(f.github)}" target="_blank" rel="noopener">GitHub <span class="ar ne" aria-hidden="true">↗</span></a>` : ''}${f.status!=='latest' ? `<button type="button" class="btn" data-open="${fam(SPOT_ID) ? SPOT_ID : 'v3'}">${t('newer')} <span class="ar" aria-hidden="true">→</span></button>` : ''}</div></div>
    <div class="kpis${f.id === 'v2' || f.id === 'v3' || f.bench || f.v4 ? ' k4' : ''}">${k}</div>${charts}
    <div><p class="cap" style="margin-bottom:6px">${t('formats')}</p><div class="fmts">${fmts}</div></div>
    ${q ? `<div><p class="cap" style="margin-bottom:10px">${t('code')}</p><div class="code"><pre>${hl(q.code)}</pre></div></div>` : ''}`;
  if (f.id === 'v2'){
    const ev = DATA.eval.v2, series = {v1:{label:'v1',color:css('--t4'),r:4}, laya:{label:lbl('English Laya'),color:css('--ink3'),r:4}, v2:{label:'v2',color:css('--acc'),r:5.5}};
    const tasks = Object.keys(ev.by_task.v2).filter(x => x!=='typed_decisions').sort((a,b) => ev.by_task.v2[b]-ev.by_task.v2[a]);
    dotPlot($('dc1'), tasks.map(x => ({label:t('t.'+x), values:['v1','laya','v2'].map(m => ({key:m, v:ev.by_task[m][x]}))})), series, {domain:[.25,1], ticks:[.25,.5,.75,1], highlight:'v2'});
    $('dl1').innerHTML = legend(series);
    reliability($('dc2'), ev.reliability);
  } else if (f.cascade){
    $('drBody').querySelector('.kpis').classList.add('k4');   // patch_9b.py: four KPIs, HTML bars only
  } else if (f.bench){
    /* 2B v3: the JevBench bars are plain HTML, already in the drawer */
  } else if (f.id === 'v3'){
    const series = {base:{label:lbl('Best official Laya'),color:css('--ink3'),r:4.5}, model:{label:name,color:css('--acc'),r:5.5}};
    dotPlot($('dc1'), DATA.eval.v3.beyond.map(r => ({label:lbl(r.task), values:[{key:'base',v:r.best_laya},{key:'model',v:r.v3}]})), series, {domain:[.25,1], ticks:[.25,.5,.75,1], highlight:'model'});
    $('dl1').innerHTML = legend(series);
  } else if ($('dc1')) {
    const series = {base:{label:lbl(f.compare_label),color:css('--ink3'),r:4.5}, model:{label:name,color:css('--acc'),r:5.5}};
    dotPlot($('dc1'), f.metrics.filter(m => m.better==='up').map(m => ({label:t('m.'+m.key), values:[{key:'base',v:m.base},{key:'model',v:m.model}]})), series, {highlight:'model'});
    $('dl1').innerHTML = legend(series);
  }
}
function openDrawer(id){
  if (!famVis(fam(id))) return;
  if (!$('drawer').contains(document.activeElement)) lastFocus = document.activeElement;
  openId = id; setMenu(false);
  $('drawer').hidden = false; $('scrim').hidden = false; setInert(true);
  document.body.style.overflow = 'hidden'; $('drawer').scrollTop = 0; drawDrawer(); $('drClose').focus();
}
function closeDrawer(){
  const was = openId;
  openId = null; $('drawer').hidden = true; $('scrim').hidden = true; setInert(false);
  document.body.style.overflow = '';
  const back = lastFocus && lastFocus !== document.body && lastFocus.isConnected ? lastFocus : document.querySelector(`[data-open="${was}"]`);
  back?.focus();
}
function setInert(on){ [$('hdr'), $('top'), document.querySelector('footer.foot')].forEach(el => { if (el) el.inert = on; }); }

/* ---------- search ---------- */
let srchFocus;
function searchItems(){
  return [
    ...VIS().map(f => ({label:display(f), sub:t('cat.model'), open:f.id})),
    ...VIS().flatMap(f => f.repos).filter(repoVis).map(r => ({label:r.repo.split('/')[1], sub:r.format, href:HF+r.repo})),
    ...DATA.planned.map(x => ({label:x.name, sub:t('cat.plan'), href:'/models/'})),
    ...[['#try','ex.h'],['#use-cases','uc.h'],['#benchmarks','nav.bench'],['#start','fc.api.h']].map(([h,k]) => ({label:t(k), sub:t('page'), hash:h})),
    ...[['/models/','sec.models'],['/api/','nav.docs'],['/updates/','news.h'],[lang === 'zh' ? '/zh/about/' : '/about/','nav.about'],[lang === 'zh' ? '/zh/contact/' : '/contact/','f.contact']].map(([href,k]) => ({label:t(k), sub:t('page'), href})),
  ];
}
function renderSearch(){
  const q = $('srchIn').value.trim().toLowerCase();
  const list = searchItems().filter(x => !q || x.label.toLowerCase().includes(q) || x.sub.toLowerCase().includes(q));
  $('srchList').innerHTML = list.length ? list.map((x,i) => {
    const on = i===0 ? ' class="on"' : '', inner = `<span>${esc(x.label)}</span><small>${esc(x.sub)}</small>`;
    return `<li>${x.href ? `<a href="${x.href}" target="_blank" rel="noopener"${on}>${inner}</a>` : `<button type="button" ${x.open ? `data-sopen="${x.open}"` : `data-shash="${x.hash}"`}${on}>${inner}</button>`}</li>`;
  }).join('') : `<li class="none">${t('search.none')}</li>`;
  $('srchStat').textContent = list.length ? `${list.length} ${t('search.res')}` : t('search.none');
}
function openSearch(){
  if (!$('srch').hidden) return;
  srchFocus = document.activeElement; setMenu(false);
  $('srch').hidden = false; $('srchIn').value = ''; renderSearch(); setInert(true);
  document.body.style.overflow = 'hidden'; $('srchIn').focus();
}
function closeSearch(){ if ($('srch').hidden) return; $('srch').hidden = true; setInert(false); document.body.style.overflow = ''; if (srchFocus) srchFocus.focus(); }

/* ---------- mobile menu ---------- */
const ICON_MENU = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3.5 7.5h13M3.5 12.5h13"/></svg>';
const ICON_X = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9"/></svg>';
function setMenu(open){
  if ($('mnav').hidden === !open) return;
  $('mnav').hidden = !open; $('menuBtn').setAttribute('aria-expanded', String(open)); $('menuBtn').innerHTML = open ? ICON_X : ICON_MENU;
  document.body.style.overflow = open ? 'hidden' : '';
  $('top').inert = open; const ft = document.querySelector('footer.foot'); if (ft) ft.inert = open;
}

/* ---------- hosted API half (2026-10-08): live example, code tabs, status, theme ---------- */
const API_ORIGIN = 'https://api.jevstyle.com';
// Illustrative request/response in the hosted API format (the refund and team values come from a 2026-10-08 production call; "today" is illustrative).
const EX_REQ = `{
  "state": "Hi, I was billed twice for my March plan. Please refund one of them today.",
  "questions": {
    "refund": {"type": "noul", "instructions": "The customer asks for money back."},
    "team": {"type": "choice", "instructions": "Which team should handle this?",
             "criteria": {"billing": "charges, refunds, invoices",
                          "tech": "bugs, outages", "sales": null}},
    "today": {"type": "noul", "instructions": "The customer asks for action today."}
  }
}`;
const EX_RES = `{
  "model": "jev-style-2b-decision-v4",
  "answers": {
    "refund": {"type": "noul", "noul": 0.967},
    "team": {"type": "choice", "choice": "billing", "confidence": 0.983,
             "probabilities": {"billing": 0.989, "tech": 0.005, "sales": 0.007}},
    "today": {"type": "noul", "noul": 0.958}
  },
  "usage": {"input_tokens": 144, "output_tokens": 0},
  "latency_ms": 29.7
}`;
// one highlighted line per block span, so long lines wrap with a hanging indent instead of scrolling sideways
const STR = String.raw`"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|` + '`(?:[^`\\\\]|\\\\.)*`';
const KW = String.raw`\b(import|from|const|await|if|throw|new|print|curl|None|null|true|false)\b`;
const RE_CODE = {
  '#': new RegExp(String.raw`((?:^|\s)#.*$)|(` + STR + ')|' + KW + String.raw`|(\b\d+(?:\.\d+)?\b)`, 'g'),
  '//': new RegExp(String.raw`(\/\/.*$)|(` + STR + ')|' + KW + String.raw`|(\b\d+(?:\.\d+)?\b)`, 'g'),
};
const RE_JSON = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?\b)/g;
function hlLine(s, re, json){
  let out = '', last = 0, m; re.lastIndex = 0;
  while ((m = re.exec(s))){
    out += esc(s.slice(last, m.index));
    if (json){ const [all, str, colon, kw, num] = m; out += str ? `<span class="${colon ? 'p' : 's2'}">${esc(str)}</span>${colon ? esc(colon) : ''}` : kw ? `<span class="k">${kw}</span>` : `<span class="n">${esc(num)}</span>`; }
    else { const [all, cmt, str, kw, num] = m; out += cmt ? `<span class="c1">${esc(cmt)}</span>` : str ? `<span class="s2">${esc(str)}</span>` : kw ? `<span class="k">${kw}</span>` : `<span class="n">${esc(num)}</span>`; }
    last = m.index + m[0].length;
  }
  return out + esc(s.slice(last));
}
const codeLines = (code, re, json) => code.split('\n').map((l, i) => `<span class="ln" style="--h:${(l.match(/^ */)[0].length + 4)}ch;--i:${i}">${hlLine(l, re, json) || ' '}</span>`).join('');
const p3 = v => (+v).toFixed(3);
/* the request types in once when the code first comes into view, then the 200 shows the response's own GPU time (latency_ms 29.7) */
// live status: inference_ready:true -> "API operational"; any other answer -> "Inference unavailable"; no answer (network, CORS, timeout) -> no pill
const API_UP = {s:null};
function renderStatus(){
  const note = document.querySelector('.maint'); if (note) note.hidden = API_UP.s === 'up';
  document.querySelectorAll('.api-status').forEach(el => {
    el.hidden = !API_UP.s; if (!API_UP.s) return;
    el.dataset.state = API_UP.s; el.lastElementChild.textContent = t(API_UP.s === 'up' ? 'st.up' : 'st.down');
  });
}
async function apiHealth(){
  const ctl = window.AbortController ? new AbortController() : null, timer = ctl && setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(API_ORIGIN + '/healthz', {cache:'no-store', credentials:'omit', signal:ctl ? ctl.signal : undefined});
    let j = null; try { j = await r.json(); } catch(_){}
    API_UP.s = r.ok && j && j.inference_ready === true ? 'up' : 'down';
  } catch(e){ API_UP.s = null; }
  finally { clearTimeout(timer); }
  renderStatus();
}
// "Downloads" and "Recent releases" now live in the collapsed "All N repositories" list; old #downloads / #releases links open it


/* ---------- v3: tabbed noul / choice / score feature built from the real request/response ---------- */
const TY = ['refund', 'team', 'today'];   // the three questions of the example request
let tyActive = 'refund';
// the lines of one question/answer, cut out of the formatted EX_REQ / EX_RES text (so the fragments stay byte-identical to it)
function fragment(txt, key){
  const L = txt.split('\n'), i = L.findIndex(l => l.startsWith(`    "${key}":`)); if (i < 0) return '';
  let j = i + 1; while (j < L.length && /^ {5,}/.test(L[j])) j++;
  return L.slice(i, j).map(l => l.slice(4)).join('\n').replace(/,$/, '');
}
function ansCard(id){
  const q = JSON.parse(EX_REQ).questions, a = JSON.parse(EX_RES).answers, x = a[id];
  const bar = (name, v, top) => `<div class="pbar${top ? ' top' : ''}"><span class="nm">${esc(name)}</span><span class="tk"><i style="--w:${Math.max(1.5, v*100).toFixed(1)}%"></i></span><span class="v">${p3(v)}</span></div>`;
  let big, sub, bars;
  if (x.type === 'noul'){ big = p3(x.noul); sub = t('q.py'); bars = [[t('q.yes'), x.noul, true], [t('q.no'), 1 - x.noul, false]]; }
  else if (x.type === 'choice'){ big = x.choice; sub = `${t('q.conf')} ${p3(x.confidence)}`; bars = Object.keys(x.probabilities).map(k => [k, x.probabilities[k], k === x.choice]); }
  else { const P = x.probabilities, top = Object.keys(P).reduce((m,k) => P[k] > P[m] ? k : m); big = x.score.toFixed(2); sub = `${t('q.exp')} · ${t('q.conf')} ${p3(x.confidence)}`; bars = Object.keys(P).map(k => [`${k} · ${x.legend[k]}`, P[k], k === top]); }
  return `<article class="ans-card"><div class="ans-top"><span class="ans-q">"${id}"</span><span class="ans-type">${x.type}</span></div><p class="ans-i">${esc(q[id].instructions)}</p><p class="ans-big"><b>${esc(big)}</b><span>${esc(sub)}</span></p><div class="pbars" role="img" aria-label="${esc(bars.map(b => b[0] + ' ' + p3(b[1])).join(', '))}">${bars.map(b => bar(...b)).join('')}</div></article>`;
}
function renderTypes(swap){
  const a = JSON.parse(EX_RES).answers, type = a[tyActive].type;
  keepFocus($('tyTabs'), () => $('tyTabs').innerHTML = TY.map(id => `<button type="button" role="tab" class="tab" id="ty-${id}" data-ty="${id}" aria-controls="tyPanel" aria-selected="${id===tyActive}" tabindex="${id===tyActive ? 0 : -1}"><span class="cd" aria-hidden="true"></span>${esc(t('ty.q.' + id))}<code>${a[id].type}</code></button>`).join(''));
  tyArm();
  $('tyPanel').setAttribute('aria-labelledby', 'ty-' + tyActive);
  const code = (head, txt) => `<div class="code"><div class="code-head"><span>${esc(head)}</span></div><pre class="wrapc">${codeLines(txt, RE_JSON, true)}</pre></div>`;
  $('tyPanel').innerHTML = `<div class="feat-text"><h3>${esc(t('ty.' + type + '.h'))}</h3><div class="feat-code">${code(t('ty.reqh'), fragment(EX_REQ, tyActive))}${code(t('ty.resh'), fragment(EX_RES, tyActive))}</div></div><div class="feat-media"><div class="band-art" aria-hidden="true"><canvas class="art" data-seed="feat-${type}" data-pal="${{noul:'b5', choice:'b8', score:'b6'}[type]}"></canvas></div><div class="ans${swap && !REDUCED ? ' pre' : ''}" id="tyAns">${ansCard(tyActive)}</div></div>`;
  paintArt($('tyPanel'));
  if (swap){ const p = $('tyPanel'); p.classList.remove('swap-in'); void p.offsetWidth; p.classList.add('swap-in'); requestAnimationFrame(() => requestAnimationFrame(() => $('tyAns') && $('tyAns').classList.remove('pre'))); }
}

let tyAuto = !REDUCED, tyVis = false;
function tyArm(){
  $('tyTabs').querySelectorAll('.tab.run').forEach(b => b.classList.remove('run'));
  const b = $('tyTabs').querySelector('[aria-selected="true"]');
  if (b && tyAuto && tyVis){ void b.offsetWidth; b.classList.add('run'); }
}

/* ---------- hero: three live decisions, typed out from real production calls, then it stops on the last ---------- */
// #1 is the billing ticket below (EX_REQ/EX_RES); #2 and #3 were real calls on 2026-10-08 from a synthetic account
// (evidence: Desktop/Jev免费API落地/gpu-release-20261008/evidence/homepage-sample-calls-2.json). Probabilities rounded to 3 places.
const TICK_MORE = [
  {state:'A coding agent wants to run: git push --force origin main. The user only asked it to tidy the commits on a feature branch.', s:'0.04',
   answers:{safe:{type:'noul', noul:0.074}, action:{type:'choice', choice:'deny', probabilities:{allow:0.016, ask:0.303, deny:0.681}},
            risk:{type:'score', legend:{0:'low', 1:'medium', 2:'high'}, probabilities:{0:0.022, 1:0.253, 2:0.725}}}},
  {state:"Review: The blender arrived cracked and support hasn't answered my emails in a week. Never again.", s:'0.04',
   answers:{reply:{type:'noul', noul:0.891}, topic:{type:'choice', choice:'support', probabilities:{product:0.103, delivery:0.306, support:0.591}},
            mood:{type:'score', legend:{0:'calm', 1:'annoyed', 2:'furious'}, probabilities:{0:0.010, 1:0.201, 2:0.790}}}},
];
const TICK = {run:0, vis:true, tm:null, done:false};
const tickExamples = () => [{state:JSON.parse(EX_REQ).state, answers:JSON.parse(EX_RES).answers, s:'0.03'}, ...TICK_MORE];   // s = the response's latency_ms on the GPU (29.7 / 36.4 / 39.0 ms)
function tickRows(ans){
  return Object.keys(ans).map(k => {
    const a = ans[k];
    if (a.type === 'noul'){ const yes = a.noul >= .5, p = yes ? a.noul : 1 - a.noul; return [k, 'noul', p, `${t(yes ? 'q.yes' : 'q.no')} ${p3(p)}`]; }
    const P = a.probabilities, top = a.type === 'choice' ? a.choice : Object.keys(P).reduce((m,x) => P[x] > P[m] ? x : m);
    return [k, a.type, P[top], `${a.type === 'choice' ? top : a.legend[top]} ${p3(P[top])}`];
  });
}
function tickBuild(i){
  const EX = tickExamples(), ex = EX[i === undefined ? EX.length - 1 : i], at = EX.indexOf(ex);
  $('tick').innerHTML = `<div class="tk-head"><span>POST /v1/systemone</span><span class="tk-dots">${EX.map((_, j) => `<i${j === at ? ' class="on"' : ''}></i>`).join('')}</span><span class="tk-t" id="tkT"></span></div><p class="tk-state"><span class="tk-k">state</span><span id="tkTxt"></span><span class="tk-caret"></span></p><div class="tk-rows">${tickRows(ex.answers).map((r,j) => `<div class="tk-row" style="--i:${j}"><code>${r[0]}</code><span class="tk-ty">${r[1]}</span><span class="tk-bar"><i style="--w:${(r[2]*100).toFixed(1)}%"></i></span><span class="tk-v">${esc(r[3])}</span></div>`).join('')}</div>`;
  return ex;
}
function tickPlay(){
  const el = $('tick'), EX = tickExamples(), run = ++TICK.run;
  clearTimeout(TICK.tm);
  el.classList.remove('done', 'out');
  if (REDUCED || TICK.done){   // finished (or no motion): rest on the last example
    const ex = tickBuild(); $('tkTxt').textContent = ex.state; $('tkT').textContent = 'GPU ' + ex.s + ' s'; el.classList.add('done'); return;
  }
  const live = () => run === TICK.run;
  const later = (fn, ms) => { TICK.tm = setTimeout(() => { if (!live()) return; if (!TICK.vis || document.hidden){ later(fn, 400); return; } fn(); }, ms); };
  const playOne = i => {
    const ex = tickBuild(i), txt = $('tkTxt'), clock = $('tkT');
    el.classList.remove('done', 'out');
    let c = 0;
    const type = () => { c = Math.min(ex.state.length, c + 2); txt.textContent = ex.state.slice(0, c); if (c < ex.state.length) later(type, 24); else later(answer, 260); };
    const answer = () => {
      el.classList.add('done');
      const t0 = performance.now(), end = +ex.s, tickClock = now => { if (!live()) return; const k = Math.min(1, (now - t0) / 300); clock.textContent = 'GPU ' + (end * k).toFixed(2) + ' s'; if (k < 1) requestAnimationFrame(tickClock); };
      requestAnimationFrame(tickClock);
      if (i === EX.length - 1){ TICK.done = true; return; }   // three examples, then it stays put
      later(() => { el.classList.add('out'); later(() => playOne(i + 1), 480); }, 3400);
    };
    later(type, i === 0 ? 700 : 160);
  };
  playOne(0);
}

/* ---------- use cases: the first demo plays (muted) while it is on screen ---------- */
let ucIO = null;
function ucWatch(){
  if (ucIO) ucIO.disconnect();
  const box = $('ucGrid').querySelector('[data-demo-media]');
  if (!box || !('IntersectionObserver' in window)) return;
  const d = DEMOS()[+box.dataset.demoMedia];
  ucIO = new IntersectionObserver(es => {
    const on = es[es.length-1].isIntersecting;
    let v = box.querySelector('video');
    if (!on || quiet() || document.hidden || !$('vbox').hidden){ if (v) v.pause(); return; }
    if (!v){ v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1; box.querySelector('.mi').append(v); vidSources(v, d); }
    const p = v.play(); if (p) p.then(() => box.classList.add('playing'), () => {});
  }, {threshold:.4});
  ucIO.observe(box);
}

/* ---------- v3: models with no downloads stay off the page until they have some (data-driven, re-checked when stats load) ---------- */
const repoVis = r => dlAll(r) > 0 || (!!r.fresh && onHub(r));   // site_v4.py: fresh = just published, counts lag
const famVis = f => !!f && f.repos.some(repoVis);
const VIS = () => DATA.families.filter(famVis);
const repoOf = id => DATA.families.flatMap(f => f.repos).find(r => r.repo === id);
const visKey = () => VIS().map(f => f.id).join() + '|' + DATA.families.flatMap(f => f.repos).filter(repoVis).map(r => r.repo).join();
function applyVisibility(){
  document.querySelectorAll('footer [data-open], [data-fam]').forEach(el => { const f = fam(el.dataset.fam || el.dataset.open); if (f) el.hidden = !famVis(f); });
  document.querySelectorAll('footer [data-repo]').forEach(el => { const r = repoOf(el.dataset.repo); if (r) el.hidden = !repoVis(r); });
}

/* ---------- v3: use cases (four open a recorded demo, two point to the Playground) ---------- */
const UCS = [
  {k:'tk', demo:'patterns', type:'choice · noul · score', guide:'/use-cases/support-ticket-classification/'},
  {k:'ag', demo:'agent-approval', type:'choice', guide:'/guides/claude-code-guard/'},
  {k:'mv', demo:'snake', type:'choice'},
  {k:'md', href:'https://huggingface.co/spaces/chaoliangUNSW/jev-style-2b', type:'choice · noul', pal:'b4'},
  {k:'rt', href:'/use-cases/local-llm-routing/', type:'choice', pal:'b2'},
  {k:'in', demo:'chinese', type:'choice'},
];
const UC_FEAT = 2;   // shown up front, like the two featured demos on the old page; the rest sit behind "More"
function renderUseCases(){
  const list = DEMOS();
  const cards = UCS.map((u,i) => {
    const di = u.demo ? list.findIndex(d => d.slug === u.demo) : -1, d = di >= 0 ? list[di] : null;
    const m = d
      ? `<div class="media vid hov" data-demo-media="${di}"><div class="mi"><img src="${esc(d.poster)}" alt="" loading="lazy" decoding="async"></div><div class="dov">${+d.duration_s > 0 ? `<span class="ovtag num">${fmtDur(d.duration_s)}</span>` : '<span></span>'}<span class="dpl" aria-hidden="true">${ICON_PLAY}</span></div></div>`
      : `<div class="media hov"><div class="mi"><canvas class="art" data-seed="uc-${u.k}" data-pal="${u.pal}" aria-hidden="true"></canvas></div></div>`;
    const act = d
      ? `<button type="button" class="more" data-demo="${di}"><span>${esc(t('uc.see'))}</span> <span class="ar" aria-hidden="true">→</span><span class="sr-only"> · ${esc(t('uc.' + u.k + '.h'))}</span></button>`
      : `<a class="more" href="${u.href}"><span>${esc(t('uc.try'))}</span> <span class="ar" aria-hidden="true">→</span><span class="sr-only"> · ${esc(t('uc.' + u.k + '.h'))}</span></a>`;
    return `<article class="uc3-card">${m}<h3>${esc(t('uc.' + u.k + '.h'))}</h3><p class="uc3-p">${esc(t('uc.' + u.k + '.p'))}</p>${act}</article>`;
  });
  $('ucGrid').innerHTML = cards.slice(0, UC_FEAT).join('');
  $('ucMore').innerHTML = cards.slice(UC_FEAT).join('');
  $('ucMoreN').textContent = cards.length - UC_FEAT;
  $('ucMoreRow').hidden = cards.length <= UC_FEAT;
  paintArt($('ucGrid'));
  if (!$('ucMoreBody').hidden) paintArt($('ucMore'));
}
$('ucMoreBtn').addEventListener('click', () => {
  const open = $('ucMoreBody').hidden;
  $('ucMoreBody').hidden = !open;
  $('ucMoreBtn').setAttribute('aria-expanded', String(open));
  if (open) paintArt($('ucMore'));
});
/* ---------- wiring ---------- */
function applyText(){
  document.documentElement.lang = lang==='zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $('srchIn').placeholder = t('search.ph');
  $('langBtn').textContent = lang==='zh' ? 'English' : '中文';
  $('langBtn').setAttribute('aria-label', lang==='zh' ? 'Switch to English' : '切换到中文');
  $('langBtn').lang = lang==='zh' ? 'en' : 'zh-CN';
  document.title = t('title3');
}
function renderAll(){
  applyText(); $('heroTitle').innerHTML = esc(t('h3.title')).replace(t('h3.em'), '<em>$&</em>');
  renderUseCases(); renderDownloads(); renderBench(); renderTypes(false); renderStatus(); applyVisibility(); drawDrawer(); tickBuild(); tickPlay(); ucWatch();
  if (!$('srch').hidden) renderSearch();
  if (!$('vbox').hidden) vbFill();
}
function copy(text, btn, selEl){
  const fallback = () => { if (!selEl) return; const s = getSelection(), r = document.createRange(); r.selectNodeContents(selEl); s.removeAllRanges(); s.addRange(r); };
  const done = () => { if (['copyBtn','pipCopy','apCopy'].includes(btn.id)) window.jevAnalytics?.track('code_copy', {component: btn.id}); btn.textContent = t('copied'); clearTimeout(btn._t); btn._t = setTimeout(() => btn.textContent = t(btn.dataset.i18n), 1400); };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch(e) { fallback(); }
}
function setLang(l){ location.assign((l === 'zh' ? '/zh/' : '/') + location.hash); }

document.querySelectorAll('.bn').forEach(e => e.textContent = DATA.brand);
document.querySelectorAll('.hf').forEach(a => a.href = HF + DATA.author);
document.querySelectorAll('.dc').forEach(a => a.href = DATA.discussions);
document.querySelectorAll('[data-repo]').forEach(a => a.href = HF + a.dataset.repo);
$('menuBtn').innerHTML = ICON_MENU;

document.addEventListener('click', e => {
  const so = e.target.closest('[data-sopen]'); if (so){ closeSearch(); openDrawer(so.dataset.sopen); return; }
  const sh = e.target.closest('[data-shash]'); if (sh){ closeSearch(); document.querySelector(sh.dataset.shash)?.scrollIntoView({behavior: REDUCED ? 'auto' : 'smooth'}); return; }
  if (e.target.closest('#srch a')){ closeSearch(); return; }
  if (e.target.closest('.fchips a')) return;
  const dm = e.target.closest('[data-demo]'); if (dm){ openDemo(+dm.dataset.demo); return; }
  const o = e.target.closest('[data-open]'); if (o){ e.preventDefault(); openDrawer(o.dataset.open); return; }
  const dmm = e.target.closest('[data-demo-media]'); if (dmm){ openDemo(+dmm.dataset.demoMedia); return; }
  const ty = e.target.closest('[data-ty]'); if (ty){ tyActive = ty.dataset.ty; renderTypes(true); return; }
  if (e.target.closest('#mnav a')) setMenu(false);
});
$('langBtn').addEventListener('click', () => setLang(lang==='zh' ? 'en' : 'zh'));
$('menuBtn').addEventListener('click', () => setMenu($('mnav').hidden));
$('searchBtn').addEventListener('click', openSearch);
$('srchScrim').addEventListener('click', closeSearch);
$('srchIn').addEventListener('input', renderSearch);
$('srchIn').addEventListener('keydown', e => { if (e.key==='Enter'){ e.preventDefault(); $('srchList').querySelector('.on')?.click(); } });
$('drClose').addEventListener('click', closeDrawer);
$('scrim').addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => {
  if (e.key==='Escape'){ if (!$('vbox').hidden) closeDemo(); else if (!$('srch').hidden) closeSearch(); else if (openId) closeDrawer(); else if (!$('mnav').hidden){ setMenu(false); $('menuBtn').focus(); } return; }
  if (!$('vbox').hidden){ if ((e.key==='ArrowLeft' || e.key==='ArrowRight') && document.activeElement !== $('vbVideo')){ e.preventDefault(); stepDemo(e.key==='ArrowLeft' ? -1 : 1); } return; }
  if (e.key==='/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !openId){ e.preventDefault(); openSearch(); }
});
$('vbClose').addEventListener('click', closeDemo);
$('vbScrim').addEventListener('click', closeDemo);
$('vbPrev').addEventListener('click', () => stepDemo(-1));
$('vbNext').addEventListener('click', () => stepDemo(1));
document.addEventListener('visibilitychange', featArm);
$('ring')?.addEventListener('animationend', e => { if (e.animationName === 'ring') carGo(CAR.i + 1); });
$('carNext')?.addEventListener('click', () => { carStop(); carGo(CAR.i + 1); });
$('carPrev')?.addEventListener('click', () => { carStop(); carGo(CAR.i - 1); });
['pointerdown','wheel','focusin'].forEach(ev => $('carTrack').addEventListener(ev, carStop, {passive:true}));
$('tyTabs').addEventListener('keydown', e => {
  const tabs = [...$('tyTabs').querySelectorAll('[role=tab]')], i = tabs.indexOf(document.activeElement);
  const n = {ArrowRight:i+1, ArrowLeft:i-1, Home:0, End:tabs.length-1}[e.key];
  if (i < 0 || n === undefined) return;
  e.preventDefault();
  const b = tabs[(n + tabs.length) % tabs.length], val = b.dataset.ty;
  b.click(); $('tyTabs').querySelector(`[data-ty="${val}"]`)?.focus();
});
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (fam(h)) openDrawer(h); });
$('pipCopy').addEventListener('click', e => copy('pip install jev-style', e.currentTarget, $('pipCode')));
$('carTrack').addEventListener('scroll', () => { if (CAR.auto) return; const tr = $('carTrack'), w = tr.firstElementChild.offsetWidth + 24; CAR.i = Math.round(tr.scrollLeft / w); }, {passive:true});
$('tyTabs').addEventListener('animationend', e => {
  if (!e.target.classList.contains('cd')) return;
  tyActive = TY[(TY.indexOf(tyActive) + 1) % TY.length]; renderTypes(true);
});
$('try').addEventListener('focusin', () => { if (tyAuto){ tyAuto = false; tyArm(); } });
$('try').addEventListener('pointerdown', () => { if (tyAuto){ tyAuto = false; tyArm(); } });
const redraw = () => drawDrawer();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', redraw);
new MutationObserver(redraw).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
if ('ResizeObserver' in window){
  let rz, lastW = 0;
  new ResizeObserver(() => { if (document.body.clientWidth === lastW) return; lastW = document.body.clientWidth; clearTimeout(rz); rz = setTimeout(() => { drawDrawer(); if (innerWidth > 1023) setMenu(false); }, 100); }).observe(document.body);
}

visSeen = visKey();
renderAll();
if ('IntersectionObserver' in window){
  new IntersectionObserver(es => { CAR.vis = es[es.length-1].isIntersecting; carArm(); }, {threshold:.35}).observe($('benchmarks'));
  new IntersectionObserver(es => { TICK.vis = es[es.length-1].isIntersecting; }).observe($('tick'));
  new IntersectionObserver(es => { tyVis = es[es.length-1].isIntersecting; tyArm(); }, {threshold:.35}).observe($('try'));
}

if ('IntersectionObserver' in window && !REDUCED && $('tyAns').getBoundingClientRect().top > innerHeight){
  $('tyAns').classList.add('pre');
  const tio2 = new IntersectionObserver(es => { if (es[es.length-1].isIntersecting){ $('tyAns')?.classList.remove('pre'); tio2.disconnect(); } }, {rootMargin:'0px 0px -12% 0px'});
  tio2.observe($('tyPanel'));
}
liveStats();
apiHealth();
// Sections that moved to their own pages keep working from old links.
const h = location.hash.slice(1), OLD = {api:'try', resources:'start'};
const MOVED = {v3:'/models/0-8b-v3/', 'v3-2b':'/models/#v3-2b', v2:'/models/#v2', v1:'/models/#v1', 'cascade-9b':'/models/#cascade-9b', macjev:'/models/#macjev', models:'/models/', 'open-models':'/models/', switcher:'/models/', spotlight:'/models/', timeline:'/models/', downloads:'/models/', releases:'/updates/', developers:'/models/#run', 'api-code':'/api/', production:'/api/', 'build-guides':'/guides/', about:lang === 'zh' ? '/zh/about/' : '/about/', contact:lang === 'zh' ? '/zh/contact/' : '/contact/'};
if (MOVED[h]) location.replace(MOVED[h]); else if (fam(h)) openDrawer(h); else if (OLD[h]) requestAnimationFrame(() => $(OLD[h]).scrollIntoView());
})();
