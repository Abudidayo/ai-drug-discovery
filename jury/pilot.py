"""Frozen pilots: v1 allows 25 requests; v2 allows 60, including retries.

Prepare: python -m pipeline.panels
Run: python -m jury.pilot --live
Re-score without network: python -m jury.pilot
V2: python -m pipeline.panels --v2; python -m jury.pilot --v2 --live
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


V2_MODELS = ["claude-opus-5-5", "openai-gpt-5.4", "glm-5.3", "kimi-k3"]
V2_CONDITIONS = ("named", "blind")
V2_JURIES = {"opus_gpt_glm": V2_MODELS[:3],
             "opus_gpt_kimi": [V2_MODELS[0], V2_MODELS[1], V2_MODELS[3]]}


def v2_lexicon(packet, identities):
    """Same source-grounded numeric-name exemptions for both conditions."""
    names = {name for c in packet["candidates"] for name in identities["drug_aliases"][c["candidate_id"]]}
    for c in packet["candidates"]:
        for target in c["targets"]:
            names.update(identities["target_name_aliases"].get(target["id"], []))
    return sorted(name for name in names if re.search(r"[0-9]", name)
                  and (re.search(r"[A-Za-z]", name) or re.fullmatch(r"[0-9]{2,7}-[0-9]{2}-[0-9]", name)))


def v2_jobs(output, *, conditions=V2_CONDITIONS):
    from pipeline.panels import blind_prompt_leaks
    output = Path(output)
    panels = json.loads((output / "panels.json").read_text())["panels"]
    identities = json.loads((output / "identities.json").read_text())
    suffix = "Keep each rationale and objection concise (one short sentence each). Avoid quoting numeric measurements. Obey decision order across ranks."
    jobs = []
    for index, panel in enumerate(panels):
        did = panel["disease"]["id"]
        packets = {condition: json.loads((output / f"{'packet' if condition == 'named' else 'blind'}-{did}.json").read_text()) for condition in conditions}
        expected = {d["drug_id"] for d in [panel["true_drug"], *panel["decoys"]]}
        if any(len(p["candidates"]) != 15 or {c["candidate_id"] for c in p["candidates"]} != expected for p in packets.values()):
            raise ValueError("Each condition must contain exactly the frozen 15-drug panel")
        for model_index, model in enumerate(V2_MODELS):
            order = [c["label"] for c in next(iter(packets.values()))["candidates"]]
            random.Random(SEED + index*len(V2_MODELS)+model_index).shuffle(order)
            for condition in conditions:
                packet = packets[condition]
                validate_packet(packet)
                prompt = build_prompt(packet, order) + "\n" + suffix
                if condition == "blind":
                    aliases = [a for c in packet["candidates"] for a in identities["drug_aliases"][c["candidate_id"]]]
                    leaks = blind_prompt_leaks(prompt, aliases)
                    if leaks:
                        raise ValueError(f"Drug identity in blind prompt: {leaks}")
                jobs.append({"disease_id": did, "condition": condition, "model": model,
                    "packet": packet, "presented_order": order, "prompt": prompt,
                    "name_aliases": v2_lexicon(packet, identities),
                    "path": str(output / "runs" / f"{did}-{model}-{condition}.json")})
    random.Random(SEED).shuffle(jobs)
    return jobs


def freeze_v2(output):
    output = Path(output)
    jobs = v2_jobs(output)
    if len(jobs) != 48:
        raise ValueError("V2 needs exactly six panels × four models × two conditions")
    paths = [output / "panels.json", output / "identities.json", *sorted(output.glob("packet-*.json")), *sorted(output.glob("blind-*.json"))]
    declaration = {"version": 2, "models": V2_MODELS, "conditions": V2_CONDITIONS,
        "juries": V2_JURIES, "seed": SEED, "max_live_calls": 60, "max_attempts_per_job": 2,
        "workers": 4, "reasoning_effort": json.loads(os.environ.get("SNOWFLAKE_REASONING_EFFORT", "{}")),
        "transport": {"temperature": 0, "anthropic_temperature": "omitted/provider default", "anthropic_max_tokens": 12000, "sdk_retries": 0},
        "selection": "Six areas; newest FDA ORIG/AP date among mapped regulator-backed drugs with ChEMBL first_approval >=2024. Seven count-matched top-50 plausible decoys selected by strongest direct evidence; seven other matched decoys. Any Disease clinical record excludes a decoy. Fame proxy: recent first US approval, narrow indication breadth, fewer clinical reports than most-recorded approved comparator; not measured name familiarity.",
        "design": "Same panel and presented order per named/blind pair; same instructions and evidence values. Independent model/Disease orders. Fixed seeded interleaving of conditions, four separate worker processes; stateless single-message requests.",
        "retry_policy": "All 48 first attempts before any retry. At most one retry per job; first 12 unsuccessful jobs in the same frozen order if all fail. Every request reserved durably before dispatch. An interrupted reservation consumes a slot.",
        "metrics": "Valid jobs / 6 per model/condition; Hits@5 and MRR over all six Diseases with invalid/failed votes zero. Per-panel true ranks. Median active response time per job including retries, token totals and medians. Named-minus-blind paired deltas, plus both-valid paired subset. No confidence or clinical efficacy claims from six panels.",
        "jury_policy": "Both declared juries reuse the single-model outputs; Borda competition ranks and Kendall W per Disease/condition. Require all three valid jurors for scored recovery and W; otherwise zero recovery and null W.",
        "baseline": "Same packet evidence: max assigned target_association evidence_only_score per Candidate, same 8-significant-digit values shown to jurors. Order descending score, ChEMBL ID tie-break. Missing association ranks with zero sentinel, not proof of biological zero. All candidate Target associations supplied, not just top 50.",
        "gap_interpretation": "Named-minus-blind estimates name-visibility effect, not pure memory. Target/mechanism fingerprints, numbers, warnings and literature may still identify compounds.",
        "inputs_sha256": {p.name: sha256(p.read_bytes()).hexdigest() for p in paths},
        "source_sha256": {name: sha256(Path(__file__).with_name(name).read_bytes()).hexdigest() for name in ("client.py", "pilot.py")},
        "jobs": [{k: job[k] for k in ("disease_id", "model", "condition", "presented_order")} | {"prompt_sha256": sha256(job["prompt"].encode()).hexdigest()} for job in jobs]}
    amendment = output / "protocol_amendment.json"
    if amendment.exists():
        declaration["protocol_amendment_sha256"] = sha256(amendment.read_bytes()).hexdigest()
        declaration["prior_calls_not_in_active_runs"] = json.loads(amendment.read_text())["prior_calls_not_in_active_runs"]
    path = output / "preregistered.json"
    if path.exists():
        old = json.loads(path.read_text())["declaration"]
        if old != json.loads(json.dumps(declaration)):
            raise ValueError("Frozen v2 inputs, rules or source code changed")
    else:
        write_json(path, {"frozen_at": datetime.now(timezone.utc).isoformat(), "declaration": declaration})
    prompts = output / "prompts"
    prompts.mkdir(exist_ok=True)
    for job in jobs:
        (prompts / (Path(job["path"]).stem + ".txt")).write_text(job["prompt"])
    return declaration


def v2_live_attempt(job):
    """One request in an isolated process; no credential enters a job argument."""
    path = Path(job["path"])
    run = json.loads(path.read_text())
    attempt = run["attempts"][-1]
    attempt["dispatched_at"] = datetime.now(timezone.utc).isoformat()
    write_json(path, run)
    previous = os.environ.get("SNOWFLAKE_MODELS")
    os.environ["SNOWFLAKE_MODELS"] = json.dumps([job["model"]])
    client = None
    started = perf_counter()
    try:
        client = CortexModel()
        reply = call_model(client, job["model"], job["prompt"])
        attempt.update(raw_output=reply.text, input_tokens=reply.input_tokens, output_tokens=reply.output_tokens)
        reviews, flags = validate_reply(reply.text, job["packet"], name_aliases=job["name_aliases"])
        attempt.update(status="valid" if reviews is not None else "invalid", reviews=reviews, validation=flags)
    except Exception as exc:
        attempt.update(status="failed", error={"type": type(exc).__name__, "http_status": getattr(exc, "status_code", None)})
    finally:
        if client:
            client.close()
        if previous is None:
            os.environ.pop("SNOWFLAKE_MODELS", None)
        else:
            os.environ["SNOWFLAKE_MODELS"] = previous
        if attempt["status"] == "reserved":
            attempt.update(status="failed", error={"type": "InterruptedRequest", "http_status": None})
        attempt["latency_ms"] = round((perf_counter()-started)*1000)
        write_json(path, run)
    return {k: run[k] for k in ("model", "condition", "disease_id")} | {"status": attempt["status"], "attempt": attempt["attempt"]}


def run_v2(output, attempt_call=v2_live_attempt):
    from concurrent.futures import ProcessPoolExecutor, as_completed
    output = Path(output)
    declaration = freeze_v2(output)
    jobs = v2_jobs(output)
    (output / "runs").mkdir(exist_ok=True)
    def record(job):
        path = Path(job["path"])
        return json.loads(path.read_text()) if path.exists() else {
            **{k: job[k] for k in ("model", "condition", "disease_id", "presented_order")}, "attempts": []}
    used = declaration.get("prior_calls_not_in_active_runs", 0) + sum(len(record(job)["attempts"]) for job in jobs)
    if used > 60:
        raise ValueError("Existing v2 journal exceeds 60-call budget")
    with ProcessPoolExecutor(max_workers=4) as pool:
        for number in (1, 2):
            pending = {}
            for job in jobs:
                run = record(job)
                if used >= 60:
                    break
                if len(run["attempts"]) != number-1 or final_attempt(run):
                    continue
                run["attempts"].append({"attempt": number, "status": "reserved", "raw_output": None,
                    "reviews": None, "validation": None, "input_tokens": None, "output_tokens": None,
                    "latency_ms": None, "started_at": datetime.now(timezone.utc).isoformat(),
                    "prompt_sha256": sha256(job["prompt"].encode()).hexdigest()})
                write_json(Path(job["path"]), run)
                used += 1
                pending[pool.submit(attempt_call, job)] = job
            for future in as_completed(pending):
                job = pending[future]
                try:
                    result = future.result()
                except Exception as exc:
                    run = record(job)
                    run["attempts"][-1].update(status="failed", error={"type": type(exc).__name__, "http_status": None})
                    write_json(Path(job["path"]), run)
                    result = {k: job[k] for k in ("model", "condition", "disease_id")} | {"status": "failed"}
                print(json.dumps(result), flush=True)


def score_v2(output):
    output = Path(output)
    panels = json.loads((output / "panels.json").read_text())["panels"]
    jobs = v2_jobs(output)
    runs = {(j["disease_id"], j["model"], j["condition"]): json.loads(Path(j["path"]).read_text()) for j in jobs}
    if len(runs) != 48 or any(not r["attempts"] for r in runs.values()):
        raise ValueError("Need all 48 v2 jobs")
    baseline = []
    by_model = {}
    identities = json.loads((output / "identities.json").read_text())
    from pipeline.panels import blind_prompt_leaks
    leakage = []
    for panel in panels:
        did = panel["disease"]["id"]
        packet = json.loads((output / f"packet-{did}.json").read_text())
        evidence = {e["id"]: e for e in packet["evidence"]}
        values = []
        for c in packet["candidates"]:
            scores = [evidence[e]["values"]["evidence_only_score"] for e in c["evidence_ids"] if evidence[e]["kind"] == "target_association"]
            values.append({"candidate_id": c["candidate_id"], "score": max(scores, default=0), "observed_associations": len(scores)})
        values.sort(key=lambda r: (-r["score"], r["candidate_id"]))
        ranking = [{**r, "rank": i} for i, r in enumerate(values, 1)]
        baseline.append({"disease_id": did, **recovery(ranking, panel["true_drug"]["drug_id"]), "ranking": ranking})
    for model in V2_MODELS:
        by_model[model] = {}
        for condition in V2_CONDITIONS:
            selected = [runs[(p["disease"]["id"], model, condition)] for p in panels]
            attempts = [a for r in selected for a in r["attempts"]]
            results = []
            for panel, run in zip(panels, selected):
                final = final_attempt(run)
                results.append({"disease_id": run["disease_id"], "status": "valid" if final else "invalid_or_failed",
                    **recovery(final["reviews"] if final else None, panel["true_drug"]["drug_id"])})
                forbidden = [name for c in [panel["true_drug"], *panel["decoys"]] for name in identities["drug_aliases"][c["drug_id"]]]
                for attempt in run["attempts"]:
                    if condition == "blind" and attempt["raw_output"]:
                        # Output identities are findings, not grounds for discarding a ballot.
                        hits = blind_prompt_leaks(attempt["raw_output"], forbidden)
                        if hits:
                            leakage.append({"model": model, "disease_id": run["disease_id"], "attempt": attempt["attempt"],
                                "valid_final": attempt is final, "name_or_id_mentions": hits})
            summary = {"valid_runs": sum(r["status"]=="valid" for r in results), "runs": 6,
                "valid_reply_rate": sum(r["status"]=="valid" for r in results)/6,
                "attempts": len(attempts), "hits_at_5": sum(r["hits_at_5"] for r in results)/6,
                "mrr": sum(r["reciprocal_rank"] for r in results)/6, "per_panel": results,
                "median_latency_ms": median(sum(a["latency_ms"] or 0 for a in r["attempts"]) for r in selected),
                "input_tokens": sum(a["input_tokens"] or 0 for a in attempts),
                "output_tokens": sum(a["output_tokens"] or 0 for a in attempts),
                "median_input_tokens": median(sum(a["input_tokens"] or 0 for a in r["attempts"]) for r in selected),
                "median_output_tokens": median(sum(a["output_tokens"] or 0 for a in r["attempts"]) for r in selected),
                "median_first_attempt_latency_ms": median(r["attempts"][0]["latency_ms"] or 0 for r in selected),
                "first_attempt_input_tokens": sum(r["attempts"][0]["input_tokens"] or 0 for r in selected),
                "first_attempt_output_tokens": sum(r["attempts"][0]["output_tokens"] or 0 for r in selected),
                "valid_attempt_rate": sum(a["status"] == "valid" for a in attempts)/len(attempts),
                "missing_usage_attempts": sum(a["input_tokens"] is None or a["output_tokens"] is None for a in attempts),
                "rejections": rejection_counts(attempts)}
            by_model[model][condition] = summary
    juries = {}
    for name, models in V2_JURIES.items():
        juries[name] = {}
        for condition in V2_CONDITIONS:
            rows = []
            for panel in panels:
                did = panel["disease"]["id"]
                packet = json.loads((output / f"packet-{did}.json").read_text())
                finals = [final_attempt(runs[(did, m, condition)]) for m in models]
                votes = [{"status": "valid" if a else "failed", "reviews": a["reviews"] if a else None} for a in finals]
                c = consensus(packet, votes)
                complete = all(finals)
                if not complete:
                    c["kendalls_w"] = None
                rows.append({"disease_id": did, "complete": complete,
                    **recovery(c["ranking"] if complete else None, panel["true_drug"]["drug_id"]), "consensus": c})
            juries[name][condition] = {"models": models, "complete_panels": sum(r["complete"] for r in rows),
                "hits_at_5": sum(r["hits_at_5"] for r in rows)/6, "mrr": sum(r["reciprocal_rank"] for r in rows)/6, "per_panel": rows}
    gaps = {}
    for name, conditions in {**by_model, **juries}.items():
        named, blind = conditions["named"], conditions["blind"]
        nrows = named.get("per_panel");brows = blind.get("per_panel")
        both = [(n,b) for n,b in zip(nrows,brows) if n["rank"] is not None and b["rank"] is not None]
        gaps[name] = {"hits_at_5_named_minus_blind": named["hits_at_5"]-blind["hits_at_5"],
            "mrr_named_minus_blind": named["mrr"]-blind["mrr"], "both_valid_panels": len(both),
            "paired_rr_gaps": [{"disease_id": n["disease_id"], "delta": n["reciprocal_rank"]-b["reciprocal_rank"]} for n,b in zip(nrows,brows)],
            "both_valid_mrr_gap": sum(n["reciprocal_rank"]-b["reciprocal_rank"] for n,b in both)/len(both) if both else None}
        gaps[name]["both_valid_hits_at_5_gap"] = sum(n["hits_at_5"]-b["hits_at_5"] for n,b in both)/len(both) if both else None
    result = {"version": 2, "models": by_model, "juries": juries, "named_minus_blind": gaps,
        "direct_baseline": {"hits_at_5": sum(r["hits_at_5"] for r in baseline)/6, "mrr": sum(r["reciprocal_rank"] for r in baseline)/6, "per_panel": baseline},
        "chance": {"hits_at_5": 5/15, "mrr": sum(1/i for i in range(1,16))/15},
        "total_attempts": sum(len(r["attempts"]) for r in runs.values()), "blind_output_identity_mentions": leakage,
        "interpretation": "Six-Disease retrospective pilot. Name masking does not mask Target/mechanism fingerprints. A paired name-visibility gap is not a pure measure of memory. Decoys are unlabelled, not known ineffective.",
        "manual_citation_audit": "not performed", "credit_cost": None}
    amendment = output / "protocol_amendment.json"
    if amendment.exists():
        result["protocol_amendment"] = json.loads(amendment.read_text())
        result["active_attempts"] = result["total_attempts"]
        result["total_attempts"] += result["protocol_amendment"]["prior_calls_not_in_active_runs"]
    write_json(output / "scores.json", result)
    lines = ["# Harder pilot v2", "", "This is a retrospective recovery test on six Diseases, not a clinical prediction test. Panels, Candidate order and recovery scoring were fixed before calls; masking and validator corrections are documented below. The same Candidate order is used in each named/blind pair. No v1 artifact was overwritten.", "",
        "## Panels to exclude from the final test", "", "| Disease | Area | True drug | First US approval | Plausible decoys |", "|---|---|---|---|---:|"]
    for p in panels:
        lines.append(f"| {p['disease']['name']} ({p['disease']['id']}) | {p['disease']['area']} | {p['true_drug']['name']} ({p['true_drug']['drug_id']}) | {p['true_drug']['first_approval']['date']} | {sum(d['plausible'] for d in p['decoys'])}/14 |")
    lines += ["", "Approval dates come from FDA ORIG/AP submissions joined through application IDs in Open Targets regulator reports. ChEMBL 37's eligible dated recent cohort ends in 2024. These are first US dates, not claims about first approval anywhere in the world. 'Less famous' means recent first US approval, narrow indication breadth and fewer source clinical reports than the most-recorded approved comparator; actual familiarity was not measured. All seven required plausible decoys share an exact top-50 Target; no broad protein-family fallback was used. All decoys have no Disease clinical record at any stage across parent and included salts.", "",
        "## Summary", "", "| Model | Condition | Valid | Attempts | Hits@5 | MRR | Median seconds | Median input/output tokens | Total input/output tokens |", "|---|---|---:|---:|---:|---:|---:|---:|---:|"]
    for model, conditions in by_model.items():
        for condition, v in conditions.items():
            lines.append(f"| {model} | {condition} | {v['valid_runs']}/6 | {v['attempts']} | {v['hits_at_5']:.1%} | {v['mrr']:.3f} | {v['median_latency_ms']/1000:.1f} | {v['median_input_tokens']}/{v['median_output_tokens']} | {v['input_tokens']}/{v['output_tokens']} |")
    lines += ["", "Latency includes the request and local validation, with retries summed within a job. Token totals and medians cover active corrected-experiment attempts; all historical spending and unknown interrupted usage are recorded separately in cost_accounting.json. First-attempt latency and tokens are also in scores.json."]
    lines += ["", f"Chance: Hits@5 33.3%, MRR {result['chance']['mrr']:.3f}. Direct-evidence baseline: Hits@5 {result['direct_baseline']['hits_at_5']:.1%}, MRR {result['direct_baseline']['mrr']:.3f}. It uses the best Target score actually present in each packet. All Candidate Target associations are supplied; the top-50 limit only defines plausibility. A missing association uses zero for ordering and is not proof of no biological link. Ties in this baseline use ChEMBL ID order.", "",
        "## Jury results", "", "| Jury | Condition | Complete panels | Hits@5 | MRR | W by panel in listed order |", "|---|---|---:|---:|---:|---|"]
    for name, conditions in juries.items():
        for condition,v in conditions.items():
            lines.append(f"| {name} | {condition} | {v['complete_panels']}/6 | {v['hits_at_5']:.1%} | {v['mrr']:.3f} | {', '.join(str(r['consensus']['kendalls_w']) for r in v['per_panel'])} |")
    lines += ["", "W describes agreement, not correctness. Invalid jobs score zero; no missing juror is fabricated. The two juries reuse the same single-model calls.", "", "## Named minus blind", "", "| Model/jury | Hits@5 gap | MRR gap | Both-valid paired panels |", "|---|---:|---:|---:|"]
    for name,v in gaps.items():lines.append(f"| {name} | {v['hits_at_5_named_minus_blind']:+.1%} | {v['mrr_named_minus_blind']:+.3f} | {v['both_valid_panels']}/6 |")
    lines += ["", "Positive gaps favour visible names. This measures name visibility under this setup, not memory alone: the preserved Targets, mechanisms, activity values and warnings can still identify a drug. Invalid blind replies also inflate this gap. Both-valid paired results below remove that failure difference, while selecting a smaller subset.", "", "| Model/jury | Both-valid panels | Hits@5 gap in subset | MRR gap in subset |", "|---|---:|---:|---:|"]
    for name,v in gaps.items():
        lines.append(f"| {name} | {v['both_valid_panels']}/6 | {v['both_valid_hits_at_5_gap']:+.1%} | {v['both_valid_mrr_gap']:+.3f} |" if v['both_valid_panels'] else f"| {name} | 0/6 | — | — |")
    lines += ["", "Raw paired reciprocal-rank differences are in scores.json.", "", "## Per-panel true ranks", "", "A dash is an invalid/failed job. Named/blind are paired within each cell. These six observations are shown instead of claiming precise population effects.", "", "| Disease | Direct | Opus N/B | GPT N/B | GLM N/B | Kimi N/B |", "|---|---:|---:|---:|---:|---:|"]
    for i,p in enumerate(panels):
        cells=[str(baseline[i]["rank"])]
        for model in V2_MODELS:
            cells.append('/'.join(str(by_model[model][c]['per_panel'][i]['rank'] or '—') for c in V2_CONDITIONS))
        lines.append('| '+p['disease']['name']+' | '+' | '.join(cells)+' |')
    lines += ["", "## Leakage and limits", "", f"All blind prompts passed a source-alias and ChEMBL-ID scan before dispatch. {len(leakage)} blind-output attempts mentioned a panel identity alias or ID; these flags require inspection because short aliases can be ambiguous. See scores.json. No output was discarded merely for revealing an identity. Indication/trial labels and clinical/cancer-biomarker association contributions are excluded from packets; literature co-mentions and model knowledge remain risks.",
        "Names and synonyms were collected from the pinned ChEMBL and Open Targets parent/verified-salt records. This does not guarantee absence of an unknown or unrecorded synonym. The blinding checks preserve structured Target names, action types and all numeric evidence. Drug identities and dates are evaluation metadata, never part of a blind prompt.",
        "Only six Diseases were tested. Recent first approval and a low report count are imperfect familiarity proxies; targets may make a true drug distinctive even among plausible decoys. Do not treat high recovery as proof of novelty, future efficacy or absence of memorization. Actual credit costs and independent citation validity remain unverified.", ""]
    if amendment.exists():
        lines += ["## Protocol correction", "", f"The initial batch was interrupted after 30 dispatched calls, including four interrupted requests. Ten superseded or interrupted calls remain charged to the budget; twenty replies with unchanged prompts were retained and uniformly revalidated. The corrected experiment used {result['active_attempts']} active attempts; total live calls including the ten archived calls: {result['total_attempts']}/60. The model table reports attempts, latency and tokens for the corrected experiment; archived cost and missing interrupted usage are in protocol_amendment.json.",
            "Blanket synonym replacement had changed biological Target descriptions in nine mechanism statements. The corrected blind statements express the same ID-mapped Targets using their gene symbols and the same recorded action type. Structured Target names, action types and evidence values remain unchanged. Four blind panels were corrected; their old replies were excluded regardless of rank or validity. Source-grounded MAP2K shorthand, FGFR1-3 ranges and expanded phosphodiesterase family lists were repaired in the numeric validator and applied uniformly; actual measurements still require exact cited values. One GLM retry was caused by a false family rejection before the final repair; it stays charged to the budget. Original prompts, outputs and receipt flags remain in superseded-masking/. See validator_amendment.json for before/after counts. No model outcome was used to change a panel, a true drug, a decoy or the scoring rule.", ""]
    review_path = output / "leakage_review.json"
    if review_path.exists():
        result["leakage_review"] = json.loads(review_path.read_text())
        lines += ["## Inspected leakage", "", result['leakage_review']['summary'], ""]
        write_json(output / "scores.json", result)
    (output / "summary.md").write_text('\n'.join(lines)+'\n')
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--v2", action="store_true")
    parser.add_argument("--output", type=Path, default=Path("data/pilot"))
    args = parser.parse_args()
    if args.v2:
        output = Path("data/pilot/v2") if args.output == Path("data/pilot") else args.output
        if args.live:
            run_v2(output)
        score_v2(output)
        raise SystemExit(0)
    if args.live:
        declaration = freeze(args.output)
        client = CortexModel()
        try:
            run_pilot(args.output, lambda model, prompt: call_model(client, model, prompt), declaration)
        finally:
            client.close()
    score(args.output)
