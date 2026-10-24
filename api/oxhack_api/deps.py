"""FastAPI dependencies. Tests swap pieces by passing them to `create_app`."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Request

from .jobs import Runner
from .repo import Repo
from .services.docking import DockingBackend
from .services.evaluation import EvaluationSource
from .services.experiments import ExperimentService
from .services.jury import JuryBackend
from .services.source import ExperimentSource
from .settings import Settings


@dataclass(frozen=True)
class Components:
    settings: Settings
    repo: Repo
    source: ExperimentSource
    jury: JuryBackend
    docking: DockingBackend
    evaluation: EvaluationSource
    runner: Runner


def get_components(request: Request) -> Components:
    components: Components = request.app.state.components
    return components


ComponentsDep = Annotated[Components, Depends(get_components)]


def get_service(components: ComponentsDep) -> ExperimentService:
    return ExperimentService(
        repo=components.repo,
        source=components.source,
        jury=components.jury,
        docking=components.docking,
        runner=components.runner,
    )


ServiceDep = Annotated[ExperimentService, Depends(get_service)]
