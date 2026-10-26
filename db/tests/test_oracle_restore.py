"""Restore a real PostgreSQL dump and detect changed data before cutover."""

import hashlib
import importlib.util
import json
import shutil
import subprocess
from pathlib import Path

import psycopg
import pytest
import throwaway_pg
from psycopg import sql

ROOT = Path(__file__).resolve().parents[2]


def test_oracle_restore_preserves_rows_and_files(database, tmp_path, monkeypatch):
    if not all(shutil.which(tool) for tool in ("pg_dump", "pg_restore")):
        pytest.skip("PostgreSQL dump tools are required")
    monkeypatch.syspath_prepend(str(ROOT / "scripts/oracle"))
    spec = importlib.util.spec_from_file_location(
        "oracle_migration", ROOT / "scripts/oracle/migrate.py"
    )
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    from postgres_env import postgres_env

    bundle = tmp_path / "bundle"
    bundle.mkdir()
    with psycopg.connect(database) as connection:
        connection.execute(
            "create table migration_check(id integer primary key, payload jsonb, at timestamptz)"
        )
        connection.execute(
            "insert into migration_check values (1, '{\"drug\":\"CHEMBL1\"}', '2026-10-26T10:00:00Z')"
        )
        expected = migration.database_manifest(connection)
        major = connection.info.server_version // 10000
    subprocess.run(
        [
            "pg_dump",
            "--schema=public",
            "--format=custom",
            "--no-owner",
            "--no-acl",
            f"--file={bundle / 'database.dump'}",
        ],
        env=postgres_env(database),
        check=True,
    )
    for name in ("data", "docking", "structures"):
        source = tmp_path / f"source-{name}"
        source.mkdir()
        (source / "example.txt").write_text(f"original {name} bytes")
        migration.archive(source, bundle / f"{name}.tgz")
    checksums = {}
    for path in bundle.iterdir():
        with path.open("rb") as stream:
            checksums[path.name] = hashlib.file_digest(stream, "sha256").hexdigest()
    manifest = {"postgres_major": major, "tables": expected, "files": checksums}
    (bundle / "manifest.json").write_text(json.dumps(manifest))
    monkeypatch.setenv("OXHACK_DATA_DIR", str(tmp_path / "destination/data"))
    monkeypatch.setenv(
        "OXHACK_STRUCTURES_DIR", str(tmp_path / "destination/structures")
    )
    monkeypatch.setenv("RESULTS_DIR", str(tmp_path / "destination/docking"))
    # Match the restore user's permissions instead of relying on a superuser.
    with psycopg.connect(database, autocommit=True) as connection:
        connection.execute("create role oracle_restore_test_role")
    try:
        with throwaway_pg.fresh_database(database) as target:
            with psycopg.connect(target, autocommit=True) as connection:
                connection.execute(
                    sql.SQL(
                        "alter database {} owner to oracle_restore_test_role"
                    ).format(sql.Identifier(throwaway_pg.database_name(target)))
                )
            migration.import_bundle(
                bundle, target + " options='-c role=oracle_restore_test_role'"
            )
            for name in ("data", "docking", "structures"):
                assert (
                    tmp_path / f"destination/{name}/example.txt"
                ).read_text() == f"original {name} bytes"
            with pytest.raises(RuntimeError, match="nonempty"):
                migration.import_bundle(bundle, target)
            with psycopg.connect(target) as connection:
                connection.execute("update migration_check set payload='{}'")
                assert migration.database_manifest(connection) != expected
    finally:
        with psycopg.connect(database, autocommit=True) as connection:
            connection.execute("drop role oracle_restore_test_role")
