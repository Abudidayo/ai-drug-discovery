"""Export a paused Codespaces app or verify/restore it on an empty Oracle database.

Run through the workspace uv environment with the appropriate --env-file.
The export leaves the source database read-only and its app stopped on success.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import time
from pathlib import Path

import psycopg
from postgres_env import postgres_env
from psycopg import sql


def database_manifest(connection) -> dict:
    connection.execute("SET LOCAL timezone TO 'UTC'")
    tables = connection.execute(
        "select tablename from pg_tables where schemaname='public' order by tablename"
    ).fetchall()
    result = {}
    for (name,) in tables:
        digest = hashlib.sha256()
        count = 0
        with connection.cursor(name="migration_rows") as cursor:
            cursor.execute(
                sql.SQL(
                    'select row_to_json(t)::text from public.{} t order by row_to_json(t)::text COLLATE "C"'
                ).format(sql.Identifier(name))
            )
            for (row,) in cursor:
                digest.update(row.encode() + b"\n")
                count += 1
        result[name] = {"rows": count, "sha256": digest.hexdigest()}
    return result


def archive(source: Path, target: Path) -> None:
    subprocess.run(["tar", "-czf", str(target), "-C", str(source), "."], check=True)


def export_bundle(bundle: Path, dsn: str) -> None:
    from oxhack_api.settings import Settings

    settings = Settings()
    with psycopg.connect(dsn) as connection:
        major = connection.info.server_version // 10000
        database = connection.info.dbname
    client = subprocess.check_output(["pg_dump", "--version"], text=True)
    if int(re.search(r"(\d+)\.", client)[1]) != major:
        raise RuntimeError(
            f"Install PostgreSQL {major} client tools before pausing the source."
        )
    bundle.mkdir(mode=0o700, parents=True, exist_ok=False)
    for folder in (settings.data_dir, settings.results_dir, settings.structures_dir):
        if not folder.is_dir():
            raise RuntimeError(f"Missing source directory: {folder}")
    patterns = (
        "[s]cripts/serve.sh",
        "[u]vicorn oxhack_api",
        "[o]xhack_api.worker",
        "[o]xhack_worker.queue",
    )
    frozen = False
    try:
        for pattern in patterns:
            subprocess.run(["pkill", "-TERM", "-f", pattern], check=False)
        for _ in range(int(settings.dock_timeout_s) + 60):
            if all(
                subprocess.run(
                    ["pgrep", "-f", p], check=False, stdout=subprocess.DEVNULL
                ).returncode
                == 1
                for p in patterns
            ):
                break
            time.sleep(1)
        else:
            raise RuntimeError("Source processes did not stop; no snapshot taken.")
        with psycopg.connect(dsn, autocommit=True) as connection:
            connection.execute(
                sql.SQL(
                    "ALTER DATABASE {} SET default_transaction_read_only=on"
                ).format(sql.Identifier(database))
            )
            frozen = True
            others = connection.execute(
                "select count(*) from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid() and backend_type='client backend'"
            ).fetchone()[0]
            if others:
                raise RuntimeError(
                    "Other database clients remain connected. Stop them before exporting."
                )
        subprocess.run(
            [
                "pg_dump",
                "--schema=public",
                "--format=custom",
                "--no-owner",
                "--no-acl",
                f"--file={bundle / 'database.dump'}",
            ],
            env=postgres_env(dsn),
            check=True,
        )
        with psycopg.connect(dsn) as connection:
            tables = database_manifest(connection)
        archive(settings.data_dir, bundle / "data.tgz")
        archive(settings.results_dir, bundle / "docking.tgz")
        archive(settings.structures_dir, bundle / "structures.tgz")
        # Transfer only the existing model-service configuration, never the old DB URL.
        keys = (
            "SNOWFLAKE_ACCOUNT",
            "SNOWFLAKE_PAT",
            "SNOWFLAKE_MODELS",
            "SNOWFLAKE_REASONING_EFFORT",
        )
        with (bundle / "cortex.env").open("w") as output:
            for key in keys:
                if key in os.environ:
                    output.write(f"{key}={json.dumps(os.environ[key])}\n")
        checksums = {}
        for path in bundle.iterdir():
            if path.is_file():
                with path.open("rb") as stream:
                    checksums[path.name] = hashlib.file_digest(
                        stream, "sha256"
                    ).hexdigest()
        (bundle / "manifest.json").write_text(
            json.dumps(
                {"postgres_major": major, "tables": tables, "files": checksums},
                indent=2,
            )
            + "\n"
        )
        print(
            f"Export verified at {bundle}. Source remains stopped and database read-only."
        )
    except BaseException:
        if frozen:
            with psycopg.connect(
                dsn, autocommit=True, options="-c default_transaction_read_only=off"
            ) as connection:
                connection.execute(
                    sql.SQL(
                        "ALTER DATABASE {} RESET default_transaction_read_only"
                    ).format(sql.Identifier(database))
                )
        with open("/workspaces/serve.log", "ab") as log:
            subprocess.Popen(
                ["bash", "scripts/serve.sh"],
                stdin=subprocess.DEVNULL,
                stdout=log,
                stderr=log,
                start_new_session=True,
            )
        raise


def import_bundle(bundle: Path, dsn: str) -> None:
    from oxhack_api.settings import Settings

    manifest = json.loads((bundle / "manifest.json").read_text())
    for name, expected in manifest["files"].items():
        if (
            Path(name).name != name
            or hashlib.file_digest((bundle / name).open("rb"), "sha256").hexdigest()
            != expected
        ):
            raise RuntimeError(f"Checksum mismatch: {name}")
    with psycopg.connect(dsn) as connection:
        if connection.info.server_version // 10000 != manifest["postgres_major"]:
            raise RuntimeError("Source and destination PostgreSQL majors must match.")
        if connection.execute(
            "select count(*) from pg_tables where schemaname='public'"
        ).fetchone()[0]:
            raise RuntimeError("Refusing to restore over a nonempty database.")
    settings = Settings()
    for name, destination in (
        ("data", settings.data_dir),
        ("docking", settings.results_dir),
        ("structures", settings.structures_dir),
    ):
        destination.mkdir(parents=True, exist_ok=True)
        # Source-owned archives only. Never accept uploads from an untrusted party.
        subprocess.run(
            ["tar", "-xzf", str(bundle / f"{name}.tgz"), "-C", str(destination)],
            check=True,
        )
    subprocess.run(
        [
            "pg_restore",
            "--dbname=" + postgres_env(dsn)["PGDATABASE"],
            "--no-owner",
            "--no-acl",
            "--clean",
            "--if-exists",
            "--exit-on-error",
            "--single-transaction",
            str(bundle / "database.dump"),
        ],
        env=postgres_env(dsn),
        check=True,
    )
    with psycopg.connect(dsn) as connection:
        if database_manifest(connection) != manifest["tables"]:
            raise RuntimeError("Restored table content differs from the paused source.")
    print("Restored database matches every source table's row count and content hash.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("export", "import", "verify"))
    parser.add_argument("bundle", type=Path)
    args = parser.parse_args()
    dsn = os.environ["DATABASE_URL"]
    os.umask(0o077)
    if args.mode == "export":
        export_bundle(args.bundle.resolve(), dsn)
    elif args.mode == "import":
        import_bundle(args.bundle.resolve(), dsn)
    else:
        with psycopg.connect(dsn) as connection:
            expected = json.loads((args.bundle / "manifest.json").read_text())["tables"]
            if database_manifest(connection) != expected:
                raise RuntimeError("Database differs from source snapshot.")
        print("All table hashes match the source snapshot.")


if __name__ == "__main__":
    main()
