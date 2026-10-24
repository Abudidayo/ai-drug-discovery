"""Migrations apply cleanly, are idempotent, and the schema enforces its rules."""

from __future__ import annotations

import importlib.util
import shutil
import sys
import threading
import uuid
from pathlib import Path

import psycopg
import pytest
from psycopg import errors

DB_DIR = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("migrate", DB_DIR / "migrate.py")
migrate_module = importlib.util.module_from_spec(_spec)
sys.modules["migrate"] = migrate_module  # dataclasses look the module up while it loads
_spec.loader.exec_module(migrate_module)
migrate = migrate_module.migrate

ALL_VERSIONS = [m.version for m in migrate_module.load_migrations()]


def _schema_snapshot(conninfo: str) -> list[tuple]:
    """Tables, columns, constraints, indexes and triggers: enough to spot any change."""
    with psycopg.connect(conninfo) as conn:
        columns = conn.execute(
            """select table_name, column_name, data_type, is_nullable, column_default
               from information_schema.columns where table_schema = 'public' order by 1, 2"""
        ).fetchall()
        constraints = conn.execute(
            """select conrelid::regclass::text, conname, pg_get_constraintdef(oid)
               from pg_constraint where connamespace = 'public'::regnamespace order by 1, 2"""
        ).fetchall()
        indexes = conn.execute(
            "select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by 1, 2"
        ).fetchall()
        triggers = conn.execute(
            """select tgrelid::regclass::text, tgname from pg_trigger
               where not tgisinternal order by 1, 2"""
        ).fetchall()
    return columns + constraints + indexes + triggers


@pytest.fixture
def migrated(database: str) -> str:
    migrate(database)
    return database


def _experiment(conn: psycopg.Connection, **overrides) -> uuid.UUID:
    row = {
        "disease_id": "MONDO_0100096",
        "disease_name": "COVID-19",
        "data_releases": ["opentargets-26.09", "chembl-37", "string-12.5"],
        "jury_config": "{}",
        "ranking_settings": "{}",
        "status": "ready",
        **overrides,
    }
    cols = ", ".join(row)
    vals = ", ".join(["%s"] * len(row))
    return conn.execute(
        f"insert into experiments ({cols}) values ({vals}) returning id",
        list(row.values()),
    ).fetchone()[0]


def _candidate(
    conn: psycopg.Connection,
    experiment_id: uuid.UUID,
    candidate_id: str = "CHEMBL2105759",
) -> None:
    conn.execute(
        """insert into candidates (experiment_id, candidate_id, name, status, selected_by, network, payload)
           values (%s, %s, 'baricitinib', 'scored', '{network}', '{"rank": 1}', '{}')""",
        (experiment_id, candidate_id),
    )


# ---------------------------------------------------------------------------
# Applying migrations
# ---------------------------------------------------------------------------


def test_applies_all_then_is_a_no_op(database: str) -> None:
    assert migrate(database) == ALL_VERSIONS
    before = _schema_snapshot(database)
    assert migrate(database) == []
    assert _schema_snapshot(database) == before


def test_dry_run_changes_nothing(database: str) -> None:
    assert migrate(database, dry_run=True) == ALL_VERSIONS
    with psycopg.connect(database) as conn:
        assert (
            conn.execute("select to_regclass('public.experiments')").fetchone()[0]
            is None
        )
        assert (
            conn.execute("select to_regclass('public.schema_migrations')").fetchone()[0]
            is None
        )


def test_baselines_a_database_that_already_has_0001(database: str) -> None:
    """The Tiger service got 0001 through psql before migrate.py existed."""
    first = migrate_module.load_migrations()[0]
    with psycopg.connect(database, autocommit=True) as conn, conn.transaction():
        conn.execute(first.sql)
    assert migrate(database) == ALL_VERSIONS[1:]
    with psycopg.connect(database) as conn:
        assert [
            r[0]
            for r in conn.execute("select version from schema_migrations order by 1")
        ] == ALL_VERSIONS


def test_refuses_an_edited_migration(database: str, tmp_path: Path) -> None:
    copy = tmp_path / "migrations"
    shutil.copytree(migrate_module.MIGRATIONS_DIR, copy)
    migrate(database, directory=copy)
    edited = copy / migrate_module.load_migrations(copy)[-1].path.name
    edited.write_text(edited.read_text() + "\n-- edited\n")
    with pytest.raises(SystemExit, match="changed after it was applied"):
        migrate(database, directory=copy)


def test_concurrent_runs_apply_each_file_once(database: str) -> None:
    results: list[list[str]] = []
    failures: list[BaseException] = []

    def run() -> None:
        try:
            results.append(migrate(database))
        except BaseException as exc:  # noqa: BLE001 - surfaced by the assert below
            failures.append(exc)

    threads = [threading.Thread(target=run) for _ in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert not failures
    assert sorted(v for r in results for v in r) == ALL_VERSIONS


# ---------------------------------------------------------------------------
# Rules the schema enforces
# ---------------------------------------------------------------------------


def test_experiments_are_archived_never_deleted(migrated: str) -> None:
    with psycopg.connect(migrated) as conn:
        experiment_id = _experiment(conn)
        conn.commit()
        with pytest.raises(errors.RestrictViolation, match="archived, never deleted"):
            conn.execute("delete from experiments where id = %s", (experiment_id,))


def test_candidates_cannot_be_dropped_out_from_under_votes_or_docking(
    migrated: str,
) -> None:
    with psycopg.connect(migrated) as conn:
        experiment_id = _experiment(conn)
        _candidate(conn, experiment_id)
        conn.execute(
            """insert into dock_jobs (experiment_id, candidate_id, target_id, structure_id, ligand_smiles, settings, cache_key)
               values (%s, 'CHEMBL2105759', 'ENSG00000096968', '6WTO_A', 'C', '{}', %s)""",
            (experiment_id, "a" * 64),
        )
        conn.commit()
        with pytest.raises(errors.ForeignKeyViolation):
            conn.execute(
                "delete from candidates where experiment_id = %s", (experiment_id,)
            )


def test_new_experiments_must_state_their_status(migrated: str) -> None:
    with psycopg.connect(migrated) as conn, pytest.raises(errors.NotNullViolation):
        conn.execute(
            """insert into experiments (disease_id, disease_name, data_releases, jury_config, ranking_settings)
               values ('MONDO_0100096', 'COVID-19', '{opentargets-26.09}', '{}', '{}')"""
        )


def test_failed_experiment_needs_an_error(migrated: str) -> None:
    with psycopg.connect(migrated) as conn, pytest.raises(errors.CheckViolation):
        _experiment(conn, status="failed")


def test_updated_at_moves_on_update(migrated: str) -> None:
    with psycopg.connect(migrated, autocommit=True) as conn:
        experiment_id = _experiment(conn)
        before = conn.execute(
            "select updated_at from experiments where id = %s", (experiment_id,)
        ).fetchone()[0]
        conn.execute(
            "update experiments set archived_at = now() where id = %s", (experiment_id,)
        )
        after = conn.execute(
            "select updated_at from experiments where id = %s", (experiment_id,)
        ).fetchone()[0]
    assert after > before


def test_only_one_live_job_of_each_kind_per_experiment(migrated: str) -> None:
    with psycopg.connect(migrated) as conn:
        experiment_id = _experiment(conn, status="queued")
        conn.execute(
            "insert into jobs (kind, experiment_id) values ('experiment_build', %s)",
            (experiment_id,),
        )
        conn.execute(
            "insert into jobs (kind, experiment_id) values ('jury_run', %s)",
            (experiment_id,),
        )
        with pytest.raises(errors.UniqueViolation):
            conn.execute(
                "insert into jobs (kind, experiment_id) values ('experiment_build', %s)",
                (experiment_id,),
            )


def test_a_finished_job_frees_its_slot(migrated: str) -> None:
    with psycopg.connect(migrated) as conn:
        experiment_id = _experiment(conn)
        conn.execute(
            "insert into jobs (kind, experiment_id, status, error) values ('jury_run', %s, 'failed', 'Cortex timed out')",
            (experiment_id,),
        )
        conn.execute(
            "insert into jobs (kind, experiment_id) values ('jury_run', %s)",
            (experiment_id,),
        )


def test_running_job_needs_a_heartbeat(migrated: str) -> None:
    with psycopg.connect(migrated) as conn, pytest.raises(errors.CheckViolation):
        experiment_id = _experiment(conn)
        conn.execute(
            "insert into jobs (kind, experiment_id, status) values ('jury_run', %s, 'running')",
            (experiment_id,),
        )


def test_skip_locked_claims_each_job_once(migrated: str) -> None:
    with psycopg.connect(migrated, autocommit=True) as setup:
        for _ in range(2):
            experiment_id = _experiment(setup, status="queued")
            setup.execute(
                "insert into jobs (kind, experiment_id) values ('experiment_build', %s)",
                (experiment_id,),
            )
    claim = """
        update jobs set status = 'running', started_at = now(), heartbeat_at = now(), attempts = attempts + 1
        where id = (select id from jobs where status = 'queued' order by created_at
                    for update skip locked limit 1)
        returning id"""
    with psycopg.connect(migrated) as a, psycopg.connect(migrated) as b:
        first = a.execute(claim).fetchone()
        second = b.execute(claim).fetchone()
        third = b.execute(claim).fetchone()
        assert first and second and first != second
        assert third is None


def test_excluded_target_needs_a_reason(migrated: str) -> None:
    with psycopg.connect(migrated) as conn:
        experiment_id = _experiment(conn)
        conn.execute(
            """insert into experiment_targets (experiment_id, target_id, name, rank, evidence_only_score, retained)
               values (%s, 'ENSG00000130234', 'ACE2', 1, 0.82, true)""",
            (experiment_id,),
        )
        with pytest.raises(errors.CheckViolation):
            conn.execute(
                """insert into experiment_targets (experiment_id, target_id, name, rank, evidence_only_score, retained)
                   values (%s, 'ENSG00000163818', 'LZTFL1', 2, 0.4, false)""",
                (experiment_id,),
            )


def test_jury_agreement_is_between_zero_and_one(migrated: str) -> None:
    with psycopg.connect(migrated) as conn, pytest.raises(errors.CheckViolation):
        experiment_id = _experiment(conn)
        conn.execute(
            """insert into jury_runs (experiment_id, status, config, consensus, agreement)
               values (%s, 'done', '{}', '{}', 1.4)""",
            (experiment_id,),
        )


def test_one_live_docking_computation_per_cache_key(migrated: str) -> None:
    insert = """insert into dock_jobs (kind, candidate_id, target_id, structure_id, ligand_smiles, settings, cache_key, status, error, cached_from)
                values ('redock_control', 'CHEMBL2105759', 'ENSG00000096968', '6WTO_A', 'C', '{}', %s, %s, %s, %s) returning id"""
    key = "b" * 64
    with psycopg.connect(migrated) as conn:
        failed = conn.execute(
            insert, (key, "failed", "vina timed out", None)
        ).fetchone()[0]
        original = conn.execute(insert, (key, "done", None, None)).fetchone()[0]
        conn.execute(insert, (key, "done", None, original))  # cache hit row
        assert failed != original
        with pytest.raises(errors.UniqueViolation):
            conn.execute(insert, (key, "queued", None, None))
