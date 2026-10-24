"""Seeded, Target-count-matched pilot panels and source-grounded packets."""

import argparse
from collections import Counter
from hashlib import sha256
import json
from pathlib import Path
import random
import re
from uuid import NAMESPACE_URL, uuid5

import duckdb

from pipeline.disease_targets import disease_targets, rescore_associations
from pipeline.opentargets import OpenTargetsClient, URL
from pipeline.packets import EvidenceSources, OT_RELEASE, build_evidence_packet

SEED = 20261024
# IDs and labels are verified against the pinned catalogue when preparing packets.
DISEASES = [
    {"id": "MONDO_0008383", "area": "immune"},
    {"id": "MONDO_0005148", "area": "metabolic"},
    {"id": "MONDO_0005180", "area": "neurological"},
]
REGULATORS = {"FDA", "EMA Human Drugs", "PMDA", "DailyMed"}


def build_panels(universe, diseases, *, clinical_records, seed=SEED):
    """Draw true drugs first, then minimize absolute Target-count difference.

    Seeded random tie breakers operate on ID-sorted records. Decoys are unlabelled,
    not negative controls. Target count is a popularity proxy, not network degree.
    """
    rng = random.Random(seed)
    eligible = sorted((d for d in universe["drugs"] if d["targets"]
                       and REGULATORS.intersection(d["approval"]["sources"])),
                      key=lambda d: d["drug_id"])
    if len({d["drug_id"] for d in eligible}) != len(eligible):
        raise ValueError("Ambiguous duplicate parent IDs")
    panels = []
    for disease in diseases:
        if disease["id"] in {"MONDO_0009693", "MONDO_0100096"}:
            raise ValueError("Worked examples cannot be pilot Diseases")
        positives = [d for d in eligible if disease["id"] in d["approval"]["disease_ids"]]
        if not positives:
            raise ValueError(f"No mapped regulator-backed true drug for {disease['id']}")
        true = rng.choice(positives)
        count = len(true["targets"])
        decoys = [d for d in eligible if disease["id"] not in d["approval"]["disease_ids"]]
        rng.shuffle(decoys)
        decoys.sort(key=lambda d: abs(len(d["targets"]) - count))
        # Filter after assigning seeded priorities, so removing ineligible drugs
        # does not perturb the true drugs or the other panels' random draws.
        blocked = clinical_records[disease["id"]]
        decoys = [d for d in decoys if not set(d["source_chembl_ids"]).intersection(blocked)]
        if len(decoys) < 14:
            raise ValueError("Need 14 eligible decoys")
        def record(drug):
            return {"drug_id": drug["drug_id"], "name": drug["name"],
                    "target_count": len(drug["targets"]),
                    "target_count_difference": abs(len(drug["targets"]) - count),
                    "approval": drug["approval"]}
        panels.append({"disease": dict(disease), "true_drug": record(true),
                       "decoys": [record(d) for d in decoys[:14]], "seed": seed,
                       "matching": {"metric": "absolute mapped Target count difference",
                                    "ties": "seeded shuffle of ID-sorted eligible drugs",
                                    "exclusion": "any clinical_indication record across parent and included salts, at any stage",
                                    "eligible_true_drugs": len(positives),
                                    "eligible_decoys": len(decoys),
                                    "decoy_target_count_histogram": dict(Counter(len(d['targets']) for d in decoys[:14]))}})
    return {"seed": seed, "releases": universe["releases"],
            "universe_coverage": universe["coverage"], "panels": panels}


class CachedAssociations(OpenTargetsClient):
    """Use A1's complete-page checks, storing new requests only in the pilot."""
    def __init__(self, sources):
        self.sources = sources

    def execute(self, query, variables):
        payload = self.sources.request(URL, OT_RELEASE, body={"query": query, "variables": variables})
        return payload["data"]


class PilotSources(EvidenceSources):
    def __init__(self, data_dir, output, *, offline=False):
        super().__init__(output, offline=offline)
        self.existing = EvidenceSources(data_dir, offline=True)

    def request(self, url, release, **kwargs):
        try:
            return self.existing.request(url, release, **kwargs)
        except FileNotFoundError:
            return super().request(url, release, **kwargs)

    def table(self, dataset):
        return self.existing.table(dataset)

    def associations(self, disease_id):
        rows = CachedAssociations(self).associations(disease_id)
        return {r["target"]["id"]: r["scores"]["evidence_only"] for r in rescore_associations(rows)}


def packet_leakage(packet):
    """Conservative text screening; raw flags are retained for human inspection."""
    flags = []
    for item in packet["evidence"]:
        text = item["statement"]
        approval_templates = {
            f"Open Targets 26.09 records a regulator-backed approval{drug} from {r}."
            for r in REGULATORS
            for drug in ["", *[f" for {c['name']}" for c in packet["candidates"]]]
        }
        if item["kind"] == "approval" and text not in approval_templates:
            flags.append({"evidence_id": item["id"], "reason": "non-generic approval", "statement": text})
        if re.search(r"\b(trial|indication|indicated|approved (?:for|to treat))\b", text, re.I):
            flags.append({"evidence_id": item["id"], "reason": "indication/trial text", "statement": text})
    return flags


def seed_target_cache(data_dir, output):
    """Reuse A2 batch Target records by exact ChEMBL ID, with derivation provenance."""
    directory = output / "packets/http/chembl-37"
    for path in sorted((data_dir / "chembl-37").glob("*.json")):
        saved = json.loads(path.read_text())
        if saved.get("release") != "chembl-37":
            continue
        targets = saved.get("response", {}).get("targets", [])
        if not isinstance(targets, list):
            continue
        for target in targets:
            target_id = target.get("target_chembl_id", "")
            if not re.fullmatch(r"CHEMBL[0-9]+", target_id) or not {
                "target_components", "organism", "target_type"
            }.issubset(target):
                continue
            request = ["GET", f"https://www.ebi.ac.uk/chembl/api/data/target/{target_id}.json", None]
            key = sha256(json.dumps(request, sort_keys=True).encode()).hexdigest()
            destination = directory / (key + ".json")
            if destination.exists():
                continue
            directory.mkdir(parents=True, exist_ok=True)
            derived = {"release": "chembl-37", "retrieved_at": saved["retrieved_at"],
                       "request": request, "response": target,
                       "derived_from": {"path": str(path), "request": saved["request"],
                                        "sha256": sha256(path.read_bytes()).hexdigest()}}
            temporary = destination.with_suffix(".tmp")
            temporary.write_text(json.dumps(derived))
            temporary.replace(destination)


def prepare(data_dir="data", output="data/pilot", *, offline=False):
    data_dir, output = Path(data_dir), Path(output)
    output.mkdir(parents=True, exist_ok=True)
    universe_path = data_dir / "drug_targets.json"
    universe = json.loads(universe_path.read_text())
    seed_target_cache(data_dir, output)
    sources = PilotSources(data_dir, output, offline=offline)
    client = CachedAssociations(sources)
    targets = [disease_targets(client, d["id"]) for d in DISEASES]
    diseases = [{**d, "name": t["disease_name"]} for d, t in zip(DISEASES, targets)]
    indications = sources.table("clinical_indication")
    clinical_records = {
        d["id"]: {row[0] for row in indications.filter(
            duckdb.ColumnExpression("diseaseId") == d["id"]).select("drugId").fetchall()}
        for d in diseases
    }
    panels = build_panels(universe, diseases, clinical_records=clinical_records)
    panels["universe_sha256"] = sha256(universe_path.read_bytes()).hexdigest()
    (output / "panels.json").write_text(json.dumps(panels, indent=2) + "\n")
    checks = []
    for panel, target_set in zip(panels["panels"], targets):
        sources.unmapped.clear()
        disease = panel["disease"]
        ids = [panel["true_drug"]["drug_id"], *[d["drug_id"] for d in panel["decoys"]]]
        coverage = {}
        _, packet = build_evidence_packet(disease, ids, target_set, universe,
            experiment_id=str(uuid5(NAMESPACE_URL, f"oxhack-pilot/{SEED}/{disease['id']}")),
            shuffle_seed=SEED, sources=sources, coverage=coverage)
        flags = packet_leakage(packet)
        checks.append({"disease_id": disease["id"], "flags": flags, "coverage": coverage})
        (output / "packet_checks.json").write_text(json.dumps(checks, indent=2) + "\n")
        if flags:
            raise ValueError(f"Packet leakage screen failed: {disease['id']}; inspect source text")
        (output / f"targets-{disease['id']}.json").write_text(json.dumps(target_set, indent=2) + "\n")
        (output / f"packet-{disease['id']}.json").write_text(json.dumps(packet, indent=2) + "\n")
    (output / "packet_checks.json").write_text(json.dumps(checks, indent=2) + "\n")
    return panels


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()
    prepare(offline=args.offline)
