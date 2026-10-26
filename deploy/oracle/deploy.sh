#!/usr/bin/env bash
# Run as halflife. CI uploads a git archive of the tested SHA, never a branch tip.
set -Eeuo pipefail
umask 077
root=${HALFLIFE_ROOT:-/srv/half-life}
env_file=${HALFLIFE_ENV:-/etc/half-life/app.env}
if [[ ${1:-} != --loaded ]]; then
  exec uv run --no-project --env-file "$env_file" /opt/half-life-tools/bin/python /usr/local/lib/half-life/postgres_env.py bash "$0" --loaded "$@"
fi
shift
sha=${1:?tested commit SHA required}
archive=${2:?release archive required}
digest=${3:?SHA256 of archive required}
[[ $sha =~ ^[0-9a-f]{40}$ && $digest =~ ^[0-9a-f]{64}$ ]]
[[ $(sha256sum "$archive" | cut -d ' ' -f 1) == "$digest" ]]
: "${DATABASE_URL:?}" "${PUBLIC_URL:?}"
[[ $PUBLIC_URL =~ ^https://half-life-[a-z0-9-]+\.duckdns\.org/?$ ]]
export PATH=/usr/local/bin:/usr/bin:/bin
export UV_OFFLINE=false
exec 9>"$root/deploy.lock"
flock -n 9 || { echo 'Another deployment or backup is running.' >&2; exit 1; }
umask 022
mkdir -p "$root/releases" "$root/shared/backups"
release=$(mktemp -d "$root/releases/$sha.XXXXXXXX")
chmod 755 "$release"
# Only CI-generated git archives belong here. The deploy user has no root shell.
tar -xzf "$archive" -C "$release"
cd "$release"
uv sync --all-packages --frozen --python 3.11 --quiet
(cd app/web && npm ci --silent && npm run build)
printf '{"sha":"%s"}\n' "$sha" > app/web/dist/release.json
PYTHONPATH=worker "$DOCKING_VENV/bin/python" -m oxhack_worker.dock --toolchain
# Validate credentials, paths and DB connectivity before interrupting readers.
uv run --no-sync python -c 'from oxhack_api.settings import Settings, SnowflakeSettings; import psycopg; s=Settings(); SnowflakeSettings(); c=psycopg.connect(s.database_url); c.execute("select 1")'
[[ -d $OXHACK_DATA_DIR && -f $OXHACK_STRUCTURES_DIR/settings.json ]]
previous=$(readlink -f "$root/current" || true)
snapshot=$(mktemp "$root/shared/backups/pre-$sha.XXXXXXXX")
umask 077
paused=false
restore_needed=false
switched=false
wait_local_health() {
  for _ in $(seq 1 60); do
    if curl --connect-timeout 2 --max-time 5 -fsS http://127.0.0.1:8000/api/health | \
      python3 -c 'import json,sys; h=json.load(sys.stdin); assert h["status"]=="ok" and h["source"]=="live"'; then
      return 0
    fi
    sleep 2
  done
  return 1
}
rollback() {
  code=$?
  trap - EXIT INT TERM
  set +e
  if [[ $paused == true ]]; then
    sudo systemctl stop half-life.service
    restored=true
    if [[ $restore_needed == true ]]; then
      # All application tables live in public. No readers/writers are admitted
      # between this snapshot and the completion of public health verification.
      psql -X -v ON_ERROR_STOP=1 -c 'DROP SCHEMA public CASCADE;' && \
        pg_restore --no-owner --no-acl --exit-on-error --dbname="$PGDATABASE" "$snapshot" || restored=false
    fi
    if [[ $restored == true && -n $previous ]]; then
      ln -sfn "$previous" "$root/current.rollback"
      python3 -c 'import os,sys; os.replace(sys.argv[1],sys.argv[2])' "$root/current.rollback" "$root/current"
      sudo systemctl start half-life.service && wait_local_health && rm -f "$root/shared/maintenance"
    elif [[ $restore_needed == false && $switched == false ]]; then
      sudo systemctl start half-life.service && wait_local_health && rm -f "$root/shared/maintenance"
    fi
    if [[ $restored == true && -z $previous && $switched == true ]]; then
      rm -f "$root/current"
    fi
    # On restore failure, leave maintenance enabled and the backup intact.
  fi
  echo "Deployment failed (status $code). Snapshot: $snapshot. Inspect journalctl -u half-life." >&2
  exit "$code"
}
trap rollback EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# Caddy sees the marker before the API stops, blocking all user writes.
touch "$root/shared/maintenance"
paused=true
sudo systemctl stop half-life.service
pg_dump --schema=public --format=custom --no-owner --no-acl --file="$snapshot"
pg_restore --list "$snapshot" > /dev/null
# A durable off-host copy must succeed before changing schema.
"${HALFLIFE_BACKUP_PYTHON:-/opt/half-life-tools/bin/python}" /usr/local/lib/half-life/backup.py --upload "$snapshot"
restore_needed=true
uv run --no-sync deploy/db/migrate.py
ln -sfn "$release" "$root/current.next"
python3 -c 'import os,sys; os.replace(sys.argv[1],sys.argv[2])' "$root/current.next" "$root/current"
switched=true
sudo systemctl start half-life.service
wait_local_health
curl --connect-timeout 5 --max-time 15 -fsS "${PUBLIC_URL%/}/api/health" | \
  python3 -c 'import json,sys; assert json.load(sys.stdin)["status"]=="ok"'
curl --connect-timeout 5 --max-time 15 -fsS "${PUBLIC_URL%/}/release.json" | \
  python3 -c 'import json,sys; assert json.load(sys.stdin)["sha"]==sys.argv[1]' "$sha"
sudo systemctl is-active --quiet half-life.service
rm "$root/shared/maintenance"
trap - EXIT INT TERM
# Keep the previous release and its snapshot. Older releases are explicitly
# removed by an operator after their retention needs have been reviewed.
printf 'Deployed %s; previous release: %s\n' "$sha" "${previous:-none}"
