# jevstyle.com

Source of the JevStyle website, published with GitHub Pages: every push to `main` deploys the repository root as-is.

## Build

`index.html` is both the homepage source and a build product. Copy lives in `scripts/prerender_home.py` (translations), `scripts/site_chrome.py` (header and footer), `scripts/build_site.py` (catalogue and company pages) and `assets/project-facts.json` (shared facts), so edit those rather than the generated pages. The homepage script and stylesheet are `assets/home.js` and `assets/home.css`.

After changing data or copy, run the same checks as CI:

```sh
bash scripts/check_all.sh
```

That runs, in order, `prerender_home.py`, `build_site.py`, `build_routing_experiment.py`, `build_discovery.py`, `check_site.py`, `check_browser_agent.py` and the remaining script tests. The generated pages must then be committed; the pull-request check fails when they differ from the sources.

## Evidence packs and large files

Demo videos, recorded browser-agent runs and other evidence packs do not go into git. Publish them as GitHub release assets or in a Hugging Face dataset and reference them by URL; `tools/browser-agent/runs.json` is the one retained exception and is loaded on request.

## License

The code in this repository is MIT (see `LICENSE`). `NOTICE` lists what the license does not cover, including the brand, the model weights, the videos and the page copy. Fonts in `assets/fonts/` are under the SIL Open Font License.
