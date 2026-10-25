"""3D conformers for drawing small-molecule Candidates.

Fixture mode reads saved files. Live mode asks PubChem for a compound's 3D
conformer the first time it is drawn and keeps the answer, including "PubChem
has no 3D conformer for this compound", under the data directory.
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Protocol

import httpx

from ..schemas import Conformer

log = logging.getLogger(__name__)

SDF_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/SDF?record_type=3d"


class MoleculeSource(Protocol):
    def conformer(self, pubchem_cid: int) -> Conformer | None:
        """The conformer, or None when there is none (e.g. an antibody)."""
        ...


def parse_sdf(sdf: str) -> tuple[list[dict[str, object]], list[dict[str, int]]]:
    """Atoms and bonds from the first record of a V2000 SDF file."""
    lines = sdf.splitlines()
    n_atoms, n_bonds = int(lines[3][:3]), int(lines[3][3:6])
    atoms: list[dict[str, object]] = [
        {
            "element": line[31:34].strip(),
            "x": float(line[:10]),
            "y": float(line[10:20]),
            "z": float(line[20:30]),
        }
        for line in lines[4 : 4 + n_atoms]
    ]
    bonds = [
        {"a": int(line[:3]) - 1, "b": int(line[3:6]) - 1, "order": int(line[6:9])}
        for line in lines[4 + n_atoms : 4 + n_atoms + n_bonds]
    ]
    return atoms, bonds


class FixtureMolecules:
    """Implements `MoleculeSource` from `fixtures/conformers/<cid>.json`."""

    def __init__(self, fixtures_dir: Path) -> None:
        self._dir = fixtures_dir / "conformers"

    def conformer(self, pubchem_cid: int) -> Conformer | None:
        path = self._dir / f"{pubchem_cid}.json"
        if not path.is_file():
            return None
        return Conformer.model_validate_json(path.read_bytes())


class PubChemMolecules:
    """Implements `MoleculeSource` from PubChem, caching each answer in `cache_dir`.

    A compound PubChem has no 3D conformer for (404) is remembered as a `.none`
    marker so it isn't asked again. Network failures are not cached: the next
    request tries again.
    """

    def __init__(
        self, cache_dir: Path, *, fallback: MoleculeSource | None = None, timeout: float = 20.0
    ) -> None:
        self._dir = cache_dir
        self._fallback = fallback
        self._timeout = timeout
        self._lock = threading.Lock()

    def conformer(self, pubchem_cid: int) -> Conformer | None:
        if self._fallback is not None and (found := self._fallback.conformer(pubchem_cid)):
            return found
        path, missing = self._dir / f"{pubchem_cid}.json", self._dir / f"{pubchem_cid}.none"
        if path.is_file():
            return Conformer.model_validate_json(path.read_bytes())
        if missing.is_file():
            return None
        url = SDF_URL.format(cid=pubchem_cid)
        try:
            response = httpx.get(url, timeout=self._timeout)
        except httpx.HTTPError as error:
            log.warning("PubChem conformer %s unavailable: %s", pubchem_cid, error)
            return None
        with self._lock:
            self._dir.mkdir(parents=True, exist_ok=True)
            if response.status_code == 404:
                missing.touch()
                return None
            if response.status_code != 200:
                log.warning("PubChem conformer %s: HTTP %s", pubchem_cid, response.status_code)
                return None
            atoms, bonds = parse_sdf(response.text)
            conformer = Conformer.model_validate(
                {"pubchem_cid": pubchem_cid, "source_url": url, "atoms": atoms, "bonds": bonds}
            )
            path.write_text(json.dumps(conformer.model_dump(mode="json"), separators=(",", ":")))
            return conformer
