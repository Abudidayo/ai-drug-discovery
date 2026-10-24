"""Throwaway Postgres for the migration tests. Never points at Tiger.

Set TEST_DATABASE_URL to an admin connection on a disposable server (each test
creates and drops its own database there). Without it, a temporary cluster is
started with the local initdb/pg_ctl binaries.
"""

from __future__ import annotations

import os
import shutil
import socket
import subprocess
import tempfile
import uuid
from collections.abc import Iterator
from pathlib import Path

import psycopg
import pytest
from psycopg.conninfo import conninfo_to_dict, make_conninfo


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def admin_conninfo() -> Iterator[str]:
    url = os.environ.get("TEST_DATABASE_URL")
    if url:
        yield url
        return
    if not (shutil.which("initdb") and shutil.which("pg_ctl")):
        pytest.skip(
            "set TEST_DATABASE_URL or install Postgres (initdb, pg_ctl) to run database tests"
        )
    root = Path(tempfile.mkdtemp(prefix="oxhack-pg-"))
    data, port = root / "data", _free_port()
    subprocess.run(
        ["initdb", "-D", str(data), "-U", "postgres", "-A", "trust"],
        check=True,
        capture_output=True,
    )
    subprocess.run(
        [
            "pg_ctl",
            "-D",
            str(data),
            "-o",
            f"-p {port} -k {root} -c listen_addresses=''",
            "-l",
            str(root / "log"),
            "-w",
            "start",
        ],
        check=True,
        capture_output=True,
    )
    try:
        yield make_conninfo(
            host=str(root), port=port, user="postgres", dbname="postgres"
        )
    finally:
        subprocess.run(
            ["pg_ctl", "-D", str(data), "-m", "immediate", "stop"],
            check=False,
            capture_output=True,
        )
        shutil.rmtree(root, ignore_errors=True)


@pytest.fixture
def database(admin_conninfo: str) -> Iterator[str]:
    """A fresh, empty database for one test."""
    name = f"oxhack_test_{uuid.uuid4().hex[:12]}"
    with psycopg.connect(admin_conninfo, autocommit=True) as conn:
        conn.execute(f'create database "{name}"')
    params = conninfo_to_dict(admin_conninfo)
    params["dbname"] = name
    try:
        yield make_conninfo(**params)
    finally:
        with psycopg.connect(admin_conninfo, autocommit=True) as conn:
            conn.execute(f'drop database "{name}" with (force)')
