#!/usr/bin/env bash
# Builds the website (landing page from src/landing.html, editor from src/sndt.html into /app/) and deploys it to production (sndt.cc).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/build.py src/sndt.html site/app/index.html
cp src/landing.html site/index.html && mkdir -p site/img && cp src/landing-img/* site/img/
mkdir -p site/handbook && cp src/handbook.html site/handbook/index.html
python3 scripts/changelog.py site/changelog/index.html
cd site
npx --yes vercel@latest deploy --prod --yes --scope vvpaulvvs-projects
