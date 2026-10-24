"""In-memory storage for development and tests. Everything is lost on restart."""

from __future__ import annotations

import threading
from collections.abc import Generator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from ..schemas import (
    BuildStage,
    Candidate,
    DiseaseTarget,
    DockJob,
    Experiment,
    ExperimentStatus,
    ExperimentSummary,
    JuryRun,
    NetworkGraph,
)
from .base import AlreadyExists


@dataclass
class _DockRow:
    job: DockJob
    cache_key: str


class MemoryRepo:
    """Implements `Repo`. Stores copies, so callers never share mutable state with it."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._experiments: dict[UUID, Experiment] = {}
        self._jury: dict[UUID, JuryRun] = {}
        self._dock: dict[UUID, _DockRow] = {}

    @contextmanager
    def locked(self, experiment_id: UUID) -> Generator[None]:
        with self._lock:
            yield

    # Experiments ------------------------------------------------------------

    def add_experiment(self, experiment: Experiment) -> None:
        with self._lock:
            if experiment.id in self._experiments:
                raise AlreadyExists(f"Experiment {experiment.id}")
            stored = experiment.model_copy(deep=True, update={"jury": None, "dock_jobs": []})
            self._experiments[experiment.id] = stored

    def get_experiment(self, experiment_id: UUID) -> Experiment | None:
        with self._lock:
            stored = self._experiments.get(experiment_id)
            if stored is None:
                return None
            jobs = sorted(
                (row.job for row in self._dock.values() if row.job.experiment_id == experiment_id),
                key=lambda job: job.created_at,
                reverse=True,
            )
            return stored.model_copy(
                deep=True, update={"jury": self._jury.get(experiment_id), "dock_jobs": jobs}
            )

    def list_experiments(
        self, *, archived: bool, include_building: bool
    ) -> list[ExperimentSummary]:
        with self._lock:
            rows: list[ExperimentSummary] = []
            for stored in self._experiments.values():
                if (stored.archived_at is not None) != archived:
                    continue
                if stored.status != "ready" and not include_building:
                    continue
                jury = self._jury.get(stored.id)
                docked = sum(
                    1
                    for row in self._dock.values()
                    if row.job.experiment_id == stored.id and row.job.status == "done"
                )
                rows.append(
                    ExperimentSummary(
                        id=stored.id,
                        status=stored.status,
                        disease=stored.disease,
                        data_releases=list(stored.data_releases),
                        juror_count=len(stored.jury_config.models),
                        jury_status=jury.status if jury else None,
                        candidate_count=len(stored.candidates),
                        docked_count=docked,
                        created_at=stored.created_at,
                        archived_at=stored.archived_at,
                    )
                )
            return sorted(rows, key=lambda row: row.created_at, reverse=True)

    def set_build_state(
        self,
        experiment_id: UUID,
        status: ExperimentStatus,
        stage: BuildStage | None,
        error: str | None,
    ) -> None:
        self._update(experiment_id, status=status, stage=stage, error=error)

    def save_build_result(
        self,
        experiment_id: UUID,
        targets: list[DiseaseTarget],
        network: NetworkGraph,
        candidates: list[Candidate],
    ) -> None:
        self._update(experiment_id, targets=targets, network=network, candidates=candidates)

    def set_archived_at(self, experiment_id: UUID, archived_at: datetime | None) -> None:
        self._update(experiment_id, archived_at=archived_at)

    def _update(self, experiment_id: UUID, **changes: object) -> None:
        with self._lock:
            stored = self._experiments[experiment_id]
            self._experiments[experiment_id] = stored.model_copy(deep=True, update=changes)

    # Model jury -------------------------------------------------------------

    def add_jury_run(self, experiment_id: UUID, run: JuryRun) -> None:
        with self._lock:
            if experiment_id in self._jury:
                raise AlreadyExists(f"jury run for Experiment {experiment_id}")
            self._jury[experiment_id] = run.model_copy(deep=True)

    def update_jury_run(self, experiment_id: UUID, run: JuryRun) -> None:
        with self._lock:
            if experiment_id not in self._jury:
                raise KeyError(experiment_id)
            self._jury[experiment_id] = run.model_copy(deep=True)

    # Docking ----------------------------------------------------------------

    def add_dock_job(self, job: DockJob, cache_key: str) -> None:
        with self._lock:
            if job.id in self._dock:
                raise AlreadyExists(f"docking job {job.id}")
            self._dock[job.id] = _DockRow(job.model_copy(deep=True), cache_key)

    def get_dock_job(self, job_id: UUID) -> DockJob | None:
        with self._lock:
            row = self._dock.get(job_id)
            return row.job.model_copy(deep=True) if row else None

    def update_dock_job(self, job: DockJob) -> None:
        with self._lock:
            self._dock[job.id].job = job.model_copy(deep=True)

    def find_reusable_dock_job(self, cache_key: str) -> DockJob | None:
        with self._lock:
            for row in self._dock.values():
                job = row.job
                if (
                    row.cache_key == cache_key
                    and job.cached_from is None
                    and job.status != "failed"
                ):
                    return job.model_copy(deep=True)
            return None

    def list_dock_jobs_cached_from(self, job_id: UUID) -> list[DockJob]:
        with self._lock:
            return [
                row.job.model_copy(deep=True)
                for row in self._dock.values()
                if row.job.cached_from == job_id
            ]
