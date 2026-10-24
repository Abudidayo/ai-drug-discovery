"""The docking seam and its fixture mode.

The live backend (phase 7) hands jobs to the Vina worker through `dock_jobs`.
The fixture backend serves the prepared structure set from
`fixtures/structures.json` and made-up scores from `fixtures/docking.json`.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Generator
from datetime import datetime
from pathlib import Path
from typing import Literal, Protocol
from uuid import UUID

from pydantic import Field

from ..schemas import (
    Candidate,
    CandidateId,
    DockJob,
    DockSettings,
    Model,
    PoseScore,
    Structure,
    StructureId,
)

DockSteps = Generator[None, None, list[PoseScore]]
"""Yields while the job runs and returns the pose scores."""


class DockingFailed(Exception):
    """The docking run failed. The message is the tail of its log."""


class DockingBackend(Protocol):
    fixture: bool
    """True when results are made up rather than computed."""

    def structures(self) -> list[Structure]: ...

    def structure(self, structure_id: str) -> Structure | None: ...

    def settings_for(self, structure: Structure) -> DockSettings: ...

    def ligand_smiles(self, candidate_id: str) -> str | None:
        """The SMILES docked for a drug, or None when it cannot be docked."""
        ...

    def seed_jobs(self) -> list[tuple[DockJob, str]]:
        """Results computed ahead of time (docs/build-reference.md C9), with cache keys."""
        ...

    def dock(self, job: DockJob) -> DockSteps: ...


def cache_key(structure: Structure, smiles: str, settings: DockSettings) -> str:
    """SHA-256 of everything that decides a docking result (build-reference C7)."""
    material = {
        "pdb_id": structure.pdb_id,
        "chain": structure.chain,
        "smiles": smiles,
        "box_center": list(settings.box.center),
        "box_size": list(settings.box.size),
        "engine": settings.engine,
        "engine_version": settings.engine_version,
        "exhaustiveness": settings.exhaustiveness,
        "seed": settings.seed,
    }
    return hashlib.sha256(json.dumps(material, sort_keys=True).encode()).hexdigest()


def unsupported_reason(
    candidate: Candidate, structure: Structure, smiles: str | None
) -> str | None:
    """Why this Candidate cannot be docked into this structure, or None if it can."""
    name = candidate.name.capitalize()
    if structure.target_id not in {target.id for target in candidate.targets}:
        return (
            f"{name} does not act on {structure.target_symbol}, the protein in "
            f"{structure.pdb_id}. A structure is only used for the protein it contains."
        )
    if not candidate.dockable or smiles is None:
        return f"{name} cannot be docked: only small molecules with a known structure can."
    return None


class _ControlFixture(Model):
    id: UUID
    kind: Literal["redock_control", "negative_control"]
    structure_id: StructureId
    candidate_id: CandidateId
    control_rmsd: float | None
    scores: list[float]


class _DockingSettingsFixture(Model):
    engine: Literal["vina"]
    engine_version: str
    exhaustiveness: int
    seed: int
    n_poses: int
    meeko_version: str | None
    rdkit_version: str | None


class DockingFixture(Model):
    """The file `fixtures/docking.json`."""

    fixture_note: str
    settings: _DockingSettingsFixture
    smiles: dict[CandidateId, str] = Field(description="Ligand SMILES from ChEMBL, by drug.")
    controls: list[_ControlFixture]
    top_scores: dict[StructureId, dict[CandidateId, float]] = Field(
        description="Made-up best pose score for each supported pair."
    )


class FixtureDocking:
    """Implements `DockingBackend` with saved structures and made-up scores."""

    fixture = True
    seeded_at = datetime.fromisoformat("2026-10-24T12:00:00+00:00")

    def __init__(self, fixtures_dir: Path) -> None:
        listing = json.loads((fixtures_dir / "structures.json").read_text())
        self._structures = [Structure.model_validate(s) for s in listing["structures"]]
        self._data = DockingFixture.model_validate_json((fixtures_dir / "docking.json").read_text())

    def structures(self) -> list[Structure]:
        return [structure.model_copy(deep=True) for structure in self._structures]

    def structure(self, structure_id: str) -> Structure | None:
        return next((s for s in self._structures if s.id == structure_id), None)

    def settings_for(self, structure: Structure) -> DockSettings:
        return DockSettings(**self._data.settings.model_dump(), box=structure.box)

    def ligand_smiles(self, candidate_id: str) -> str | None:
        return self._data.smiles.get(candidate_id)

    def seed_jobs(self) -> list[tuple[DockJob, str]]:
        seeded: list[tuple[DockJob, str]] = []
        for control in self._data.controls:
            structure = self.structure(control.structure_id)
            smiles = self.ligand_smiles(control.candidate_id)
            if structure is None or smiles is None:
                raise ValueError(f"control {control.id} names an unknown structure or ligand")
            settings = self.settings_for(structure)
            job = DockJob(
                id=control.id,
                kind=control.kind,
                status="done",
                experiment_id=None,
                candidate_id=control.candidate_id,
                target_id=structure.target_id,
                structure_id=structure.id,
                settings=settings,
                scores=[PoseScore(pose=i, score=s) for i, s in enumerate(control.scores, 1)],
                files=None,
                control_rmsd=control.control_rmsd,
                error=None,
                cached_from=None,
                fixture=True,
                created_at=self.seeded_at,
                started_at=self.seeded_at,
                finished_at=self.seeded_at,
            )
            seeded.append((job, cache_key(structure, smiles, settings)))
        return seeded

    def dock(self, job: DockJob) -> DockSteps:
        yield
        top = self._data.top_scores.get(job.structure_id, {}).get(job.candidate_id)
        if top is None:
            raise DockingFailed(f"No fixture result for {job.candidate_id} in {job.structure_id}.")
        # Made-up poses that worsen steadily from the best one.
        steps = [0.0, 0.4, 0.7, 1.1, 1.3, 1.6, 1.9, 2.1, 2.4]
        n_poses = job.settings.n_poses
        return [
            PoseScore(pose=i + 1, score=round(top + steps[i % len(steps)], 2))
            for i in range(n_poses)
        ]
