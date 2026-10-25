#!/usr/bin/env bash
# Deploy the demo codespace from a branch (main by default): check out exactly what
# GitHub has, migrate the database, build the web app, then restart the API, the
# pipeline and docking workers (scripts/serve.sh, log /workspaces/serve.log) and the
# built web app on port 5173 (log /workspaces/web.log). Safe after a codespace restart.
#
#   scripts/redeploy.sh            # in the codespace
#   scripts/redeploy.sh some-branch
#
# The Deploy workflow (.github/workflows/deploy.yml) runs it over `gh codespace ssh`
# on every push to main. The codespace is a deploy target, not a place to edit: local
# changes to tracked files are overwritten.
set -euo pipefail
cd "$(dirname "$0")/.."
branch=${1:-main}

git fetch -q origin "$branch"
git checkout -q --force -B "$branch" "origin/$branch"
git log --oneline -1

uv sync --all-packages --quiet
uv run --no-sync db/migrate.py 2>&1 | grep -v "no-op" || true
(cd web && npm ci --silent && npm run build --silent > /workspaces/web-build.log 2>&1)

pkill -f "[s]cripts/serve.sh" || true
pkill -f "[u]vicorn oxhack_api" || true
pkill -f "[o]xhack_api.worker" || true
pkill -f "[o]xhack_worker.queue" || true
pkill -f "[v]ite preview" || true
sleep 1

# Detached from this shell, so an ssh session that runs this script can end.
setsid nohup scripts/serve.sh > /workspaces/serve.log 2>&1 < /dev/null &
cd web
setsid nohup npx vite preview --host 0.0.0.0 --port 5173 --strictPort \
  > /workspaces/web.log 2>&1 < /dev/null &
cd ..

for _ in $(seq 1 60); do curl -sf localhost:8000/api/health > /dev/null && break; sleep 2; done
for _ in $(seq 1 30); do curl -sf localhost:5173/api/health > /dev/null && break; sleep 1; done
curl -sf localhost:5173/api/health
echo
