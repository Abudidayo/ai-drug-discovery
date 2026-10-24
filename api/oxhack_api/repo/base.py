"""The storage seam. `MemoryRepo` implements it now; a Postgres repo follows in phase 4.

Each method maps onto the tables in `db/migrations/`:

- `add_experiment`, `set_build_state`, `set_archived_at`: `experiments`.
- `save_build_result`: `experiment_targets`, `candidates` and `experiments.network`.
- `add_jury_run`, `update_jury_run`: `jury_runs`, `jurors` and `jury_votes`.
- `add_dock_job`, `update_dock_job`, `find_reusable_dock_job`: `dock_jobs`.

The service checks rules (archived, already asked, job still running) and then
writes. `locked()` makes that check-then-write atomic: the memory repo holds a
lock, and the Postgres repo will open a transaction and lock the Experiment row
with `SELECT ... FOR UPDATE`.
"""

from __future__ import annotations

from contextlib import AbstractContextManager
from datetime import datetime
from typing import Protocol
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


class AlreadyExists(Exception):
    """A row with this key exists already (a primary key or unique violation)."""


class Repo(Protocol):
    def locked(self, experiment_id: UUID) -> AbstractContextManager[None]:
        """Hold the Experiment still while a rule is checked and the change written."""
        ...

    # Experiments ------------------------------------------------------------

    def add_experiment(self, experiment: Experiment) -> None: ...

    def get_experiment(self, experiment_id: UUID) -> Experiment | None:
        """The full Experiment, with its jury run and docking jobs, or None."""
        ...

    def list_experiments(
        self, *, archived: bool, include_building: bool
    ) -> list[ExperimentSummary]:
        """Archived or active Experiments, newest first; only ready ones unless asked."""
        ...

    def set_build_state(
        self,
        experiment_id: UUID,
        status: ExperimentStatus,
        stage: BuildStage | None,
        error: str | None,
    ) -> None: ...

    def save_build_result(
        self,
        experiment_id: UUID,
        targets: list[DiseaseTarget],
        network: NetworkGraph,
        candidates: list[Candidate],
    ) -> None: ...

    def set_archived_at(self, experiment_id: UUID, archived_at: datetime | None) -> None: ...

    # Model jury -------------------------------------------------------------

    def add_jury_run(self, experiment_id: UUID, run: JuryRun) -> None:
        """Insert the Experiment's one jury run; raise AlreadyExists for a second."""
        ...

    def update_jury_run(self, experiment_id: UUID, run: JuryRun) -> None: ...

    # Docking ----------------------------------------------------------------

    def add_dock_job(self, job: DockJob, cache_key: str) -> None:
        """Insert a job. In Postgres a second live job computing the same cache key
        violates `dock_jobs_cache_key_live_idx`; the caller then reuses the first."""
        ...

    def get_dock_job(self, job_id: UUID) -> DockJob | None: ...

    def update_dock_job(self, job: DockJob) -> None: ...

    def find_reusable_dock_job(self, cache_key: str) -> DockJob | None:
        """The job that computes this cache key itself and has not failed, if any."""
        ...

    def list_dock_jobs_cached_from(self, job_id: UUID) -> list[DockJob]:
        """Jobs that reuse the result of `job_id`."""
        ...
