from copy import deepcopy
import json
from pathlib import Path

import pytest

from pipeline.panels import build_panels, packet_leakage


def universe():
    return {"releases": ["opentargets-26.09", "chembl-37"], "coverage": {}, "drugs": [
        {"drug_id": f"CHEMBL{i}", "name": f"display {i}",
         "source_chembl_ids": [f"CHEMBL{i}"],
         "targets": [{"target_id": f"ENSG{j:011d}"} for j in range(1 if i < 18 else 3)],
         "approval": {"sources": ["FDA"], "disease_ids": ["MONDO_1"] if i == 1 else ["MONDO_2"]}}
        for i in range(1, 24)]}


def test_seeded_panel_eligibility_and_nearest_matching():
    source = universe()
    diseases = [{"id": "MONDO_1", "name": "Disease", "area": "area"}]
    result = build_panels(source, diseases, clinical_records={"MONDO_1": set()}, seed=42)
    assert result == build_panels(source, diseases, clinical_records={"MONDO_1": set()}, seed=42)
    source["drugs"].reverse()
    assert result == build_panels(source, diseases, clinical_records={"MONDO_1": set()}, seed=42)
    panel = result["panels"][0]
    assert panel["true_drug"]["drug_id"] == "CHEMBL1"
    assert len(panel["decoys"]) == len({d['drug_id'] for d in panel['decoys']}) == 14
    assert all(d["target_count_difference"] == 0 for d in panel["decoys"])
    assert all("MONDO_1" not in d["approval"]["disease_ids"] for d in panel["decoys"])


def test_excludes_unmapped_unapproved_and_worked_examples():
    source = universe()
    source["drugs"][0]["targets"] = []
    with pytest.raises(ValueError, match="No mapped"):
        build_panels(source, [{"id": "MONDO_1"}], clinical_records={"MONDO_1": set()})
    source = universe()
    source["drugs"][0]["approval"]["sources"] = ["ATC"]
    with pytest.raises(ValueError, match="No mapped"):
        build_panels(source, [{"id": "MONDO_1"}], clinical_records={"MONDO_1": set()})
    with pytest.raises(ValueError, match="Worked examples"):
        build_panels(universe(), [{"id": "MONDO_0009693"}], clinical_records={"MONDO_0009693": set()})
    with pytest.raises(ValueError, match="14 eligible"):
        short = universe()
        short["drugs"] = short["drugs"][:14]
        build_panels(short, [{"id": "MONDO_1"}], clinical_records={"MONDO_1": set()})


def test_packet_indication_screen():
    packet = json.loads((Path(__file__).resolve().parents[2] / "fixtures/evidence_packet.json").read_text())
    assert packet_leakage(packet) == []
    leaked = deepcopy(packet)
    leaked["evidence"][0]["statement"] = "Approved for the panel's Disease in a clinical trial."
    assert packet_leakage(leaked)


def test_reuses_batch_target_cache_by_id_with_provenance(tmp_path):
    from pipeline.panels import PilotSources, seed_target_cache
    data, output = tmp_path / "data", tmp_path / "pilot"
    cache = data / "chembl-37"
    cache.mkdir(parents=True)
    target = {"target_chembl_id": "CHEMBL123", "organism": "Homo sapiens",
              "target_type": "SINGLE PROTEIN", "target_components": [{"accession": "P12345"}]}
    (cache / "batch.json").write_text(json.dumps({"release": "chembl-37", "retrieved_at": "2026-10-24",
        "request": {"url": "https://www.ebi.ac.uk/chembl/api/data/target.json", "params": {}},
        "response": {"targets": [target]}}))
    (cache / "status.json").write_text(json.dumps({"release": "chembl-37", "response": {"targets": 123}}))
    seed_target_cache(data, output)
    sources = PilotSources(data, output, offline=True)
    assert sources.chembl("target/CHEMBL123.json") == target
    saved_path = next((output / "packets/http/chembl-37").glob("*.json"))
    saved = json.loads(saved_path.read_text())
    assert saved["derived_from"]["path"] == str(cache / "batch.json")
    first = saved_path.read_bytes()
    seed_target_cache(data, output)
    assert saved_path.read_bytes() == first


def test_removes_only_affected_decoys_including_records_on_salts():
    source = universe()
    diseases = [{"id": "MONDO_1", "name": "Disease"}]
    old = build_panels(source, diseases, clinical_records={"MONDO_1": set()}, seed=42)['panels'][0]
    removed = old['decoys'][0]['drug_id']
    next(d for d in source['drugs'] if d['drug_id'] == removed)['source_chembl_ids'].append('CHEMBL9999')
    new = build_panels(source, diseases, clinical_records={"MONDO_1": {'CHEMBL9999'}}, seed=42)['panels'][0]
    assert new['true_drug'] == old['true_drug']
    old_ids = {d['drug_id'] for d in old['decoys']}
    new_ids = {d['drug_id'] for d in new['decoys']}
    assert old_ids - new_ids == {removed}
    assert len(new_ids - old_ids) == 1
    assert all(d['target_count_difference'] == 0 for d in new['decoys'])


def test_v2_requires_seven_true_top50_decoys_and_no_records():
    from pipeline.panels import build_v2_panel
    source = universe()
    # Synthetic mechanical test: source IDs and counts are not scientific results.
    for i, d in enumerate(source['drugs']):
        d['targets'] = [{'target_id': f'ENSG{(1 if i < 12 else 2):011d}'}]
    true = source['drugs'][0]
    disease = {'id': 'MONDO_1', 'name': 'Test disease'}
    top = {'targets': [{'target_id': 'ENSG00000000001'}]}
    p = build_v2_panel(source, disease, true, top, {'ENSG00000000001': .8}, blocked={'CHEMBL2'}, seed=42)
    assert len(p['decoys']) == 14 and sum(d['plausible'] for d in p['decoys']) >= 7
    assert all(d['target_count_difference'] == 0 and d['drug_id'] != 'CHEMBL2' for d in p['decoys'])
    assert p == build_v2_panel(source, disease, true, top, {'ENSG00000000001': .8}, blocked={'CHEMBL2'}, seed=42)
    with pytest.raises(ValueError, match='seven'):
        build_v2_panel(source, disease, true, {'targets': []}, {}, blocked=set(), seed=42)


def test_v2_missing_parent_hierarchy_requires_an_explicit_source_link(monkeypatch):
    from pipeline.panels import V2Sources, PilotSources
    recorded = {'molecule_chembl_id': 'CHEMBL3707224', 'molecule_hierarchy': None}
    monkeypatch.setattr(PilotSources, 'chembl', lambda self, endpoint: recorded)
    source = V2Sources(offline=True)
    assert source.chembl('molecule/CHEMBL3707224.json')['molecule_hierarchy'] is None
    # The recorded bromide row explicitly names CHEMBL3707224 as its parent.
    source.parent_links['CHEMBL3707224'] = ['CHEMBL3707223']
    assert source.chembl('molecule/CHEMBL3707224.json')['molecule_hierarchy'] == {'parent_chembl_id': 'CHEMBL3707224'}
    assert recorded['molecule_hierarchy'] is None
