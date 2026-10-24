"""Frozen evaluation results (plan.md section 6). Fixture mode serves a made-up example."""

from __future__ import annotations

from pathlib import Path
from typing import Protocol

from ..schemas import Evaluation


class EvaluationSource(Protocol):
    def evaluation(self) -> Evaluation: ...


class FixtureEvaluation:
    """Implements `EvaluationSource` from `fixtures/evaluation.json`."""

    def __init__(self, fixtures_dir: Path) -> None:
        self._path = fixtures_dir / "evaluation.json"

    def evaluation(self) -> Evaluation:
        return Evaluation.model_validate_json(self._path.read_bytes())
