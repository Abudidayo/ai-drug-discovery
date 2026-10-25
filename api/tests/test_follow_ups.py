"""Follow-ups: once an Experiment is built, its jury and binding poses start on their own."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any
from uuid import UUID

import pytest
from conftest import BARICITINIB, SteppedRunner, bound_components, create
from fastapi.testclient import TestClient

from oxhack_api.app import create_app
from oxhack_api.repo import Repo
from oxhack_api.schemas import Candidate, Structure
from oxhack_api.services.docking import FixtureDocking, structure_for
from oxhack_api.services.experiments import ExperimentService
from oxhack_api.services.jury import FixtureJury
from oxhack_api.services.source import FixtureSource
from oxhack_api.settings import FIXTURES_DIR, Settings

COVID_DOCKABLE = 6
"""Drugs on the COVID-19 fixture's shortlist that can be docked into a prepared structure."""


@pytest.fixture
def follow_client(
    settings: Settings, repo: Repo, runner: SteppedRunner
) -> Callable[..., TestClient]:
    def make(**pieces: Any) -> TestClient:
        on = settings.model_copy(update={"follow_ups": True})
        return TestClient(create_app(components=bound_components(on, repo, runner, **pieces)))

    return make


def build(client: TestClient, runner: SteppedRunner) -> dict[str, Any]:
    """Create the COVID-19 Experiment and run only its build job, leaving what it queues."""
    experiment = create(client)
    build_job = runner.jobs.popleft()
    for _ in build_job:
        pass
    return client.get(f"/api/experiments/{experiment['id']}").json()


def test_a_built_experiment_queues_its_jury_and_a_pose_for_every_dockable_drug(
    follow_client: Callable[..., TestClient], runner: SteppedRunner
) -> None:
    client = follow_client()
    experiment = build(client, runner)
    assert experiment["status"] == "ready"
    assert experiment["jury"]["status"] == "queued"

    # In the order they were queued (the Experiment lists its newest first).
    jobs = sorted(experiment["dock_jobs"], key=lambda job: job["created_at"])
    assert len(jobs) == COVID_DOCKABLE
    # The known-answer drug first, in its own co-crystal structure (a saved result: done).
    assert (jobs[0]["candidate_id"], jobs[0]["structure_id"]) == (BARICITINIB, "6WTO_A")
    assert jobs[0]["status"] == "done"
    # The rest in shortlist order, each in the structure the binding-pose step opens on.
    shortlist = [c["candidate_id"] for c in experiment["candidates"] if c["dockable"]]
    assert [j["candidate_id"] for j in jobs[1:]] == [c for c in shortlist if c != BARICITINIB]
    assert len({j["candidate_id"] for j in jobs}) == COVID_DOCKABLE

    # Running everything finishes them; nothing is queued twice.
    runner.drain()
    done = client.get(f"/api/experiments/{experiment['id']}").json()
    assert done["jury"]["status"] == "done"
    assert {j["status"] for j in done["dock_jobs"]} == {"done"}
    assert len(done["dock_jobs"]) == COVID_DOCKABLE


def test_follow_ups_leave_alone_what_was_already_asked_for(
    follow_client: Callable[..., TestClient],
    runner: SteppedRunner,
    repo: Repo,
) -> None:
    client = follow_client()
    experiment = build(client, runner)
    runner.drain()
    service = ExperimentService(
        repo,
        FixtureSource(FIXTURES_DIR),
        FixtureJury(FIXTURES_DIR),
        FixtureDocking(FIXTURES_DIR),
        runner,
    )
    service.start_follow_ups(UUID(experiment["id"]))
    again = client.get(f"/api/experiments/{experiment['id']}").json()
    assert len(again["dock_jobs"]) == COVID_DOCKABLE
    assert not runner.jobs


class _BrokenStructures(FixtureDocking):
    def structures(self) -> list[Structure]:
        raise RuntimeError("the structure index is unreadable")


def test_a_follow_up_that_cannot_start_never_fails_the_build(
    follow_client: Callable[..., TestClient], runner: SteppedRunner
) -> None:
    client = follow_client(docking=_BrokenStructures(FIXTURES_DIR))
    experiment = build(client, runner)
    assert experiment["status"] == "ready"
    assert experiment["error"] is None
    # The jury started before the poses failed to; a reader can still ask for a pose.
    assert experiment["jury"]["status"] == "queued"
    assert experiment["dock_jobs"] == []


def test_without_follow_ups_the_reader_asks_for_each(
    client: TestClient, runner: SteppedRunner
) -> None:
    experiment = build(client, runner)
    assert experiment["jury"] is None
    assert experiment["dock_jobs"] == []
    assert not runner.jobs


def test_structure_for_prefers_the_drugs_own_co_crystal(
    follow_client: Callable[..., TestClient], runner: SteppedRunner
) -> None:
    client = follow_client()
    experiment = create(client)
    runner.drain()
    body = client.get(f"/api/experiments/{experiment['id']}").json()
    structures = FixtureDocking(FIXTURES_DIR).structures()
    candidates = {c["candidate_id"]: Candidate.model_validate(c) for c in body["candidates"]}
    own = structure_for(candidates[BARICITINIB], structures)
    assert own is not None
    assert own.id == "6WTO_A"
    # A drug without a dockable structure gets none.
    assert all(structure_for(c, structures) is None for c in candidates.values() if not c.dockable)
