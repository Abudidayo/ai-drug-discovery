"""3D conformers for drawing small-molecule Candidates."""

from __future__ import annotations

from pathlib import Path

import httpx
import pytest
from conftest import SteppedRunner, ready_experiment
from fastapi.testclient import TestClient

from oxhack_api.services.molecules import PubChemMolecules

BARICITINIB_CID = 44205240


def test_conformer_of_a_small_molecule(client: TestClient) -> None:
    response = client.get(f"/api/molecules/{BARICITINIB_CID}/conformer")
    assert response.status_code == 200
    body = response.json()
    assert body["pubchem_cid"] == BARICITINIB_CID
    assert body["source_url"].startswith("https://pubchem.ncbi.nlm.nih.gov/")
    n = len(body["atoms"])
    assert n > 0
    assert body["bonds"]
    assert all(0 <= bond["a"] < n and 0 <= bond["b"] < n for bond in body["bonds"])


def test_unknown_compound_is_404_in_plain_words(client: TestClient) -> None:
    response = client.get("/api/molecules/1/conformer")
    assert response.status_code == 404
    assert response.json() == {"detail": "No 3D structure is available for PubChem compound 1."}


def test_every_small_molecule_candidate_has_a_conformer(
    client: TestClient, runner: SteppedRunner
) -> None:
    """Antibodies have no PubChem CID; every Candidate with one can be drawn."""
    experiment = ready_experiment(client, runner)
    cids = [c["pubchem_cid"] for c in experiment["candidates"] if c["pubchem_cid"]]
    assert cids
    for cid in cids:
        assert client.get(f"/api/molecules/{cid}/conformer").status_code == 200, cid


SDF = """baricitinib
  test

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END
$$$$
"""


def test_pubchem_source_fetches_once_and_remembers_missing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[str] = []

    def fake_get(url: str, timeout: float) -> httpx.Response:
        calls.append(url)
        if "/cid/7/" in url:
            return httpx.Response(200, text=SDF)
        return httpx.Response(404, text="no 3d")

    monkeypatch.setattr(httpx, "get", fake_get)
    source = PubChemMolecules(tmp_path)

    first = source.conformer(7)
    assert first is not None
    assert [a.element for a in first.atoms] == ["C", "N"]
    assert source.conformer(7) == first  # served from the cache
    assert source.conformer(8) is None
    assert source.conformer(8) is None  # the miss is remembered too
    assert len(calls) == 2


def test_pubchem_source_does_not_cache_network_failures(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def failing_get(url: str, timeout: float) -> httpx.Response:
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(httpx, "get", failing_get)
    assert PubChemMolecules(tmp_path).conformer(7) is None
    assert not list(tmp_path.iterdir())
