"""Offline input checks only; imports Zaid's loaders without scoring anything."""

import hashlib
import json
from pathlib import Path
import sys
import unittest

BUNDLE = Path(__file__).resolve().parent
ROOT = BUNDLE.parents[1]
ZAID = ROOT.parent / "zaid-ro"
sys.dont_write_bytecode = True
sys.path.insert(0, str(ZAID))

from ranking.data import APPROVAL_SOURCES, DISEASE_ID, load_disease, load_drugs
from ranking.references import parse_references
from ranking.shortlist_comparison import verify_implementation


def read(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class InputTests(unittest.TestCase):
    def test_cases(self):
        cases = read(BUNDLE / "cases.json")
        published = read(ROOT / "results/experiment_b_replication/results.json")
        ids = [c["disease_id"] for c in cases["cases"]]
        self.assertEqual(cases["format_version"], 1)
        self.assertTrue(cases["cohort_id"])
        self.assertEqual(len(ids), 14)
        self.assertEqual(len(set(ids)), 14)
        self.assertEqual(ids, [p["disease"]["id"] for p in published["panels"]])
        self.assertEqual(ids, [r[0] for r in published["selection"]["selected"]])
        for case in cases["cases"]:
            self.assertIsNotNone(DISEASE_ID.fullmatch(case["disease_id"]))
            relative = Path(case["targets_file"])
            self.assertFalse(relative.is_absolute())
            self.assertTrue((BUNDLE / "targets" / relative).resolve().is_relative_to(BUNDLE / "targets"))

    def test_targets_with_zaid_loader(self):
        frozen = read(BUNDLE / "replication.preregistered.json")["declaration"]["inputs_sha256"]
        fixture = read(ROOT / "fixtures/disease_targets.json")
        for case in read(BUNDLE / "cases.json")["cases"]:
            with self.subTest(disease=case["disease_id"]):
                path = BUNDLE / "targets" / case["targets_file"]
                original = ROOT / "data/experiment_b_replication" / path.name
                self.assertEqual(path.read_bytes(), original.read_bytes())
                self.assertEqual(sha(path), frozen[str(original.relative_to(ROOT))])
                payload = read(path)
                self.assertEqual(set(payload), set(fixture))
                self.assertTrue(all(set(t) == set(fixture["targets"][0]) for t in payload["targets"]))
                disease = load_disease(path, case["disease_id"])
                self.assertEqual(disease.release, "opentargets-26.09")
                self.assertEqual(len(disease.targets.rows), 50)
                self.assertEqual(disease.targets.exclusions, [])

    def test_drugs_with_zaid_loader(self):
        path = ROOT / "data/drug_targets.json"
        frozen = read(BUNDLE / "replication.preregistered.json")["declaration"]["inputs_sha256"]
        self.assertEqual(sha(path), frozen["data/drug_targets.json"])
        pool = load_drugs(path)
        self.assertEqual(len(pool.drugs), len(read(path)["drugs"]))
        self.assertEqual(pool.excluded, [])
        self.assertEqual(pool.releases, ["opentargets-26.09", "chembl-37"])

    def test_references_with_zaid_loader(self):
        refs = read(BUNDLE / "references.json")
        known = parse_references(refs)
        source = ROOT / "data/drug_targets.json"
        drugs = read(source)
        self.assertEqual(refs["releases"], drugs["releases"])
        self.assertEqual(refs["source_files"][0]["sha256"], sha(source))
        self.assertEqual(list(known), [c["disease_id"] for c in read(BUNDLE / "cases.json")["cases"]])
        for case in refs["cases"]:
            identifier = case["disease_id"]
            expected = {d["drug_id"] for d in drugs["drugs"]
                        if identifier in d["approval"]["disease_ids"]
                        and APPROVAL_SOURCES.intersection(d["approval"]["sources"])}
            self.assertEqual(known[identifier], expected)
            self.assertEqual(len(case["known_candidate_ids"]), len(expected))
            self.assertEqual({d["candidate_id"] for d in case["approved_drugs"]}, expected)
        expected_overrides = [
            {"candidate_id": d["drug_id"], **o, "regulator": "FDA", "in_cohort": o["disease_id"] in known}
            for d in drugs["drugs"] for o in d["approval"].get("overrides", [])]
        self.assertEqual(refs["override_inventory"], expected_overrides)
        self.assertEqual(refs["unmapped_count"], 0)

    def test_protocol_and_freeze(self):
        published = ROOT / "results/experiment_b_replication"
        for name in ("protocol.md", "protocol_frozen.json"):
            self.assertEqual((BUNDLE / name).read_bytes(), (published / name).read_bytes())
        self.assertEqual((BUNDLE / "replication.preregistered.json").read_bytes(),
                         (published / "preregistered.json").read_bytes())
        self.assertEqual(sha(BUNDLE / "protocol.md"), read(BUNDLE / "protocol_frozen.json")["protocol_sha256"])

    def test_local_implementation_seal(self):
        seal = verify_implementation(BUNDLE / "implementation.local.json")
        self.assertEqual(seal["settings"]["expected_case_count"], 14)
        self.assertEqual(Path(sys.modules["ranking"].__file__).resolve(), ZAID / "ranking/__init__.py")

    def test_manifest_and_pinned_graph(self):
        manifest = read(BUNDLE / "manifest.json")
        self.assertEqual(set(manifest["files"]),
                         {str(p.relative_to(BUNDLE)) for p in BUNDLE.rglob("*")
                          if p.is_file() and p.name != "manifest.json"})
        for record in manifest["source_files"]:
            self.assertEqual(sha(ROOT / record["path"]), record["sha256"])
        for name, record in manifest["files"].items():
            self.assertEqual(sha(BUNDLE / name), record["sha256"])
            self.assertEqual((BUNDLE / name).stat().st_size, record["bytes"])
        frozen = read(BUNDLE / "replication.preregistered.json")["declaration"]["inputs_sha256"]
        for name, record in manifest["artifacts"]["files"].items():
            self.assertEqual(sha(ROOT / name), frozen[name])
            self.assertEqual(record["sha256"], frozen[name])
        self.assertEqual(manifest["reference_pairs"], sum(len(s) for s in parse_references(read(BUNDLE / "references.json")).values()))


if __name__ == "__main__":
    unittest.main(verbosity=2)
