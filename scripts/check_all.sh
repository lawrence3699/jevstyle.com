#!/usr/bin/env bash
# The one build-and-check sequence used by both GitHub workflows and by hand.
# Usage: bash scripts/check_all.sh   (from any directory)
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/prerender_home.py
python3 scripts/build_site.py
python3 scripts/build_routing_experiment.py
python3 scripts/build_discovery.py
python3 scripts/check_site.py
python3 scripts/check_browser_agent.py
node --check tools/browser-agent/replay.js
python3 scripts/test_geo_snapshot.py
python3 scripts/test_append_geo_run.py
python3 scripts/test_search_collector.py
python3 scripts/test_discovery_audit.py
node scripts/check_search_performance.cjs
node scripts/check_search_performance_auto.cjs
node scripts/check_search_monitor.cjs
node scripts/check_admin_gate.cjs
node scripts/check_service_status.cjs
node --check admin/discovery.js
node --check admin/search-performance.js
node --check admin/search-monitor.js
node --check admin/experiments.js
