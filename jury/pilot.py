"""Frozen single-model pilot; at most 25 requests, including all retries.

Prepare: python -m pipeline.panels
Run: python -m jury.pilot --live
Re-score without network: python -m jury.pilot
"""

import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import random
import re
from statistics import median
from time import perf_counter

from jury.client import (CortexModel, ModelReply, RESPONSE_FORMAT, build_prompt,
                         consensus, validate_packet, validate_reply)
from pipeline.panels import SEED

MODELS = ["claude-opus-5-5", "claude-sonnet-5", "openai-gpt-5.4", "glm-5.3", "kimi-k3"]
JURY = ["claude-opus-5-5", "openai-gpt-5.4", "glm-5.3"]
MAX_CALLS = 25


def write_json(path, value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n")
    temporary.replace(path)


def freeze(output):
    paths = [output / "panels.json", *sorted(output.glob("packet-*.json"))]
    if len(paths) != 4:
        raise ValueError("Prepare exactly three packets first")
    declaration = {
        "models": MODELS, "jury": JURY, "seed": SEED, "max_live_calls": MAX_CALLS,
        "max_attempts_per_run": 2, "temperature": 0, "anthropic_temperature": "omitted/provider default", "anthropic_max_tokens": 12000,
        "revision": "corrected-validator-and-no-clinical-record-decoys",
        "validator_sha256": sha256(Path(__file__).with_name("client.py").read_bytes()).hexdigest(),
        "reasoning_effort": json.loads(os.environ.get("SNOWFLAKE_REASONING_EFFORT", "{}")),
        "selection_priority": ["valid reply rate", "manual citation audit", "Hits@5 then MRR", "latency and credit cost"],
        "manual_audit": "6 randomly sampled rationale sentences carrying nonempty review-level citations per model, seed 20261024; no replacement; citation entailment remains for Jessica",
        "retry_policy": "First all 15 requests in Disease-panel then model order; retry first 10 failures once in the same order. No SDK retries. Reserve each call durably before sending.",
        "metrics": "Hits@5 and reciprocal rank averaged over all 3 Diseases; failed/invalid ballots score zero. Also report conditional metrics. Valid rate is valid runs/3, attempt validity separately. Median latency includes retries. Tokens include invalid attempts; missing usage is not zero.",
        "jury_policy": "Borda and Kendall W from the same runs; score a Disease only with all three valid jurors; otherwise zero recovery and null W. Competition ranks for Borda ties.",
        "leakage_policy": "Conservative sentence screen: rationale contains Disease name or frozen alias and affirmative approval/indication/use wording; retain all matches for manual review, including invalid attempts. Count valid-final and all-attempt matches separately. Cannot prove absence of implicit model knowledge.",
        "leakage_aliases": {"MONDO_0008383": ["rheumatoid arthritis", "RA"],
                            "MONDO_0005148": ["type 2 diabetes", "type ii diabetes", "T2D", "T2DM"],
                            "MONDO_0005180": ["parkinson", "PD"]},
        "prompt_suffix": "Keep each rationale and objection concise (one short sentence each). Avoid quoting numeric measurements. Obey decision order across ranks.",
        "inputs_sha256": {p.name: sha256(p.read_bytes()).hexdigest() for p in paths},
        "interpretation": "Retrospective known-relationship recovery; unlabelled decoys; Target-count matching only; pilot Diseases excluded from final test; no clinical validation.",
    }
    path = output / "preregistered.json"
    if path.exists():
        if json.loads(path.read_text())["declaration"] != declaration:
            raise ValueError("Frozen pilot settings/inputs changed")
    else:
        write_json(path, {"frozen_at": datetime.now(timezone.utc).isoformat(), "declaration": declaration})
    return declaration


def call_model(client, model, prompt):
    # Fifteen complete reviews need more room than the four-Candidate demo cap.
    if model.startswith("claude-"):
        response = client.client.post("/messages", cast_to=dict, body={
            "model": model, "max_tokens": 12000,
            "messages": [{"role": "user", "content": prompt}],
            "output_config": {"format": {"type": "json_schema", "schema": RESPONSE_FORMAT["json_schema"]["schema"]}},
        }, options={"headers": {"anthropic-version": "2023-06-01"}})
        usage = response.get("usage") or {}
        return ModelReply("".join(b["text"] for b in response.get("content", []) if b.get("type") == "text"),
                          usage.get("input_tokens"), usage.get("output_tokens"))
    return client(model, prompt, 0)


def run_pilot(output, model_call, declaration):
    """Single writer; an interrupted reservation still consumes its budget slot."""
    output = Path(output)
    panels = json.loads((output / "panels.json").read_text())["panels"]
    directory = output / "runs"
    directory.mkdir(exist_ok=True)
    jobs = []
    for panel_index, panel in enumerate(panels):
        disease_id = panel["disease"]["id"]
        packet = json.loads((output / f"packet-{disease_id}.json").read_text())
        validate_packet(packet)
        for model_index, model in enumerate(MODELS):
            path = directory / f"{disease_id}-{model}.json"
            order = [c["label"] for c in packet["candidates"]]
            random.Random(SEED + panel_index * len(MODELS) + model_index).shuffle(order)
            record = json.loads(path.read_text()) if path.exists() else {
                "disease_id": disease_id, "model": model, "presented_order": order, "attempts": []}
            jobs.append((path, packet, record))
    used = sum(len(r["attempts"]) for _, _, r in jobs)
    if used > MAX_CALLS:
        raise ValueError("Existing journal exceeds live budget")
    for attempt_number in (1, 2):
        for path, packet, record in jobs:
            if used >= MAX_CALLS:
                return
            if (len(record["attempts"]) != attempt_number - 1
                    or any(a["status"] == "valid" for a in record["attempts"])):
                continue
            prompt = build_prompt(packet, record["presented_order"]) + "\n" + declaration["prompt_suffix"]
            attempt = {"attempt": attempt_number, "status": "reserved", "raw_output": None,
                       "reviews": None, "validation": None, "input_tokens": None,
                       "output_tokens": None, "latency_ms": None,
                       "started_at": datetime.now(timezone.utc).isoformat(),
                       "prompt_sha256": sha256(prompt.encode()).hexdigest()}
            record["attempts"].append(attempt)
            write_json(path, record)
            used += 1
            started = perf_counter()
            previous_models = os.environ.get("SNOWFLAKE_MODELS")
            os.environ["SNOWFLAKE_MODELS"] = json.dumps([record["model"]])
            try:
                reply = model_call(record["model"], prompt)
                attempt.update(raw_output=reply.text, input_tokens=reply.input_tokens,
                               output_tokens=reply.output_tokens)
                reviews, validation = validate_reply(reply.text, packet)
                attempt.update(reviews=reviews, validation=validation,
                               status="valid" if reviews is not None else "invalid")
            except Exception as exc:
                attempt.update(status="failed", error={"type": type(exc).__name__,
                               "http_status": getattr(exc, "status_code", None)})
            finally:
                if previous_models is None:
                    os.environ.pop("SNOWFLAKE_MODELS", None)
                else:
                    os.environ["SNOWFLAKE_MODELS"] = previous_models
                if attempt["status"] == "reserved":
                    attempt.update(status="failed", error={"type": "InterruptedRequest", "http_status": None})
                attempt["latency_ms"] = round((perf_counter() - started) * 1000)
                write_json(path, record)
            print(f"{used}/{MAX_CALLS} {record['disease_id']} {record['model']} attempt {attempt_number}: {attempt['status']}", flush=True)


def final_attempt(run):
    return next((a for a in run["attempts"] if a["status"] == "valid"), None)


def rejection_counts(attempts):
    """Count every saved error entry, not just the number of rejected ballots."""
    counts = Counter()
    for attempt in attempts:
        counts.update(re.sub(r"^C[0-9]+: ", "", error)
                      for error in (attempt.get("validation") or {}).get("errors", []))
        if attempt.get("error"):
            counts["call: " + attempt["error"]["type"]] += 1
    return dict(counts)


def revalidate_runs(output):
    """Apply one final validator uniformly; preserve every receipt-time verdict."""
    output = Path(output)
    validator_hash = sha256(Path(__file__).with_name("client.py").read_bytes()).hexdigest()
    for path in sorted((output / "runs").glob("*.json")):
        run = json.loads(path.read_text())
        packet = json.loads((output / f"packet-{run['disease_id']}.json").read_text())
        for attempt in run["attempts"]:
            if attempt["raw_output"] is None:
                continue
            if "validation_at_receipt" not in attempt:
                attempt["validation_at_receipt"] = attempt["validation"]
                attempt["status_at_receipt"] = attempt["status"]
            reviews, flags = validate_reply(attempt["raw_output"], packet)
            attempt.update(reviews=reviews, validation=flags,
                           status="valid" if reviews is not None else "invalid",
                           validated_with_sha256=validator_hash)
        write_json(path, run)


def recovery(reviews, true_id):
    rank = next((r["rank"] for r in reviews or [] if r["candidate_id"] == true_id), None)
    return {"rank": rank, "hits_at_5": int(rank is not None and rank <= 5),
            "reciprocal_rank": 1 / rank if rank else 0}


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def leakage_matches(text, aliases):
    matches = []
    for sentence in sentences(text):
        disease = any(re.search(r"\b" + re.escape(a) + r"\b", sentence, re.I) for a in aliases)
        # A screen, not a scientific classifier; human review resolves negation/context.
        use = re.search(r"\b(approved|indicated|indication|licensed|used (?:for|to treat)|treats|treatment for|standard (?:therapy|treatment))\b", sentence, re.I)
        if disease and use:
            matches.append(sentence)
    return matches


def raw_reviews(attempt):
    if attempt["reviews"] is not None:
        return attempt["reviews"]
    try:
        raw = attempt["raw_output"] or ""
        value, _ = json.JSONDecoder().raw_decode(raw, raw.index("{"))
        return [r for r in value.get("reviews", []) if isinstance(r, dict)]
    except (ValueError, TypeError, AttributeError):
        return []


def score(output):
    output = Path(output)
    panels = json.loads((output / "panels.json").read_text())["panels"]
    declaration = json.loads((output / "preregistered.json").read_text())["declaration"]
    runs = [json.loads(p.read_text()) for p in sorted((output / "runs").glob("*.json"))]
    by_key = {(r["disease_id"], r["model"]): r for r in runs}
    if len(by_key) != 15:
        raise ValueError("Need all 15 run records to score")
    scores, audit, leaks = {}, {}, []
    for model in MODELS:
        model_runs = [by_key[(p["disease"]["id"], model)] for p in panels]
        attempts = [a for run in model_runs for a in run["attempts"]]
        valid = [final_attempt(r) for r in model_runs]
        per_disease = [{"disease_id": p["disease"]["id"], **recovery(a["reviews"] if a else None, p["true_drug"]["drug_id"])}
                       for p, a in zip(panels, valid)]
        directions = Counter(r["direction"] for a in valid if a for r in a["reviews"])
        token_sums = {k: sum(a[k] for a in attempts if a[k] is not None) for k in ("input_tokens", "output_tokens")}
        validation_counts = {
            key: {str(flag).lower(): sum((a.get("validation") or {}).get(key) is flag for a in attempts)
                  for flag in (True, False, None)}
            for key in ("schema", "unique_ranks", "evidence_ids_exist", "numbers_match")
        }
        scores[model] = {"validation_counts": validation_counts,
            "rejection_reasons": rejection_counts(attempts),
            "receipt_rejection_reasons": rejection_counts([
                {**a, "validation": a.get("validation_at_receipt", a.get("validation"))}
                for a in attempts]),
            "valid_runs": sum(a is not None for a in valid), "runs": 3,
            "valid_reply_rate": sum(a is not None for a in valid) / 3,
            "valid_attempt_rate": sum(a["status"] == "valid" for a in attempts) / len(attempts),
            "attempts": len(attempts), "per_disease": per_disease,
            "hits_at_5": sum(d["hits_at_5"] for d in per_disease) / 3,
            "mrr": sum(d["reciprocal_rank"] for d in per_disease) / 3,
            "conditional_mrr": (sum(d["reciprocal_rank"] for d in per_disease) / sum(a is not None for a in valid)) if any(valid) else None,
            "direction": {d: directions[d] for d in ("supported", "contradicted", "unknown")},
            "direction_all_attempts": dict(Counter(r.get("direction", "unparseable") for a in attempts for r in raw_reviews(a))),
            "median_latency_ms": median(sum(a["latency_ms"] or 0 for a in r["attempts"]) for r in model_runs),
            "median_first_attempt_latency_ms": median(r["attempts"][0]["latency_ms"] or 0 for r in model_runs),
            "first_attempt_input_tokens": sum(r["attempts"][0]["input_tokens"] or 0 for r in model_runs),
            "first_attempt_output_tokens": sum(r["attempts"][0]["output_tokens"] or 0 for r in model_runs),
            **token_sums, "missing_usage_attempts": sum(any(a[k] is None for k in token_sums) for a in attempts)}
        audit[model] = []
        for panel, run, final in zip(panels, model_runs, valid):
            packet = json.loads((output / f"packet-{run['disease_id']}.json").read_text())
            candidates = {c["label"]: c for c in packet["candidates"]}
            evidence = {e["id"]: e["statement"] for e in packet["evidence"]}
            aliases = [panel["disease"]["name"], *declaration["leakage_aliases"][run["disease_id"]]]
            for attempt in run["attempts"]:
                for review in raw_reviews(attempt):
                    for sentence in leakage_matches(str(review.get("rationale", "")), aliases):
                        leaks.append({"model": model, "disease_id": run["disease_id"],
                            "label": review.get("label"), "attempt": attempt["attempt"],
                            "valid_final": attempt is final, "sentence": sentence})
            if final:
                for review in final["reviews"]:
                    ids = list(dict.fromkeys(review["supporting_evidence_ids"] + review["contradicting_evidence_ids"]
                                             + review["safety"]["evidence_ids"]))
                    if not ids:
                        continue
                    for sentence in sentences(review["rationale"]):
                        audit[model].append({"model": model, "Disease": panel["disease"]["name"],
                            "Candidate name": candidates[review["label"]]["name"], "claim sentence": sentence,
                            "cited E IDs": "; ".join(ids),
                            "the cited statements": " | ".join(f"{i}: {evidence[i]}" for i in ids),
                            "supported_by_citation (yes/no)": "", "note": ""})
    jury_rows = []
    for panel in panels:
        disease_id = panel["disease"]["id"]
        packet = json.loads((output / f"packet-{disease_id}.json").read_text())
        finals = [final_attempt(by_key[(disease_id, m)]) for m in JURY]
        jurors = [{"status": "valid" if a else "failed", "reviews": a["reviews"] if a else None} for a in finals]
        agreement = consensus(packet, jurors)
        complete = all(finals)
        if not complete:
            agreement["kendalls_w"] = None
        jury_rows.append({"disease_id": disease_id, "complete": complete,
            **recovery(agreement["ranking"] if complete else None, panel["true_drug"]["drug_id"]),
            "consensus": agreement})
    jury_score = {"models": JURY, "complete_panels": sum(r["complete"] for r in jury_rows),
                  "hits_at_5": sum(r["hits_at_5"] for r in jury_rows) / 3,
                  "mrr": sum(r["reciprocal_rank"] for r in jury_rows) / 3, "per_disease": jury_rows}
    rng = random.Random(SEED)
    rows = []
    for model in MODELS:
        rows.extend(rng.sample(audit[model], min(6, len(audit[model]))))
    with (output / "audit_sample.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["model", "Disease", "Candidate name", "claim sentence",
            "cited E IDs", "the cited statements", "supported_by_citation (yes/no)", "note"])
        writer.writeheader()
        writer.writerows(rows)
    result = {"models": scores, "jury": jury_score,
              "chance": {"hits_at_5": 5 / 15, "mrr": sum(1/i for i in range(1,16)) / 15},
              "total_attempts": sum(s["attempts"] for s in scores.values()),
              "leakage": {
                  "all_attempt_rationales_with_mentions": len({(r["model"], r["disease_id"], r["attempt"], r["label"]) for r in leaks}),
                  "valid_final_rationales_with_mentions": len({(r["model"], r["disease_id"], r["label"]) for r in leaks if r["valid_final"]}),
                  "all_attempt_sentence_matches": len(leaks), "valid_final_sentence_matches": sum(r["valid_final"] for r in leaks), "matches": leaks},
              "manual_citation_audit": "pending Jessica; structural validation does not establish scientific support",
              "selection_status": "not frozen: manual citation audit and credit-cost check required",
              "audit_rows": len(rows),
              "audit_uncited_rows": sum(not r["cited E IDs"] for r in rows),
              "audit_shortfalls": {m: max(0, 6 - len(audit[m])) for m in MODELS},
              "protocol_amendment": json.loads((output / "protocol_amendment.json").read_text()) if (output / "protocol_amendment.json").exists() else None,
              "decoy_record_audit": json.loads((output / "decoy_record_audit.json").read_text()) if (output / "decoy_record_audit.json").exists() else None,
              "credit_cost": None}
    amendment = output / "validator_amendment.json"
    if amendment.exists():
        result["validator_amendment"] = json.loads(amendment.read_text())
    leakage_review = output / "leakage_review.json"
    if leakage_review.exists():
        result["leakage_review"] = json.loads(leakage_review.read_text())
    history_path = output / "rejections.json"
    if history_path.exists():
        history = json.loads(history_path.read_text())
        for model in MODELS:
            history["models"][model]["rerun"] = scores[model]["rejection_reasons"]
            history["models"][model]["rerun_at_receipt"] = scores[model]["receipt_rejection_reasons"]
        write_json(history_path, history)
        result["rejection_tally"] = history["models"]
    write_json(output / "scores.json", result)
    lines = ["# Jury-selection pilot", "", "Retrospective known-relationship recovery; three Diseases, 15 Candidates each. Manual citation audit is pending; configuration cannot yet be frozen.", "",
             "| Model | Valid runs | Attempts | Hits@5 | MRR | Direction supported/contradicted/unknown | Median seconds | Input/output tokens |",
             "|---|---:|---:|---:|---:|---:|---:|---:|"]
    for model, s in scores.items():
        d = s["direction"]
        tokens = f"{s['input_tokens']}/{s['output_tokens']}"
        if s["missing_usage_attempts"]:
            tokens += f" + unknown ({s['missing_usage_attempts']} attempts)"
        lines.append(f"| {model} | {s['valid_runs']}/3 | {s['attempts']} | {s['hits_at_5']:.1%} | {s['mrr']:.3f} | {d['supported']}/{d['contradicted']}/{d['unknown']} | {s['median_latency_ms']/1000:.1f} | {tokens} |")
    lines += ["", "The manual citation audit precedes recovery metrics in selection priority; the final jury is not frozen until that audit is complete.", "", f"Three-model jury (Opus + GPT-5.4 + GLM): {jury_score['complete_panels']}/3 complete panels; Hits@5 {jury_score['hits_at_5']:.1%}; MRR {jury_score['mrr']:.3f}.",
              "Kendall's W by Disease: " + ", ".join(f"{r['disease_id']}: {r['consensus']['kendalls_w']}" for r in jury_rows) + ".", "",
              "Chance: Hits@5 33.3%; MRR 0.221. Invalid/missing votes count as zero recovery. Latency and tokens include retries; unknown token usage is explicitly counted in scores.json. Actual credit cost was not available from the completion API.", "",
              "## Hold these Diseases out of the final test", ""]
    lines += [f"- {p['disease']['name']} ({p['disease']['id']}, {p['disease']['area']}): true drug {p['true_drug']['name']} ({p['true_drug']['drug_id']}); {p['true_drug']['target_count']} mapped Targets." for p in panels]
    lines += ["", "## Leakage and limits", "",
              f"Rationale approval/use screen: {result['leakage']['all_attempt_rationales_with_mentions']} rationales ({len(leaks)} sentences) across all attempts; {result['leakage']['valid_final_rationales_with_mentions']} rationales ({sum(r['valid_final'] for r in leaks)} sentences) in valid final replies. Matches are retained in scores.json for human review; a text screen cannot detect all implicit model knowledge. The audit sheet contains {len(rows)} sampled rationale sentences (up to six per model); {result['audit_uncited_rows']} sampled sentences have no review-level citations. E IDs include all review citations (including safety), not proven sentence-to-source alignments.",
              "Packets exclude clinical_precedence and cancer_biomarkers association contributions. Approval items contain generic regulator approval only; packet_checks.json records text-screen results. Literature co-mentions remain an indirect leakage risk. Drug names remain visible, so memorized indications remain a residual risk.",
              "Target-count matching is only a popularity proxy; network degree was unavailable. Decoys have no clinical_indication record at any stage for the exact Disease ID across their parent and included salts. Related-Disease records or unrecorded efficacy remain possible. Selection recall is 1 by panel construction and says nothing about full-universe retrieval.",
              "The corrected validator recognizes digits inside source names, Disease abbreviations, digit-leading receptor aliases, and protein-family aliases; quoted measurements still require exact values from that review's citations. All 21 recorded original replies pass the fixed validator, clearing 140 false numeric errors; the three original operational failures remain archived. Direction totals use valid final ballots; all parseable attempts are counted separately in scores.json.",
              "The universe's unmapped records and reasons are carried in panels.json; packet-specific mapping exclusions are in packet_checks.json. No names or symbols join records.",
              "No jury is finally selected until Jessica fills the citation audit and credit costs are checked. Selection priority was frozen in preregistered.json before live calls. Source releases: Open Targets 26.09, ChEMBL 37; PubChem responses use dated snapshots.", ""]
    if result["decoy_record_audit"]:
        counts = result["decoy_record_audit"]["checks"]
        lines += [f"The corrected cached-source audit found {sum(r['decoys_with_clinical_records'] for r in counts)}/42 decoys with any clinical record for the panel Disease. Five original decoys were replaced; the true drugs and 37 other decoys were retained. See decoy_record_audit.json and panel_changes.json.", ""]
    if result["protocol_amendment"]:
        lines += ["Protocol amendment: the first two Claude requests included temperature=0 and returned HTTP 400. Subsequent Claude calls omit temperature, following [Snowflake guidance for newer Claude models](https://www.snowflake.com/en/developers/guides/cortex-inference-ibis-integration-skills/). These failed calls and the interrupted GLM request remain in the 25-call budget. See protocol_amendment.json; all input packets, prompts, seeds and scoring rules stayed frozen.", ""]
    if "rejection_tally" in result:
        tally = result["rejection_tally"]
        reasons = sorted({reason for values in tally.values()
                          for phase in ("before", "after_replay", "rerun_at_receipt", "rerun")
                          for reason in values[phase]})
        lines += ["## Rejection tally", "",
                  "Cells are original / original replies replayed with the fixed validator / rerun at receipt / rerun under the final uniform validator. Count every saved error entry: one ballot can produce several Candidate/field errors. Operational failures have no reply to replay and remain unchanged in the replay column. Original artifacts are preserved in original/.", "",
                  "| Reason | Opus | Sonnet | GPT-5.4 | GLM | Kimi |",
                  "|---|---:|---:|---:|---:|---:|"]
        for reason in reasons:
            cells = ["/".join(str(tally[model][phase].get(reason, 0))
                              for phase in ("before", "after_replay", "rerun_at_receipt", "rerun")) for model in MODELS]
            lines.append("| " + reason + " | " + " | ".join(cells) + " |")
        lines += [""]
    if "validator_amendment" in result:
        lines += ["The rerun exposed further source-name cases (5-HT2 and PD-1). Source aliases were compiled uniformly for all 101 panel Target IDs. The final validator was applied to every retained output, preserving receipt-time flags and all extra requests. No packets, prompts or scoring criteria changed. See validator_amendment.json. First-attempt median latency and token totals, excluding extra retries caused by receipt-time validation, are reported separately in scores.json.", "",
                  "| Model | Median first-attempt seconds | First-attempt input/output tokens |",
                  "|---|---:|---:|"]
        for model, values in scores.items():
            lines.append(f"| {model} | {values['median_first_attempt_latency_ms']/1000:.1f} | {values['first_attempt_input_tokens']}/{values['first_attempt_output_tokens']} |")
        lines += [""]
    if "leakage_review" in result:
        lines += ["Inspection of the six heuristic leakage flags found no affirmative claim of approval for the panel Disease: one matched PD-1 as the Disease abbreviation, and the others stated generic approval while explicitly noting absent Disease evidence. However, Sonnet introduced antiemetic-related approval and oncology use, neither present in the supplied statements. These are unprovided clinical-context claims consistent with model knowledge; they are preserved in leakage_review.json. Two malformed replies were also inspected for completed rationale strings; their incomplete tails cannot be fully assessed.", ""]
    if leaks:
        lines += ["Screened rationale examples:", ""] + [f"- {r['model']}, {r['disease_id']}, attempt {r['attempt']}: {r['sentence']}" for r in leaks[:8]]
    (output / "summary.md").write_text("\n".join(lines) + "\n")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--output", type=Path, default=Path("data/pilot"))
    args = parser.parse_args()
    if args.live:
        declaration = freeze(args.output)
        client = CortexModel()
        try:
            run_pilot(args.output, lambda model, prompt: call_model(client, model, prompt), declaration)
        finally:
            client.close()
    score(args.output)
