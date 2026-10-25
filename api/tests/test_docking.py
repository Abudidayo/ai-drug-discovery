"""Docking in fixture mode: structures, cached and queued jobs, refusals and failures."""

from __future__ import annotations

from collections.abc import Callable
from uuid import uuid4

import pytest
from conftest import (
    BARICITINIB,
    CONTROL_JOB,
    REMDESIVIR,
    RUXOLITINIB,
    THALIDOMIDE,
    TOCILIZUMAB,
    FailingDocking,
    SteppedRunner,
    create,
    dock,
    ready_experiment,
)
from fastapi.testclient import TestClient

from oxhack_api.repo import Repo
from oxhack_api.schemas import DockJob, Structure
from oxhack_api.services.docking import (
    FixtureDocking,
    unsupported_reason,
)
from oxhack_api.services.source import FixtureSource
from oxhack_api.settings import FIXTURES_DIR


def test_structures_lists_the_prepared_set(client: TestClient) -> None:
    response = client.get("/api/structures")
    assert response.status_code == 200
    structures = {s["id"]: s for s in response.json()["structures"]}
    assert list(structures) == ["6WTO_A", "6WTN_A", "6O0K_A", "7BQU_A"]
    wto = structures["6WTO_A"]
    assert wto["target_symbol"] == "JAK2"
    assert wto["resolution"] == 1.74
    assert wto["ligand"] == {"comp_id": "3JW", "name": "baricitinib", "candidate_id": BARICITINIB}
    assert wto["control"]["status"] == "passed"
    assert wto["control"]["fixture"] is True
    assert structures["6WTN_A"]["control"]["rmsd"] is None
    assert structures["6WTN_A"]["control"]["status"] == "not_measured"


def test_a_cached_pair_is_done_at_once(client: TestClient, runner: SteppedRunner) -> None:
    experiment_id = ready_experiment(client, runner)["id"]
    response = dock(client, experiment_id, BARICITINIB, "6WTO_A")
    assert response.status_code == 202
    job = response.json()
    assert job["status"] == "done"
    assert job["cached_from"] == CONTROL_JOB
    assert job["kind"] == "candidate"
    assert job["experiment_id"] == experiment_id
    assert job["target_id"] == "ENSG00000096968"
    assert job["scores"][0] == {"pose": 1, "score": -10.2}
    assert job["fixture"] is True
    assert job["files"] == client.get(f"/api/dock/{CONTROL_JOB}").json()["files"]
    assert job["files"]["poses"]["url"] == f"/api/files/{CONTROL_JOB}/poses.sdf"
    assert not runner.jobs, "nothing is computed again"
    assert client.get(f"/api/dock/{job['id']}").json() == job
    listed = client.get(f"/api/experiments/{experiment_id}").json()["dock_jobs"]
    assert [j["id"] for j in listed] == [job["id"]]


def test_a_supported_pair_is_queued_then_done(client: TestClient, runner: SteppedRunner) -> None:
    experiment_id = ready_experiment(client, runner)["id"]
    job = dock(client, experiment_id, RUXOLITINIB, "6WTO_A").json()
    assert job["status"] == "queued"
    assert job["cached_from"] is None
    assert job["scores"] is None

    def status() -> str:
        return client.get(f"/api/dock/{job['id']}").json()["status"]

    seen = [status()]
    while runner.jobs:
        runner.step()
        seen.append(status())
    assert seen == ["queued", "running", "running", "done"]
    done = client.get(f"/api/dock/{job['id']}").json()
    assert len(done["scores"]) == done["settings"]["n_poses"] == 9
    assert done["files"] is None, "a result made up on request has scores only"
    assert done["started_at"]
    assert done["finished_at"]
    assert client.get("/api/experiments").json()["items"][0]["docked_count"] == 1


def test_a_repeat_request_reuses_the_result(client: TestClient, runner: SteppedRunner) -> None:
    first_experiment = ready_experiment(client, runner)["id"]
    first = dock(client, first_experiment, THALIDOMIDE, "7BQU_A").json()
    runner.drain()
    second_experiment = ready_experiment(client, runner)["id"]
    second = dock(client, second_experiment, THALIDOMIDE, "7BQU_A").json()
    assert second["status"] == "done"
    assert second["cached_from"] == first["id"]
    assert second["scores"] == client.get(f"/api/dock/{first['id']}").json()["scores"]


def test_a_request_during_a_live_run_follows_it(client: TestClient, runner: SteppedRunner) -> None:
    experiment_id = ready_experiment(client, runner)["id"]
    first = dock(client, experiment_id, RUXOLITINIB, "6WTN_A").json()
    follower = dock(client, experiment_id, RUXOLITINIB, "6WTN_A").json()
    assert follower["cached_from"] == first["id"]
    assert follower["status"] == "queued"
    assert len(runner.jobs) == 1, "the computation runs once"
    runner.drain()
    finished = client.get(f"/api/dock/{follower['id']}").json()
    assert finished["status"] == "done"
    assert finished["scores"] == client.get(f"/api/dock/{first['id']}").json()["scores"]


def test_unsupported_pairs_are_422_with_the_reason(
    client: TestClient, runner: SteppedRunner
) -> None:
    experiment_id = ready_experiment(client, runner)["id"]
    cases = {
        (BARICITINIB, "6O0K_A"): "Baricitinib does not act on BCL2, the protein in 6O0K.",
        (TOCILIZUMAB, "6WTO_A"): "Tocilizumab does not act on JAK2",
        (REMDESIVIR, "7BQU_A"): "Remdesivir does not act on CRBN",
        ("CHEMBL3137309", "6O0K_A"): "CHEMBL3137309 is not on this Experiment's shortlist.",
        (BARICITINIB, "1ABC_A"): "1ABC_A is not one of the prepared structures.",
    }
    for (candidate_id, structure_id), message in cases.items():
        response = dock(client, experiment_id, candidate_id, structure_id)
        assert response.status_code == 422, (candidate_id, structure_id)
        assert response.json()["detail"].startswith(message)


def test_an_antibody_on_its_own_target_cannot_be_docked() -> None:
    fixture = FixtureSource(FIXTURES_DIR).load("MONDO_0100096")
    tocilizumab = next(c for c in fixture.candidates if c.candidate_id == TOCILIZUMAB)
    il6r = Structure.model_validate(
        {
            **FixtureDocking(FIXTURES_DIR).structures()[0].model_dump(),
            "target_id": "ENSG00000160712",
            "target_symbol": "IL6R",
        }
    )
    reason = unsupported_reason(tocilizumab, il6r, None)
    assert (
        reason == "Tocilizumab cannot be docked: only small molecules with a known structure can."
    )


def test_malformed_dock_requests_are_422(client: TestClient) -> None:
    response = client.post("/api/dock", json={"experiment_id": str(uuid4())})
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)


def test_dock_for_unknown_experiment_is_404(client: TestClient) -> None:
    assert dock(client, str(uuid4()), BARICITINIB, "6WTO_A").status_code == 404


def test_unknown_dock_job_is_404(client: TestClient) -> None:
    response = client.get(f"/api/dock/{uuid4()}")
    assert response.status_code == 404
    assert response.json() == {"detail": "There is no docking job with this ID."}


def test_the_redock_control_job_can_be_read(client: TestClient) -> None:
    control = client.get(f"/api/dock/{CONTROL_JOB}").json()
    assert control["kind"] == "redock_control"
    assert control["experiment_id"] is None
    assert control["control_rmsd"] == 0.74
    assert control["fixture"] is True


def test_dock_is_refused_on_an_archived_experiment(
    client: TestClient, runner: SteppedRunner
) -> None:
    experiment_id = ready_experiment(client, runner)["id"]
    client.post(f"/api/experiments/{experiment_id}/archive")
    response = dock(client, experiment_id, BARICITINIB, "6WTO_A")
    assert response.status_code == 409
    assert response.json()["detail"] == (
        "This Experiment is archived. Restore it to compute a binding pose."
    )


def test_dock_is_refused_before_the_experiment_is_ready(client: TestClient) -> None:
    experiment_id = create(client)["id"]
    assert dock(client, experiment_id, BARICITINIB, "6WTO_A").status_code == 409


def test_archive_is_refused_while_a_dock_job_is_live(
    client: TestClient, runner: SteppedRunner
) -> None:
    experiment_id = ready_experiment(client, runner)["id"]
    dock(client, experiment_id, RUXOLITINIB, "6WTO_A")
    queued = client.post(f"/api/experiments/{experiment_id}/archive")
    assert queued.status_code == 409
    assert "still being computed" in queued.json()["detail"]
    runner.step()  # now running
    assert client.post(f"/api/experiments/{experiment_id}/archive").status_code == 409
    runner.drain()
    assert client.post(f"/api/experiments/{experiment_id}/archive").status_code == 200


def test_a_failed_docking_job_reports_why_and_is_not_reused(
    make_client: Callable[..., TestClient], runner: SteppedRunner
) -> None:
    client = make_client(docking=FailingDocking(FIXTURES_DIR))
    experiment_id = ready_experiment(client, runner)["id"]
    job = dock(client, experiment_id, RUXOLITINIB, "6WTO_A").json()
    runner.drain()
    failed = client.get(f"/api/dock/{job['id']}").json()
    assert failed["status"] == "failed"
    assert failed["error"] == "Vina timed out after 180 s.\nlast log line"
    assert failed["scores"] is None
    retry = dock(client, experiment_id, RUXOLITINIB, "6WTO_A").json()
    assert retry["status"] == "queued"
    assert retry["cached_from"] is None
    # The rest of the Experiment stays saved.
    assert client.get(f"/api/experiments/{experiment_id}").json()["status"] == "ready"


def test_a_racing_duplicate_reuses_the_job_that_won(
    client: TestClient, runner: SteppedRunner, repo: Repo, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Another request starts the same computation between our lookup and our insert:
    the repo refuses a second live computation and the request follows the first."""
    first_experiment = ready_experiment(client, runner)["id"]
    second_experiment = ready_experiment(client, runner)["id"]
    first = dock(client, first_experiment, RUXOLITINIB, "6WTN_A").json()

    lookups: list[str] = []
    find = repo.find_reusable_dock_job

    def stale_first_lookup(cache_key: str) -> DockJob | None:
        lookups.append(cache_key)
        return None if len(lookups) == 1 else find(cache_key)

    monkeypatch.setattr(repo, "find_reusable_dock_job", stale_first_lookup)
    response = dock(client, second_experiment, RUXOLITINIB, "6WTN_A")
    assert response.status_code == 202, response.text
    second = response.json()
    assert len(lookups) == 2, "looked again after the duplicate was refused"
    assert second["cached_from"] == first["id"]
    assert second["status"] == "queued"
    assert len(runner.jobs) == 1, "the computation runs once"
    jobs = client.get(f"/api/experiments/{second_experiment}").json()["dock_jobs"]
    assert [j["id"] for j in jobs] == [second["id"]]
