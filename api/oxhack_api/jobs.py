"""Background work: building an Experiment, running the Model jury and docking.

Each job is a generator that writes its progress to the repo and yields between
steps. A runner drives the steps: `ThreadRunner` in the app, pausing
`OXHACK_FIXTURE_DELAY_MS` between them, and a stepping runner in tests, so each
state can be observed. Phase 4 moves the queue into the Postgres `jobs` table.
"""

from __future__ import annotations

import logging
import threading
from collections.abc import Callable, Generator, Iterator
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from typing import Protocol, TypeVar
from uuid import UUID

from .repo import Repo
from .schemas import BuildStage, DockJob, JuryRun
from .services.docking import DockingBackend, DockingFailed
from .services.jury import JurorStarted, JuryBackend, JuryEvent, JuryUnavailable
from .services.source import ExperimentSource, SourceError

log = logging.getLogger(__name__)

Job = Iterator[None]
Y = TypeVar("Y")
R = TypeVar("R")


def utcnow() -> datetime:
    return datetime.now(UTC)


class Runner(Protocol):
    def submit(self, job: Job) -> None:
        """Start the job in the background."""
        ...


class ThreadRunner:
    """Runs each job on a worker thread, pausing between its steps."""

    def __init__(self, delay_ms: int, threads: int) -> None:
        self._delay = delay_ms / 1000
        self._pool = ThreadPoolExecutor(max_workers=threads, thread_name_prefix="oxhack-job")
        self._stopping = threading.Event()

    def submit(self, job: Job) -> None:
        self._pool.submit(self._run, job)

    def _run(self, job: Job) -> None:
        try:
            for _ in job:
                if self._stopping.wait(self._delay):
                    return
        except Exception:
            log.exception("background job crashed")

    def shutdown(self) -> None:
        self._stopping.set()
        self._pool.shutdown(wait=True, cancel_futures=True)


def _each(steps: Generator[Y, None, R], handle: Callable[[Y], None]) -> Generator[None, None, R]:
    """Pass each item a backend yields to `handle`, yield once per item, return its result."""
    while True:
        try:
            item = next(steps)
        except StopIteration as finished:
            return finished.value
        handle(item)
        yield


# ---------------------------------------------------------------------------
# Experiment build: queued -> building (targets, ranking, evidence, saving) -> ready.
# ---------------------------------------------------------------------------


def build_experiment(repo: Repo, source: ExperimentSource, experiment_id: UUID) -> Job:
    experiment = repo.get_experiment(experiment_id)
    if experiment is None:
        return

    def enter(stage: BuildStage) -> None:
        repo.set_build_state(experiment_id, "building", stage, None)

    try:
        result = yield from _each(source.build(experiment.disease.id), enter)
        enter("saving")
        yield
        repo.save_build_result(experiment_id, result.targets, result.network, result.candidates)
        repo.set_build_state(experiment_id, "ready", None, None)
    except SourceError as exc:
        repo.set_build_state(experiment_id, "failed", None, str(exc))
    except Exception as exc:
        log.exception("Experiment %s failed to build", experiment_id)
        error = f"The Experiment could not be built ({type(exc).__name__})."
        repo.set_build_state(experiment_id, "failed", None, error)


# ---------------------------------------------------------------------------
# Model jury: queued -> running (juror by juror) -> done, or failed.
# ---------------------------------------------------------------------------


def run_jury(repo: Repo, backend: JuryBackend, experiment_id: UUID) -> Job:
    experiment = repo.get_experiment(experiment_id)
    if experiment is None or experiment.jury is None:
        return
    run = experiment.jury.model_copy(update={"status": "running", "started_at": utcnow()})
    repo.update_jury_run(experiment_id, run)
    yield

    def record(event: JuryEvent) -> None:
        nonlocal run
        if isinstance(event, JurorStarted):
            jurors = [
                j.model_copy(update={"status": "running"}) if j.model_id == event.model_id else j
                for j in run.jurors
            ]
            run = run.model_copy(update={"jurors": jurors})
        else:
            jurors = [event.juror if j.model_id == event.juror.model_id else j for j in run.jurors]
            run = run.model_copy(update={"jurors": jurors, "votes": [*run.votes, *event.votes]})
        repo.update_jury_run(experiment_id, run)

    try:
        outcome = yield from _each(backend.review(experiment), record)
        run = JuryRun.model_validate(
            {
                **run.model_dump(),
                "status": "done",
                "consensus": outcome.consensus.model_dump(),
                "agreement": outcome.agreement,
                "contested": outcome.contested,
                "finished_at": utcnow(),
            }
        )
    except JuryUnavailable as exc:
        run = _jury_failed(run, str(exc))
    except Exception as exc:
        log.exception("jury for Experiment %s crashed", experiment_id)
        run = _jury_failed(run, f"The Model jury review failed ({type(exc).__name__}).")
    repo.update_jury_run(experiment_id, run)


def _jury_failed(run: JuryRun, error: str) -> JuryRun:
    # A juror that never finished is reported as failed; no vote is invented for it.
    jurors = [
        j.model_copy(update={"status": "failed"}) if j.status in ("pending", "running") else j
        for j in run.jurors
    ]
    update = {"status": "failed", "error": error, "jurors": jurors, "finished_at": utcnow()}
    return run.model_copy(update=update)


# ---------------------------------------------------------------------------
# Docking: queued -> running -> done, or failed. Jobs reusing it follow along.
# ---------------------------------------------------------------------------


def run_dock(repo: Repo, backend: DockingBackend, job_id: UUID) -> Job:
    job = repo.get_dock_job(job_id)
    if job is None:
        return
    job = save_dock_job(repo, job.model_copy(update={"status": "running", "started_at": utcnow()}))
    yield
    try:
        scores = yield from _each(backend.dock(job), lambda _: None)
        update = {"status": "done", "scores": scores, "finished_at": utcnow()}
    except DockingFailed as exc:
        update = {"status": "failed", "error": str(exc), "finished_at": utcnow()}
    except Exception as exc:
        log.exception("docking job %s crashed", job_id)
        error = f"Docking crashed ({type(exc).__name__})."
        update = {"status": "failed", "error": error, "finished_at": utcnow()}
    save_dock_job(repo, job.model_copy(update=update))


def save_dock_job(repo: Repo, job: DockJob) -> DockJob:
    """Save a computing job and copy its state onto every job that reuses its result."""
    job = DockJob.model_validate(job.model_dump())
    repo.update_dock_job(job)
    shared = {
        "status": job.status,
        "scores": job.scores,
        "files": job.files,
        "error": job.error,
        "fixture": job.fixture,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
    }
    for follower in repo.list_dock_jobs_cached_from(job.id):
        repo.update_dock_job(follower.model_copy(update=shared))
    return job
