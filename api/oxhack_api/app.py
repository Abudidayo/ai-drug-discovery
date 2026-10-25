"""The FastAPI app. Run with `uv run uvicorn oxhack_api.app:app --reload`."""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.routing import APIRoute

from . import __version__
from .deps import Components
from .errors import install_error_handlers
from .jobs import JobFactory, Runner, ThreadRunner
from .jobs_pg import PostgresQueue, PostgresWorker
from .repo import AlreadyExists, MemoryRepo, Repo
from .repo.postgres import PostgresRepo
from .routes.api import router
from .services.docking import DockingBackend, FixtureDocking
from .services.evaluation import EvaluationSource, FixtureEvaluation
from .services.jury import FixtureJury, JuryBackend
from .services.molecules import FixtureMolecules, MoleculeSource
from .services.source import ExperimentSource, FixtureSource
from .settings import Settings

log = logging.getLogger(__name__)


def open_repo(settings: Settings) -> Repo:
    """The repo the settings name. Postgres must be migrated already (`uv run db/migrate.py`)."""
    if settings.repo == "memory":
        return MemoryRepo()
    assert settings.database_url is not None  # Settings refuses postgres without one
    return PostgresRepo.connect(settings.database_url, max_connections=settings.database_pool_size)


def build_components(
    settings: Settings,
    *,
    repo: Repo | None = None,
    source: ExperimentSource | None = None,
    jury: JuryBackend | None = None,
    docking: DockingBackend | None = None,
    evaluation: EvaluationSource | None = None,
    molecules: MoleculeSource | None = None,
    runner: Runner | None = None,
) -> Components:
    """Fixture-mode pieces by default; any piece can be replaced. Opens the database
    when the settings say postgres and no repo is given."""
    fixtures = settings.fixtures_dir
    docking = docking or FixtureDocking(fixtures)
    source = source or FixtureSource(fixtures)
    jury = jury or FixtureJury(fixtures)
    repo = repo or open_repo(settings)
    seed_dock_jobs(repo, docking)
    jobs = JobFactory(repo=repo, source=source, jury=jury, docking=docking)
    if runner is None:
        if isinstance(repo, PostgresRepo):
            runner = PostgresQueue(repo)
        else:
            runner = ThreadRunner(jobs, settings.fixture_delay_ms, settings.worker_threads)
    return Components(
        settings=settings,
        repo=repo,
        source=source,
        jury=jury,
        docking=docking,
        evaluation=evaluation or FixtureEvaluation(fixtures),
        molecules=molecules or FixtureMolecules(fixtures),
        runner=runner,
        jobs=jobs,
    )


def seed_dock_jobs(repo: Repo, docking: DockingBackend) -> None:
    """Save the docking results computed ahead of time. A saved one that differs (its
    files were prepared again, say) is refreshed, with the jobs that reuse it."""
    for job, inputs in docking.seed_jobs():
        saved = repo.get_dock_job(job.id)
        if saved is None:
            try:
                repo.add_dock_job(job, inputs)
            except AlreadyExists:
                # Another process (the API or the worker) saved it first, or another job
                # already computes the same inputs.
                log.info("docking job %s is already saved", job.id)
        elif saved != job:
            log.info("refreshing docking job %s from the fixtures", job.id)
            shared = {"scores": job.scores, "files": job.files, "fixture": job.fixture}
            with repo.transaction():
                repo.update_dock_job(job)
                for follower in repo.list_dock_jobs_cached_from(job.id):
                    repo.update_dock_job(follower.model_copy(update=shared))


def start_inprocess_worker(components: Components) -> PostgresWorker | None:
    """Run the Postgres job worker in this process when the settings ask for it."""
    if not (
        components.settings.inprocess_worker
        and isinstance(components.repo, PostgresRepo)
        and isinstance(components.runner, PostgresQueue)
    ):
        return None
    worker = PostgresWorker.from_settings(components.repo, components.jobs, components.settings)
    worker.start()
    return worker


def _operation_id(route: APIRoute) -> str:
    return route.name


def create_app(settings: Settings | None = None, components: Components | None = None) -> FastAPI:
    """The app. Without `components`, they are built from `settings` (or the
    environment) when the app starts, so importing this module connects to nothing."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
        current = components or build_components(settings or Settings())
        app.state.components = current
        worker = start_inprocess_worker(current)
        try:
            yield
        finally:
            if worker is not None:
                worker.stop()
            if components is None:
                current.close()
            elif isinstance(current.runner, ThreadRunner):
                current.runner.shutdown()

    app = FastAPI(
        title="OxHack '26 drug repurposing API",
        version=__version__,
        description=(
            "Educational research tool. Candidate rankings, Model jury assessments and binding "
            "poses are hypotheses based on public records and computational methods. They may "
            "be wrong or incomplete. They are not medical advice."
        ),
        lifespan=lifespan,
        generate_unique_id_function=_operation_id,
    )
    if components is not None:
        app.state.components = components
    install_error_handlers(app)
    app.include_router(router)
    return app


app = create_app()
