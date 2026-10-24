"""3D conformers for drawing small-molecule Candidates. Fixture mode reads files."""

from __future__ import annotations

from pathlib import Path
from typing import Protocol

from ..schemas import Conformer


class MoleculeSource(Protocol):
    def conformer(self, pubchem_cid: int) -> Conformer | None:
        """The conformer, or None when there is none (e.g. an antibody)."""
        ...


class FixtureMolecules:
    """Implements `MoleculeSource` from `fixtures/conformers/<cid>.json`."""

    def __init__(self, fixtures_dir: Path) -> None:
        self._dir = fixtures_dir / "conformers"

    def conformer(self, pubchem_cid: int) -> Conformer | None:
        path = self._dir / f"{pubchem_cid}.json"
        if not path.is_file():
            return None
        return Conformer.model_validate_json(path.read_bytes())
