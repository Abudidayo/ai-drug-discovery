"""3D conformers for drawing small-molecule Candidates."""

from __future__ import annotations

from conftest import SteppedRunner, ready_experiment
from fastapi.testclient import TestClient

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
