#!/usr/bin/env bash
# Register credentials after bootstrap; --enable switches targets after live QA.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ $# -lt 4 || $# -gt 5 || ( $# -eq 5 && ${5:-} != --enable ) ]]; then
  echo 'Usage: configure-ci.sh <host> <https-url> <private-key> <known-hosts> [--enable]' >&2
  exit 2
fi
host=${1:?reserved public IPv4 required}
url=${2:?https DuckDNS URL required}
key=${3:?deployment private key path required}
known_hosts=${4:?verified known_hosts file required}
[[ $host =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
[[ $url =~ ^https://half-life-[a-z0-9-]+\.duckdns\.org/?$ ]]
[[ -s $key && -s $known_hosts ]]
ssh-keygen -F "$host" -f "$known_hosts" > /dev/null
ssh -i "$key" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes \
  -o UserKnownHostsFile="$known_hosts" -o ConnectTimeout=15 "halflife@$host" \
  'test -x /usr/local/bin/uv && test -r /etc/half-life/app.env && systemctl is-enabled --quiet half-life.service' < /dev/null
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
gh secret set ORACLE_SSH_KEY --repo "$repo" < "$key"
gh secret set ORACLE_KNOWN_HOSTS --repo "$repo" < "$known_hosts"
gh variable set ORACLE_HOST --repo "$repo" --body "$host"
if [[ ${5:-} == --enable ]]; then
  sha=$(gh api "repos/$repo/commits/main" --jq .sha)
  curl --connect-timeout 5 --max-time 15 -fsS "${url%/}/api/health" | \
    python3 -c 'import json,sys; h=json.load(sys.stdin); assert h["status"]=="ok" and h["source"]=="live"'
  curl --connect-timeout 5 --max-time 15 -fsS "${url%/}/release.json" | \
    python3 -c 'import json,sys; assert json.load(sys.stdin)["sha"]==sys.argv[1]' "$sha"
  gh variable set DEMO_URL --repo "$repo" --body "${url%/}/"
  gh variable set ORACLE_DEPLOY_ENABLED --repo "$repo" --body true
  echo "Oracle deployment enabled at $url. Retire Codespaces only after recovery and live QA checks."
else
  echo 'Oracle SSH credentials configured. Automatic deployment remains disabled until --enable.'
fi
