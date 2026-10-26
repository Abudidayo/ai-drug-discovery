# Oracle Always Free deployment

One Ubuntu 24.04 ARM VM runs Caddy, PostgreSQL 18, the API, pipeline worker and
native Vina worker. Releases live in `/srv/half-life/releases/<tested-SHA>.<attempt>`;
prepared data, docking results, venv and deployment snapshots live in `shared/`.
Secrets live in `/etc/half-life/app.env`. Only TCP 22, 80 and 443 are public.

The source was inspected on 26 October 2026: Codespace
`half-life-v6rwgp49g76cpx6p`, PostgreSQL **18**, live source, Cortex jury,
`RESULTS_DIR=/workspaces/results`. Recheck these before exporting.

**Folder move (26 Oct 2026).** The app moved to `app/`, `core/` and `deploy/`. A VM
bootstrapped before then still starts `scripts/serve.sh` and serves `web/dist`;
`deploy.sh` links those old paths inside each release, so it keeps working. Rerun
step 3 when convenient to switch the VM to the new paths.

## 1. Identity setup

From the repository root:

```bash
deploy/oracle/setup.sh
```

The three stages cover Oracle signup/card verification, API key registration,
and DuckDNS sign-in/hostname registration. It saves the OCI `HALFLIFE` profile
in `~/.oci/config` and private DuckDNS settings in `.context/oracle/identity.env`.
The wizard does not create infrastructure or pause the source.

Use a dedicated free tenancy. Do not upgrade to a paid plan. The configuration
fixes compute at 2 OCPUs/12 GB and the boot volume at 100 GB/10 VPUs per GB.
It checks home region, existing A1 allocations, block storage and other buckets
before creating resources. It needs tenancy-wide inventory permissions and
fails closed if those queries fail. Capacity failure stops provisioning; there
is no paid shape or other-region fallback. Existing usage in other regions,
manual resource creation and paid-account subscription changes are outside
these guards. [Oracle's current allowances and reclamation policy](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).

## 2. Provision

Install Terraform >=1.9,<2, then run:

```bash
uv run deploy/oracle/provision.py
```

This generates separate admin and CI SSH keys, plans and applies Terraform,
assigns the reserved IP, and updates the registered DuckDNS hostname. It uses
the first home-region availability domain. To choose another domain after a
capacity error, set the exact name from the OCI console:

```bash
OCI_AVAILABILITY_DOMAIN=<home-region availability domain> uv run deploy/oracle/provision.py
```

Keep `deploy/oracle/terraform.tfstate*` and `.context/oracle/` backed up privately.
The wrapper recovers the tracked instance ID from Terraform state for later
allocation checks. When running Terraform directly, pass `existing_instance_ocid`
from the existing state after the first apply. An untracked A1 VM is rejected,
even if someone names it `half-life`. Disk and bucket destruction are protected.
Do not delete state or remove those protections to resolve a capacity failure.

## 3. Bootstrap the VM

Read the reserved IP and namespace from `.context/oracle/outputs.json`.
Verify the VM's SSH host fingerprint against its OCI console connection/console
history, then put the matching host key in `.context/oracle/known_hosts`.
`ssh-keyscan` can collect candidate keys; it does not authenticate them.
Use the admin key for bootstrap and the separate deploy key for CI.

```bash
ORACLE_HOST=<reserved public IPv4>
ORACLE_HOSTNAME=<registered half-life-suffix.duckdns.org>
OCI_BACKUP_NAMESPACE=<backup_namespace output>
```

```bash
ssh_options=(-i .context/oracle/admin_key -o UserKnownHostsFile=.context/oracle/known_hosts -o StrictHostKeyChecking=yes)
tar -czf .context/oracle/bootstrap.tgz deploy/oracle app/worker .devcontainer/docking-requirements.txt
scp "${ssh_options[@]}" .context/oracle/bootstrap.tgz .context/oracle/deploy_key.pub "ubuntu@$ORACLE_HOST:"
ssh "${ssh_options[@]}" "ubuntu@$ORACLE_HOST" \
  "mkdir -p half-life-bootstrap && tar -xzf bootstrap.tgz -C half-life-bootstrap && sudo bash half-life-bootstrap/deploy/oracle/bootstrap.sh 18 '$ORACLE_HOSTNAME' '$OCI_BACKUP_NAMESPACE'"
ssh "${ssh_options[@]}" "ubuntu@$ORACLE_HOST" \
  'sudo install -d -m 755 -o root -g root /home/halflife/.ssh && { printf "restrict "; cat deploy_key.pub; } | sudo tee /home/halflife/.ssh/authorized_keys >/dev/null && sudo chmod 644 /home/halflife/.ssh/authorized_keys'
```

Bootstrap installs PostgreSQL of the supplied source major, Node 22, pinned uv,
Python 3.11 and the existing docking requirements, building Vina 1.2.7 from its
sdist on native ARM. It installs systemd units, local-only database access,
SSH key authentication, host firewall rules and Caddy automatic HTTPS. The VM
instance principal has access to objects in only the private backup bucket.
No Oracle API private key is copied to the VM or GitHub.

## 4. Backed-up migration

First merge the deployment changes and require green CI on `main`. Install
PostgreSQL **18 client tools** in the source Codespace before starting. Upload
`deploy/oracle/migrate.py` and `deploy/oracle/postgres_env.py` there if the source checkout predates that merge.
Check free disk space on both hosts for the prepared data, archives, database
snapshot and two releases before pausing writes.

In the source repository:

```bash
uv run --no-sync --env-file .env python deploy/oracle/migrate.py export /workspaces/half-life-migration
```

Export stops the API and both workers, makes the source database read-only,
rejects remaining client connections, and creates a custom-format public-schema
dump, prepared-data archive, docking-result archive, prepared structures,
Cortex-only environment file and checksum/content manifest. It restarts the
source and removes read-only mode on an export error. On success it deliberately
leaves the source stopped. Preserve a private copy of the complete bundle away
from both hosts before restoring. The bundle contains model-service credentials.

Transfer it over authenticated SSH, using `gh codespace cp` to download from the
source and `scp` to upload to `/srv/half-life/incoming/migration` as `halflife`.
Do not print `cortex.env` or database credentials in logs.

On Oracle, extract the exact tested `main` archive to a temporary working folder,
run `uv sync --all-packages --frozen --python 3.11` there as `halflife`, then:

```bash
uv run --no-sync --env-file /etc/half-life/app.env python deploy/oracle/migrate.py import /srv/half-life/incoming/migration
```

Import checks every archive hash, the PostgreSQL major and an empty destination
database, restores files and the public schema, then compares every table's row
count and SHA256 of its canonical rows. It refuses an existing database. For
rehearsals use a separate disposable database and directories, never the source.
The source's hosting-specific Timescale extension schemas are not app data and
are not copied; all application tables are in `public`.

Append `incoming/migration/cortex.env` to `/etc/half-life/app.env` as root. Keep
mode `640`, owner `root:halflife`. JSON values are quoted for both dotenv and
systemd parsing. Do not replace the generated local `DATABASE_URL`.

Anonymous session ownership rows survive. Browsers will need their existing
HttpOnly `oxhack_session` cookie copied privately to the new hostname to see
previous history; cookies do not follow a change of domain automatically.

## 5. First release and CI cutover

Using a green tested `main` SHA, create `git archive --format=tar.gz`, calculate
its SHA256, and upload the archive and `deploy/oracle/deploy.sh` to `incoming/`.
Run the deployment as `halflife`:

```bash
bash /srv/half-life/incoming/deploy.sh <tested 40-character main SHA> /srv/half-life/incoming/release.tgz <archive SHA256>
```

The script builds first. It then blocks public writes, stops services, snapshots
the database, requires a verified off-host upload, migrates, atomically switches
`current`, restarts and checks local health, public HTTPS and the public release
SHA. Failure restores the database and previous release; restore failure leaves
maintenance enabled and services stopped. The previous release and snapshot
remain available. Retain the original source bundle until the cutover is accepted.

Complete live QA below, then register credentials and enable Oracle deployment:

```bash
deploy/oracle/configure-ci.sh "$ORACLE_HOST" "https://$ORACLE_HOSTNAME" \
  .context/oracle/deploy_key .context/oracle/known_hosts --enable
```

This sets secrets `ORACLE_SSH_KEY`, `ORACLE_KNOWN_HOSTS` and variables
`ORACLE_HOST`, `DEMO_URL`, `ORACLE_DEPLOY_ENABLED`. It checks that public health
is live and `/release.json` equals current GitHub `main` before enabling. It
also verifies SSH access, the runtime environment file and the enabled app service.
Without `--enable`, only SSH settings are registered. Use an owner GitHub login
with repository Actions settings access; the default integration token may lack
permission. Secrets are sent through stdin, not command arguments.

Until `ORACLE_DEPLOY_ENABLED=true`, CI runs its checks and reports that deployment
is waiting for setup. It does not change the existing Codespace. Once enabled,
every push to `main` deploys the exact commit whose applicable checks passed,
including documentation-only commits. Pull requests never deploy. Actions ->
Deploy -> Run workflow on `main` reruns checks and deployment manually. Failed
or cancelled checks prevent deployment; deployments are serialized and never
interrupted by a newer push. It never falls back to Codespaces. Update the README's
live demo link to the verified hostname, run one real Actions deployment, then
stop the old Codespace and remove these obsolete settings:

- Secret `CODESPACE_DEPLOY_TOKEN`
- Variable `DEMO_CODESPACE`

Keep the old database read-only. Once Oracle accepts new writes, rollback to the
old host requires transferring those new writes back; resuming the stale source
would lose them. Do not delete the original database or Codespace during cutover.

## 6. Live validation and recovery

Record results in `.context/oracle/validation.md` before retiring Codespaces:

- Public HTTPS loads in a signed-out browser; API/database ports are inaccessible
  publicly; cookies are Secure/HttpOnly. `/release.json` equals the green main SHA.
- Explore a new disease, inspect the network, run the real three-model Cortex
  jury, request an uncached Vina docking job, and download its pose files.
- Open migrated experiments with their session cookie and download old docking
  files; compare them with the source manifest. Preserve existing failed-control
  results rather than changing thresholds.
- Kill a service child process and confirm systemd restarts the complete launcher.
  Reboot the VM, reconnect, and check app, Caddy, PostgreSQL, timer and public health.
- Test a failing build and migration on a disposable rehearsal database/release;
  verify database content, previous release, and maintenance behavior afterward.
- `sudo systemctl start half-life-backup.service`; inspect the journal and private
  bucket object. Start the timer with `sudo systemctl start half-life-backup.timer`.
- Download a backup privately with OCI CLI or SDK. Check its `sha256` object
  metadata, restore to a separate empty database with `pg_restore --dbname=<disposable-db>
  --no-owner --no-acl --clean --if-exists --exit-on-error --single-transaction`, and compare content against the
  snapshot. Use the migration `verify` command for a source-snapshot rehearsal.

Daily backups retain up to seven dumps within a **5 GB total bucket cap**. The
uploader paginates all objects, refuses unexpected objects, preserves the newest
existing backup on upload failure, and verifies uploaded length/hash metadata.
If the newest backup plus a new one cannot fit, it fails visibly instead of
exceeding the cap or deleting the last copy. Monitor backup service failures and
disk usage. Local pre-deployment snapshots/releases are intentionally retained;
remove older ones after reviewing recovery needs. Daily DB backups do not replace
the separate prepared-data and docking-file migration backup.

Automatic recovery covers crashes and reboots while the VM exists. Oracle can
reclaim idle free instances; rebuilding then requires capacity, the retained
Terraform state, data bundle and database backup. Permanent uptime is not promised.

## Local checks

```bash
terraform -chdir=deploy/oracle init -backend=false
terraform -chdir=deploy/oracle validate
terraform -chdir=deploy/oracle test
uv run --no-sync pytest deploy/tests deploy/db/tests -q
```

Terraform tests use a mocked provider. Script tests exercise build, backup,
migration, public health and restore failures without touching a running app.
