#!/usr/bin/env bash
# Builds the website from src/sndt.html and deploys it to production (sndt.cc).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/build.py src/sndt.html site/index.html
mkdir -p site/handbook && cp src/handbook.html site/handbook/index.html
cd site
npx --yes vercel@latest deploy --prod --yes --scope vvpaulvvs-projects
