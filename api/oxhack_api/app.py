"""The FastAPI app. Run with `uv run uvicorn oxhack_api.app:app --reload`."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.routing import APIRoute

from . import __version__
from .deps import Components
from .errors import install_error_handlers
from .jobs import Runner, ThreadRunner
from .repo import MemoryRepo, Repo
from .routes.api import router
from .services.docking import DockingBackend, FixtureDocking
from .services.evaluation import EvaluationSource, FixtureEvaluation
from .services.jury import FixtureJury, JuryBackend
from .services.source import ExperimentSource, FixtureSource
from .settings import Settings


def build_components(
    settings: Settings,
    *,
    repo: Repo | None = None,
    source: ExperimentSource | None = None,
    jury: JuryBackend | None = None,
    docking: DockingBackend | None = None,
    evaluation: EvaluationSource | None = None,
    runner: Runner | None = None,
) -> Components:
    """Fixture-mode pieces by default; any piece can be replaced."""
    fixtures = settings.fixtures_dir
    docking = docking or FixtureDocking(fixtures)
    repo = repo or MemoryRepo()
    for job, key in docking.seed_jobs():
        if repo.get_dock_job(job.id) is None:
            repo.add_dock_job(job, key)
    return Components(
        settings=settings,
        repo=repo,
        source=source or FixtureSource(fixtures),
        jury=jury or FixtureJury(fixtures),
        docking=docking,
        evaluation=evaluation or FixtureEvaluation(fixtures),
        runner=runner or ThreadRunner(settings.fixture_delay_ms, settings.worker_threads),
    )


def _operation_id(route: APIRoute) -> str:
    return route.name


def create_app(settings: Settings | None = None, components: Components | None = None) -> FastAPI:
    components = components or build_components(settings or Settings())

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncGenerator[None]:
        yield
        if isinstance(components.runner, ThreadRunner):
            components.runner.shutdown()

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
    app.state.components = components
    install_error_handlers(app)
    app.include_router(router)
    return app


app = create_app()
