"""Exercise production deployment failure boundaries and bounded backup retention."""

import importlib.util
import os
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path
from types import SimpleNamespace

import pytest

ORACLE = Path(__file__).resolve().parents[1] / "oracle"
SHA = "a" * 40


def load_backup():
    if str(ORACLE) not in sys.path:
        sys.path.insert(0, str(ORACLE))
    spec = importlib.util.spec_from_file_location("oracle_backup", ORACLE / "backup.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize(
    "failure", ["build", "backup", "migration", "public", "restore", "none"]
)
def test_deployment_preserves_recovery_boundary(tmp_path, failure):
    root = tmp_path / "app"
    (root / "releases/previous").mkdir(parents=True)
    (root / "shared/backups").mkdir(parents=True)
    (root / "shared/structures").mkdir()
    (root / "shared/structures/settings.json").write_text("{}")
    (root / "shared/data").mkdir()
    (root / "current").symlink_to(root / "releases/previous")
    source = tmp_path / "source"
    (source / "web/dist").mkdir(parents=True)
    archive = tmp_path / "release.tgz"
    with tarfile.open(archive, "w:gz") as output:
        output.add(source / "web", arcname="web")
    import hashlib

    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    commands = tmp_path / "bin"
    commands.mkdir()
    log = tmp_path / "commands.log"
    # The real script fixes PATH for production. Rewrite only PATH in this test
    # copy so commands can be intercepted, preserving all deployment decisions.
    script = tmp_path / "deploy.sh"
    script.write_text(
        (ORACLE / "deploy.sh")
        .read_text()
        .replace(
            "export PATH=/usr/local/bin:/usr/bin:/bin", 'export PATH="$TEST_BIN:$PATH"'
        )
    )
    stub = """#!/bin/bash
printf '%s %s\\n' "${0##*/}" "$*" >> "$COMMAND_LOG"
case "${0##*/}" in
  npm) [[ "$*" != *build* || "$FAILURE" != build ]] || exit 43 ;;
  uv)
    if [[ "$*" == *db/migrate.py* && ( "$FAILURE" == migration || "$FAILURE" == restore ) ]]; then exit 42; fi ;;
  backup-python) [[ "$FAILURE" != backup ]] || exit 44 ;;
  pg_dump) for arg in "$@"; do [[ "$arg" != --file=* ]] || touch "${arg#--file=}"; done ;;
  pg_restore) [[ "$*" == --list* || "$FAILURE" != restore ]] || exit 45 ;;
  sudo) ;;
  curl)
    if [[ "$*" == *release.json* ]]; then
      [[ "$FAILURE" != public ]] || exit 22
      printf '{"sha":"%s"}' "$TEST_SHA"
    else printf '{"status":"ok","source":"live"}'; fi ;;
  flock) ;;
esac
exit 0
"""
    for command in (
        "uv",
        "npm",
        "backup-python",
        "pg_dump",
        "pg_restore",
        "psql",
        "sudo",
        "curl",
        "flock",
        "dock-python",
    ):
        path = commands / command
        path.write_text(stub)
        path.chmod(0o755)
    docking = tmp_path / "docking/bin"
    docking.mkdir(parents=True)
    (docking / "python").symlink_to(commands / "dock-python")
    # sha256sum is absent on stock macOS; use the real Python hash as a portable double.
    if not shutil.which("sha256sum"):
        path = commands / "sha256sum"
        path.write_text(f'#!/bin/bash\nprintf "%s  %s\\n" "{digest}" "$1"\n')
        path.chmod(0o755)
    result = subprocess.run(
        ["bash", str(script), "--loaded", SHA, str(archive), digest],
        env={
            **os.environ,
            "TEST_BIN": str(commands),
            "COMMAND_LOG": str(log),
            "FAILURE": failure,
            "TEST_SHA": SHA,
            "HALFLIFE_ROOT": str(root),
            "HALFLIFE_BACKUP_PYTHON": str(commands / "backup-python"),
            "DATABASE_URL": "postgresql://unused",
            "PGDATABASE": "unused",
            "PUBLIC_URL": "https://half-life-test.duckdns.org",
            "DOCKING_VENV": str(docking.parent),
            "OXHACK_DATA_DIR": str(root / "shared/data"),
            "OXHACK_STRUCTURES_DIR": str(root / "shared/structures"),
        },
        check=False,
        capture_output=True,
        text=True,
        timeout=15,
    )
    calls = log.read_text()
    if failure == "none":
        assert result.returncode == 0, result.stderr
        assert (root / "current").resolve().name.startswith(SHA + ".")
        assert not (root / "shared/maintenance").exists()
    else:
        assert result.returncode != 0
        if failure != "restore":
            assert (root / "current").resolve().name == "previous"
            assert not (root / "shared/maintenance").exists()
        else:
            assert (root / "shared/maintenance").exists()
        if failure == "build":
            assert "systemctl stop" not in calls
            assert "pg_dump" not in calls
        if failure == "backup":
            assert "db/migrate.py" not in calls
            assert "DROP SCHEMA" not in calls
        if failure in ("migration", "public", "restore"):
            assert "DROP SCHEMA public CASCADE" in calls
            assert "pg_restore --no-owner --no-acl --exit-on-error" in calls
    if failure != "build":
        assert (
            calls.index("systemctl stop")
            < calls.index("pg_dump")
            < calls.index("backup-python")
        )


class Store:
    def __init__(self, pages, fail=False):
        self.pages = iter(pages)
        self.deleted = []
        self.uploaded = False
        self.fail = fail

    def list_objects(self, *args, **kwargs):
        objects, next_start = next(self.pages)
        return SimpleNamespace(
            data=SimpleNamespace(objects=objects, next_start_with=next_start)
        )

    def delete_object(self, namespace, bucket, name):
        self.deleted.append(name)

    def put_object(self, namespace, bucket, name, body, opc_meta, content_md5):
        if self.fail:
            raise OSError("upload failed")
        self.uploaded = True
        self.content = body.read()
        self.digest = opc_meta["sha256"]

    def head_object(self, *args):
        return SimpleNamespace(
            headers={
                "content-length": str(len(self.content)),
                "opc-meta-sha256": self.digest,
            }
        )


def obj(name, size):
    return SimpleNamespace(name=f"database/{name}.dump", size=size)


def test_backup_cap_preserves_last_copy_and_paginates(tmp_path, monkeypatch):
    backup = load_backup()
    monkeypatch.setattr(backup, "MAX_BYTES", 10)
    path = tmp_path / "db.dump"
    path.write_bytes(b"123456")
    client = Store([([obj("1", 2)], "next"), ([obj("2", 3)], None)])
    backup.upload(path, client, "ns", "bucket")
    assert client.deleted == ["database/1.dump"]
    assert client.uploaded
    client = Store([([obj("latest", 5)], None)])
    with pytest.raises(RuntimeError, match="last backup"):
        backup.upload(path, client, "ns", "bucket")
    assert not client.deleted and not client.uploaded


def test_failed_backup_upload_retains_latest_copy(tmp_path, monkeypatch):
    backup = load_backup()
    monkeypatch.setattr(backup, "KEEP", 2)
    path = tmp_path / "db.dump"
    path.write_bytes(b"backup")
    client = Store([([obj("1", 1), obj("2", 1)], None)], fail=True)
    with pytest.raises(OSError):
        backup.upload(path, client, "ns", "bucket")
    assert client.deleted == ["database/1.dump"]


def test_connection_url_is_decoded_without_password_arguments(monkeypatch):
    monkeypatch.syspath_prepend(str(ORACLE))
    from postgres_env import postgres_env

    monkeypatch.setenv("PGHOST", "wrong-host")
    monkeypatch.setenv("PGPASSWORD", "wrong-password")
    env = postgres_env("postgresql://alice:p%40ss@localhost:5432/app?sslmode=require")
    assert env["PGHOST"] == "localhost"
    assert env["PGPASSWORD"] == "p@ss"
    assert env["PGDATABASE"] == "app"
    assert env["PGSSLMODE"] == "require"
    with pytest.raises(ValueError, match="Unsupported libpq options"):
        postgres_env(
            "postgresql://alice@localhost/app?ssl_min_protocol_version=TLSv1.3"
        )


@pytest.mark.parametrize(
    "mode", ["configure", "enable", "ssh-failure", "health-failure", "sha-mismatch"]
)
def test_ci_activation_requires_a_reachable_tested_release(tmp_path, mode):
    commands = tmp_path / "bin"
    commands.mkdir()
    log = tmp_path / "commands.log"
    key = tmp_path / "key"
    key.write_text("private-key-test-value")
    known_hosts = tmp_path / "known_hosts"
    known_hosts.write_text("verified-host-key-test-value")
    stub = """#!/bin/bash
printf '%s %s\\n' "${0##*/}" "$*" >> "$COMMAND_LOG"
case "${0##*/}" in
  ssh) [[ "$MODE" != ssh-failure ]] || exit 42 ;;
  gh)
    if [[ "$*" == repo\\ view* ]]; then printf 'Abudidayo/half-life'; fi
    if [[ "$*" == api* ]]; then printf '%s' "$TEST_SHA"; fi ;;
  curl)
    if [[ "$*" == *release.json* ]]; then
      if [[ "$MODE" == sha-mismatch ]]; then printf '{"sha":"wrong"}'
      else printf '{"sha":"%s"}' "$TEST_SHA"; fi
    else
      [[ "$MODE" != health-failure ]] || exit 22
      printf '{"status":"ok","source":"live"}'
    fi ;;
esac
exit 0
"""
    for command in ("ssh-keygen", "ssh", "gh", "curl"):
        path = commands / command
        path.write_text(stub)
        path.chmod(0o755)
    args = [
        "bash",
        str(ORACLE / "configure-ci.sh"),
        "192.0.2.1",
        "https://half-life-test.duckdns.org",
        str(key),
        str(known_hosts),
    ]
    if mode != "configure":
        args.append("--enable")
    result = subprocess.run(
        args,
        env={
            **os.environ,
            "PATH": f"{commands}:{os.environ['PATH']}",
            "COMMAND_LOG": str(log),
            "MODE": mode,
            "TEST_SHA": SHA,
        },
        capture_output=True,
        text=True,
        check=False,
        timeout=10,
    )
    calls = log.read_text()
    assert key.read_text() not in calls
    assert "StrictHostKeyChecking=yes" in calls
    enabled = "variable set ORACLE_DEPLOY_ENABLED" in calls
    if mode == "enable":
        assert result.returncode == 0, result.stderr
        assert enabled
        assert (
            calls.index("release.json")
            < calls.index("variable set DEMO_URL")
            < calls.index("variable set ORACLE_DEPLOY_ENABLED")
        )
    elif mode == "configure":
        assert result.returncode == 0, result.stderr
        assert "secret set ORACLE_SSH_KEY" in calls
        assert "variable set DEMO_URL" not in calls and not enabled
    else:
        assert result.returncode != 0
        assert "variable set DEMO_URL" not in calls and not enabled
        if mode == "ssh-failure":
            assert "secret set" not in calls
