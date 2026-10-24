from __future__ import annotations

from collections import deque
from collections.abc import Callable, Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from oxhack_api.app import build_components, create_app
from oxhack_api.deps import Components
from oxhack_api.jobs import Job
from oxhack_api.settings import FIXTURES_DIR, Settings

COVID = "MONDO_0100096"
BARICITINIB = "CHEMBL2105759"
RUXOLITINIB = "CHEMBL1789941"
TOCILIZUMAB = "CHEMBL1237022"
REMDESIVIR = "CHEMBL4065616"
THALIDOMIDE = "CHEMBL468"


class SteppedRunner:
    """Holds submitted jobs until the test advances them, one step at a time."""

    def __init__(self) -> None:
        self.jobs: deque[Job] = deque()

    def submit(self, job: Job) -> None:
        self.jobs.append(job)

    def step(self) -> None:
        """Advance the oldest job by one step."""
        try:
            next(self.jobs[0])
        except StopIteration:
            self.jobs.popleft()

    def drain(self) -> None:
        while self.jobs:
            job = self.jobs.popleft()
            for _ in job:
                pass


@pytest.fixture
def settings() -> Settings:
    return Settings(fixture_delay_ms=0, fixtures_dir=FIXTURES_DIR)


@pytest.fixture
def runner() -> SteppedRunner:
    return SteppedRunner()


@pytest.fixture
def make_client(settings: Settings, runner: SteppedRunner) -> Iterator[Callable[..., TestClient]]:
    clients: list[TestClient] = []

    def make(**pieces: Any) -> TestClient:
        components: Components = build_components(settings, runner=runner, **pieces)
        client = TestClient(create_app(components=components))
        clients.append(client)
        return client

    yield make
    for client in clients:
        client.close()


@pytest.fixture
def client(make_client: Callable[..., TestClient]) -> TestClient:
    return make_client()


def create(client: TestClient, disease_id: str = COVID) -> dict[str, Any]:
    response = client.post("/api/experiments", json={"disease_id": disease_id})
    assert response.status_code == 202, response.text
    return response.json()


def ready_experiment(client: TestClient, runner: SteppedRunner) -> dict[str, Any]:
    """Create the COVID-19 Experiment and run its build to the end."""
    experiment = create(client)
    runner.drain()
    body = client.get(f"/api/experiments/{experiment['id']}").json()
    assert body["status"] == "ready", body
    return body


def dock(client: TestClient, experiment_id: str, candidate_id: str, structure_id: str) -> Any:
    return client.post(
        "/api/dock",
        json={
            "experiment_id": experiment_id,
            "candidate_id": candidate_id,
            "structure_id": structure_id,
        },
    )
