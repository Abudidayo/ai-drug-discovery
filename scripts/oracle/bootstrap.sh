#!/usr/bin/env bash
# Run once as root on the dedicated Ubuntu 24.04 ARM VM, from an extracted repo.
# Usage: sudo bash scripts/oracle/bootstrap.sh <source-pg-major> <hostname> <namespace>
set -euo pipefail
umask 077
major=${1:?source PostgreSQL major required}
hostname=${2:?DuckDNS hostname required}
namespace=${3:?OCI object storage namespace required}
[[ $major =~ ^(16|17|18)$ ]]
[[ $hostname =~ ^half-life-[a-z0-9-]+\.duckdns\.org$ ]]
[[ $namespace =~ ^[a-zA-Z0-9_-]+$ ]]
[[ $(uname -m) == aarch64 ]]
. /etc/os-release
[[ $ID == ubuntu && $VERSION_ID == 24.04 ]]
repo=$(cd "$(dirname "$0")/../.." && pwd)
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl gnupg build-essential \
  libboost-all-dev swig pkg-config rsync iptables-persistent python3-venv debian-keyring debian-archive-keyring
install -d -m 755 /etc/apt/keyrings
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /etc/apt/keyrings/postgresql.asc
printf 'deb [signed-by=/etc/apt/keyrings/postgresql.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main\n' > /etc/apt/sources.list.d/pgdg.list
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key -o /etc/apt/keyrings/nodesource.asc
printf 'deb [signed-by=/etc/apt/keyrings/nodesource.asc] https://deb.nodesource.com/node_22.x nodistro main\n' > /etc/apt/sources.list.d/nodesource.list
curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/caddy.gpg
printf 'deb [signed-by=/etc/apt/keyrings/caddy.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main\n' > /etc/apt/sources.list.d/caddy.list
chmod 644 /etc/apt/keyrings/postgresql.asc /etc/apt/keyrings/nodesource.asc /etc/apt/keyrings/caddy.gpg \
  /etc/apt/sources.list.d/pgdg.list /etc/apt/sources.list.d/nodesource.list /etc/apt/sources.list.d/caddy.list
apt-get update
apt-get install -y --no-install-recommends "postgresql-$major" "postgresql-client-$major" nodejs caddy
# Pin the installer and uv version; the app uses its frozen workspace lock.
curl -LsSf https://astral.sh/uv/0.13.5/install.sh -o /tmp/half-life-uv-install.sh
UV_INSTALL_DIR=/usr/local/bin UV_NO_MODIFY_PATH=1 sh /tmp/half-life-uv-install.sh
chmod 755 /usr/local/bin/uv /usr/local/bin/uvx
id halflife >/dev/null 2>&1 || useradd --create-home --shell /bin/bash halflife
install -d -o halflife -g halflife -m 755 /srv/half-life /srv/half-life/releases
install -d -o halflife -g halflife -m 700 /srv/half-life/incoming /srv/half-life/shared \
  /srv/half-life/shared/data /srv/half-life/shared/backups
# Caddy only needs directory traversal to read the maintenance marker.
chmod 711 /srv/half-life/shared
install -d -o root -g halflife -m 750 /etc/half-life
install -d -o root -g root -m 755 /usr/local/lib/half-life
install -m 644 "$repo/scripts/oracle/backup.py" "$repo/scripts/oracle/postgres_env.py" /usr/local/lib/half-life/
export UV_PYTHON_INSTALL_DIR=/opt/half-life-python
uv python install 3.11
python=$(uv python find 3.11)
uv venv --allow-existing --python "$python" /opt/half-life-tools
uv pip install --python /opt/half-life-tools/bin/python 'oci==2.160.0' 'psycopg[binary]==3.2.13'
chmod -R a+rX /opt/half-life-python /opt/half-life-tools
sudo -u halflife uv venv --allow-existing --python "$python" /srv/half-life/shared/docking-venv
# Vina's ARM sdist requires Boost and SWIG. Keep every existing toolchain pin.
install -o halflife -g halflife -m 600 "$repo/.devcontainer/docking-requirements.txt" /srv/half-life/shared/docking-requirements.txt
sudo -u halflife uv pip install --python /srv/half-life/shared/docking-venv/bin/python \
  --no-binary vina -r /srv/half-life/shared/docking-requirements.txt
PYTHONPATH="$repo/worker" /srv/half-life/shared/docking-venv/bin/python -m oxhack_worker.dock --toolchain
# Local-only DB, including after reboot. Do not expose 5432 through either firewall.
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER SYSTEM SET listen_addresses = 'localhost';"
systemctl restart postgresql
if [[ ! -e /etc/half-life/app.env ]]; then
  password=$(openssl rand -hex 32)
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
CREATE ROLE halflife LOGIN PASSWORD '$password';
CREATE DATABASE halflife OWNER halflife;
SQL
  cat > /etc/half-life/app.env <<ENV
DATABASE_URL=postgresql://halflife:$password@127.0.0.1:5432/halflife
OXHACK_REPO=postgres
OXHACK_SOURCE=live
OXHACK_JURY=cortex
OXHACK_DOCKING=vina
OXHACK_DATA_DIR=/srv/half-life/shared/data
OXHACK_STRUCTURES_DIR=/srv/half-life/shared/structures
RESULTS_DIR=/srv/half-life/shared/data/docking
DOCKING_VENV=/srv/half-life/shared/docking-venv
OXHACK_SESSION_COOKIE_SECURE=true
HOST=127.0.0.1
PORT=8000
PUBLIC_URL=https://$hostname
OCI_BACKUP_NAMESPACE=$namespace
OCI_BACKUP_BUCKET=half-life-backups
UV_PYTHON_INSTALL_DIR=/opt/half-life-python
UV_CACHE_DIR=/srv/half-life/shared/uv-cache
UV_OFFLINE=true
ENV
  chown root:halflife /etc/half-life/app.env
  chmod 640 /etc/half-life/app.env
fi
cat > /etc/systemd/system/half-life.service <<'UNIT'
[Unit]
Description=HalfLife API, pipeline and docking workers
After=network-online.target postgresql.service
Wants=network-online.target
Requires=postgresql.service
StartLimitIntervalSec=0
[Service]
User=halflife
Group=halflife
WorkingDirectory=/srv/half-life/current
EnvironmentFile=/etc/half-life/app.env
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/bin/bash scripts/serve.sh
Restart=always
RestartSec=5
TimeoutStopSec=60
KillMode=control-group
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
UMask=0027
[Install]
WantedBy=multi-user.target
UNIT
# Service launches use the frozen release venv with offline resolution.
cat > /etc/systemd/system/half-life-backup.service <<'UNIT'
[Unit]
Description=HalfLife private database backup
After=postgresql.service network-online.target
[Service]
Type=oneshot
User=halflife
EnvironmentFile=/etc/half-life/app.env
ExecStart=/usr/bin/flock -n /srv/half-life/deploy.lock /opt/half-life-tools/bin/python /usr/local/lib/half-life/backup.py
UMask=0077
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/srv/half-life/shared/backups /srv/half-life/deploy.lock
PrivateTmp=true
UNIT
cat > /etc/systemd/system/half-life-backup.timer <<'UNIT'
[Unit]
Description=Daily HalfLife database backup
[Timer]
OnCalendar=*-*-* 03:00:00 UTC
RandomizedDelaySec=15m
Persistent=true
[Install]
WantedBy=timers.target
UNIT
cat > /etc/sudoers.d/half-life <<'SUDO'
halflife ALL=(root) NOPASSWD: /usr/bin/systemctl start half-life.service, /usr/bin/systemctl stop half-life.service, /usr/bin/systemctl restart half-life.service, /usr/bin/systemctl is-active --quiet half-life.service
SUDO
chmod 440 /etc/sudoers.d/half-life
visudo -cf /etc/sudoers.d/half-life
cat > /etc/caddy/Caddyfile <<CADDY
$hostname {
    encode zstd gzip
    @maintenance {
        not path /api/health /release.json
        file {
            root /srv/half-life/shared
            try_files maintenance
        }
    }
    handle @maintenance {
        header Retry-After 120
        respond "Deployment in progress. Please try again shortly." 503
    }
    handle /api/* {
        reverse_proxy 127.0.0.1:8000
    }
    handle /release.json {
        root * /srv/half-life/current/web/dist
        header Cache-Control "no-store"
        file_server
    }
    handle {
        root * /srv/half-life/current/web/dist
        try_files {path} /index.html
        file_server
    }
}
CADDY
chown root:caddy /etc/caddy/Caddyfile
chmod 640 /etc/caddy/Caddyfile
chmod 644 /etc/systemd/system/half-life.service /etc/systemd/system/half-life-backup.service /etc/systemd/system/half-life-backup.timer
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
# Preserve OCI's egress rules, including metadata protections, while enforcing
# one persisted inbound policy. UFW conflicts with iptables-persistent on Ubuntu.
for firewall in iptables ip6tables; do
  "$firewall" -N HALF-LIFE-IN 2>/dev/null || true
  "$firewall" -F HALF-LIFE-IN
  "$firewall" -A HALF-LIFE-IN -i lo -j ACCEPT
  "$firewall" -A HALF-LIFE-IN -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
  if [[ $firewall == iptables ]]; then
    "$firewall" -A HALF-LIFE-IN -p icmp --icmp-type 3 -j ACCEPT
  else
    "$firewall" -A HALF-LIFE-IN -p ipv6-icmp -j ACCEPT
  fi
  for port in 22 80 443; do
    "$firewall" -A HALF-LIFE-IN -p tcp --dport "$port" -j ACCEPT
  done
  "$firewall" -A HALF-LIFE-IN -j REJECT
  "$firewall" -C INPUT -j HALF-LIFE-IN 2>/dev/null || "$firewall" -I INPUT 1 -j HALF-LIFE-IN
done
netfilter-persistent save
cat > /etc/ssh/sshd_config.d/half-life.conf <<'SSH'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
SSH
sshd -t
systemctl reload ssh
systemctl daemon-reload
systemctl enable half-life.service half-life-backup.timer caddy
systemctl restart caddy
# Enable daily backups after migration, when the database has real data.
echo 'Bootstrap complete. Copy source data and Cortex secrets before deploying. See infra/oracle/README.md.'
