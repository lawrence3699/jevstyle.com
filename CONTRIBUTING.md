# Contributing

1. Change sources, not generated pages: `scripts/prerender_home.py`, `scripts/site_chrome.py`, `scripts/build_site.py`, `scripts/build_discovery.py`, `assets/project-facts.json`, `assets/updates.json` and the static pages under `guides/`, `use-cases/`, `models/`, `benchmarks/` and `api/`.
2. Run `bash scripts/check_all.sh` and commit the regenerated pages together with the source change.
3. Keep facts in one place. Hosted API limits, the current package version, Decision Index scores and the service status come from `assets/project-facts.json`; release history comes from `assets/updates.json`.
4. Do not commit evidence packs, videos or large JSON. Put them in GitHub release assets or a Hugging Face dataset and link to them.
5. Pages that are not meant for search engines (console, sign-in, admin, fixtures, 404) must carry `<meta name="robots" content="noindex">`; `scripts/check_site.py` enforces it.
