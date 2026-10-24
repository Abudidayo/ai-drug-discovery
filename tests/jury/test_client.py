from copy import deepcopy
import json
import os
from pathlib import Path
import random
import subprocess

import httpx
import openai
import pytest

from jury.client import (
    CortexModel, build_prompt, consensus, mock_model, run_jury,
    validate_config, validate_packet, validate_reply, visible_packet,
)


ROOT = Path(__file__).resolve().parents[2]
PACKET = json.loads((ROOT / "fixtures/evidence_packet.json").read_text())
FIXTURE = json.loads((ROOT / "fixtures/jury_result.json").read_text())
CONFIG = json.loads((ROOT / "jury/config.json").read_text())


def reply():
    return {"reviews": [{k: deepcopy(v) for k, v in r.items() if k != "candidate_id"}
                        for r in FIXTURE["jurors"][0]["reviews"]]}


def test_prompt_allowlist_and_no_input_ranking():
    packet = deepcopy(PACKET)
    for c in packet["candidates"]:
        c.update(network={"rank": 123}, rank=123, direct_evidence_rank=123,
                 selected_by=["network"], secret="forbidden")
    order = ["C4", "C2", "C1", "C3"]
    prompt = build_prompt(packet, order)
    visible = json.loads(prompt.split("Evidence packet:\n")[1])
    assert visible == visible_packet(packet, order)
    assert set(visible) == {"disease", "candidates", "evidence"}
    assert visible["disease"] == {"name": PACKET["disease"]["name"]}
    for c in visible["candidates"]:
        assert set(c) == {"label", "name", "targets", "evidence_ids", "safety_status"}
        assert all(set(t) == {"name", "mechanism"} for t in c["targets"])
    assert all(set(e) == {"id", "kind", "statement", "values"} for e in visible["evidence"])
    for forbidden in ("CHEMBL", "ENSG", "http", "source_id", "candidate_id", "network", "123", "secret"):
        assert forbidden not in prompt
    assert "rank" not in json.dumps(visible)
    assert "being investigated" in prompt and "do not endorse" in prompt
    for field in reply()["reviews"][0]:
        assert field in prompt


def test_seeded_orders_and_output_shape():
    result = run_jury(PACKET, CONFIG, mock_model)
    assert set(result) == set(FIXTURE)
    assert result["jury"] == CONFIG
    assert len(result["jurors"]) == 3
    for i, j in enumerate(result["jurors"]):
        order = [c["label"] for c in PACKET["candidates"]]
        random.Random(CONFIG["shuffle_seed"] + i).shuffle(order)
        assert j["presented_order"] == order
        assert j["status"] == "valid" and j["attempts"] == 1
        assert set(j) == set(FIXTURE["jurors"][0])
        assert set(j["reviews"][0]) == set(FIXTURE["jurors"][0]["reviews"][0])
        assert j["validation"]["errors"] == []
    again = run_jury(PACKET, CONFIG, mock_model)
    assert [j["presented_order"] for j in again["jurors"]] == [j["presented_order"] for j in result["jurors"]]
    assert len({tuple(j["presented_order"]) for j in result["jurors"]}) == 3


def test_fixture_consensus_exactly():
    assert consensus(PACKET, FIXTURE["jurors"]) == FIXTURE["consensus"]
    for juror in FIXTURE["jurors"][:2]:
        value = {"reviews": [{k: v for k, v in r.items() if k != "candidate_id"}
                             for r in juror["reviews"]]}
        reviews, flags = validate_reply(json.dumps(value), PACKET)
        assert reviews == juror["reviews"] and not flags["errors"]


@pytest.mark.parametrize("change", [
    lambda v: v.update(extra=True),
    lambda v: v["reviews"][0].update(decision="safe"),
    lambda v: v["reviews"][0].update(direction="positive"),
    lambda v: v["reviews"][0].update(rank=True),
    lambda v: v["reviews"][0].update(rank=1.0),
    lambda v: v["reviews"][0].update(safety={"status": [], "evidence_ids": []}),
    lambda v: v["reviews"][0].update(missing_evidence="none"),
    lambda v: v["reviews"][0].update(candidate_id="CHEMBL2105759"),
    lambda v: v["reviews"][0].update(rank=2),
    lambda v: v["reviews"][0].update(rank=0),
    lambda v: v["reviews"][0].update(rank=5),
    lambda v: v["reviews"].pop(),
    lambda v: v["reviews"].append(deepcopy(v["reviews"][0])),
    lambda v: v["reviews"][0].update(label="C99"),
    lambda v: v["reviews"][0].update(supporting_evidence_ids=["E999"]),
    lambda v: v["reviews"][0].update(supporting_evidence_ids=["E1"]),
    lambda v: v["reviews"][0].update(supporting_evidence_ids=["E11"]),
    lambda v: v["reviews"][0]["safety"].update(status="unknown"),
    lambda v: v["reviews"][0]["safety"].update(evidence_ids=["E11"]),
    lambda v: v["reviews"][1]["safety"].update(evidence_ids=["E19"]),
    lambda v: v["reviews"][0].update(missing_evidence=["See E999."]),
    lambda v: v["reviews"][0].update(rationale="See E8."),
])
def test_invalid_replies_never_supply_reviews(change):
    value = reply()
    change(value)
    reviews, flags = validate_reply(json.dumps(value), PACKET)
    assert reviews is None and flags["errors"]


@pytest.mark.parametrize("raw", ["plain text", "[]", "null", "{}", '{"reviews":NaN}',
                                      '{"reviews":[],"reviews":[]}', None])
def test_bad_json(raw):
    reviews, flags = validate_reply(raw, PACKET)
    assert reviews is None and flags["schema"] is False


@pytest.mark.parametrize("text,accepted", [
    ("JAK1 and Bcl-2 are identifiers; association 0.80.", True),
    ("Association .8 or 8e-1.", True),
    ("Association 0.80000000000000001.", False),
    ("Association 0.9.", False),  # exists elsewhere in the packet, not in cited items
    ("Median 7.5 across 10 activities.", False),  # exists for Candidate, not cited
    ("Association −0.8.", False),
    ("Association 80%.", False),
    ("ChEMBL 37 records it.", False),  # release is not an evidence value
    ("Association 0.8 and 999.", False),
    ("An invented identifier dose-99.", False),
    ("An invented identifier JAK99.", False),
])
@pytest.mark.parametrize("field", ["rationale", "objection"])
def test_exact_numbers_in_each_text_field(text, accepted, field):
    value = reply()
    value["reviews"][0][field] = text
    reviews, flags = validate_reply(json.dumps(value), PACKET)
    assert (reviews is not None) is accepted
    assert flags["numbers_match"] is accepted


def test_bioactivity_numbers():
    value = reply()
    value["reviews"][0].update(supporting_evidence_ids=["E8"],
                               rationale="Median 7.50 across 1e1 JAK1 activities.")
    assert validate_reply(json.dumps(value), PACKET)[0] is not None


@pytest.mark.parametrize("field", ["rationale", "objection"])
@pytest.mark.parametrize("text,flag", [
    ("Association 0.8e9999999999999999999.", "numbers_match"),
    ("", "schema"),
    (" \t\n ", "schema"),
], ids=["huge-exponent", "empty", "whitespace"])
def test_invalid_review_text_is_rejected_and_retried(field, text, flag):
    value = reply()
    value["reviews"][0][field] = text
    raw = json.dumps(value)
    reviews, validation = validate_reply(raw, PACKET)
    assert reviews is None and validation[flag] is False and validation["errors"]

    exhausted = run_jury(PACKET, CONFIG, lambda *args: raw)
    assert exhausted["consensus"]["jurors_counted"] == 0
    for juror in exhausted["jurors"]:
        assert juror["status"] == "invalid" and juror["reviews"] is None
        assert juror["attempts"] == CONFIG["max_attempts"]
        assert juror["raw_output"] == raw
        assert len(juror["validation"]["errors"]) == CONFIG["max_attempts"]

    calls = {}
    def recover(model, *args):
        calls[model] = calls.get(model, 0) + 1
        return raw if calls[model] == 1 else json.dumps(reply())
    recovered = run_jury(PACKET, CONFIG, recover)
    assert recovered["consensus"]["jurors_counted"] == len(CONFIG["models"])
    assert all(j["status"] == "valid" and j["attempts"] == 2 for j in recovered["jurors"])


def test_retry_recovery_and_exhaustion():
    calls = CounterCalls()
    result = run_jury(PACKET, CONFIG, calls)
    assert all(j["status"] == "valid" and j["attempts"] == 2 for j in result["jurors"])
    assert all(j["validation"]["errors"] == ["Attempt 1: JSON decoding failed"] for j in result["jurors"])
    invalid = run_jury(PACKET, CONFIG, lambda *args: "last raw reply")
    assert invalid["consensus"] == {"method": "borda", "jurors_counted": 0,
                                    "ranking": [], "kendalls_w": None, "contested": []}
    for j in invalid["jurors"]:
        assert j["status"] == "invalid" and j["reviews"] is None
        assert j["raw_output"] == "last raw reply" and j["attempts"] == 2
        assert len(j["validation"]["errors"]) == 2


class CounterCalls:
    def __init__(self):
        self.calls = {}

    def __call__(self, model, prompt, temperature):
        self.calls[model] = self.calls.get(model, 0) + 1
        return "invalid" if self.calls[model] == 1 else json.dumps(reply())


def test_failures_do_not_leak_secrets_or_fabricate_votes():
    def fail(*args):
        raise RuntimeError("secret PAT should never be recorded")
    result = run_jury(PACKET, CONFIG, fail)
    assert "secret PAT" not in json.dumps(result)
    assert result["consensus"]["jurors_counted"] == 0
    for j in result["jurors"]:
        assert j["status"] == "failed" and j["attempts"] == 2
        assert j["reviews"] is None and j["raw_output"] is None


def test_insufficient_jurors_and_single_candidate():
    assert consensus(PACKET, FIXTURE["jurors"][:1])["kendalls_w"] is None
    packet = deepcopy(PACKET)
    packet["candidates"] = packet["candidates"][:1]
    result = run_jury(packet, CONFIG, mock_model)
    assert result["consensus"]["kendalls_w"] is None
    assert result["consensus"]["ranking"][0]["borda_points"] == 0


def test_unanimous_and_opposite_rankings():
    juror = deepcopy(FIXTURE["jurors"][0])
    assert consensus(PACKET, [juror, juror])["kendalls_w"] == 1.0
    opposite = deepcopy(juror)
    for review in opposite["reviews"]:
        review["rank"] = len(PACKET["candidates"]) + 1 - review["rank"]
    result = consensus(PACKET, [juror, opposite])
    assert result["kendalls_w"] == 0.0
    assert [r["rank"] for r in result["ranking"]] == [1, 1, 1, 1]
    assert {r["borda_points"] for r in result["ranking"]} == {3}


def test_mixed_failures_retain_last_reply():
    calls = {}
    def model_call(model, *args):
        calls[model] = calls.get(model, 0) + 1
        if calls[model] == 1:
            return "last raw reply"
        raise TimeoutError("private request details")
    result = run_jury(PACKET, CONFIG, model_call)
    for juror in result["jurors"]:
        assert juror["status"] == "invalid"
        assert juror["raw_output"] == "last raw reply"
        assert juror["reviews"] is None
        assert juror["validation"]["errors"] == [
            "Attempt 1: JSON decoding failed", "Attempt 2: call failed (TimeoutError)"]


def test_bad_packet_and_config_fail_before_calls():
    packet = deepcopy(PACKET)
    packet["candidates"][1]["label"] = "C1"
    with pytest.raises(ValueError, match="duplicate"):
        validate_packet(packet)
    packet = deepcopy(PACKET)
    packet["candidates"][0]["safety_status"] = "unknown"
    with pytest.raises(ValueError, match="safety"):
        validate_packet(packet)
    for key, bad in (("models", ["a"]), ("models", ["a", "a", "b"]),
                     ("max_attempts", 0), ("shuffle_seed", True)):
        with pytest.raises(ValueError):
            validate_config({**CONFIG, key: bad})


def test_sdk_endpoint_auth_config_model_and_no_hidden_retries(monkeypatch):
    monkeypatch.setenv("SNOWFLAKE_ACCOUNT", "test-account")
    monkeypatch.setenv("SNOWFLAKE_PAT", "fake-test-token")
    real_openai = openai.OpenAI
    calls = []
    def handle(request):
        calls.append(request)
        assert str(request.url) == "https://test-account.snowflakecomputing.com/api/v2/cortex/v1/chat/completions"
        assert request.headers["authorization"] == "Bearer fake-test-token"
        body = json.loads(request.content)
        assert body["model"] == "configured-model" and body["temperature"] == 0
        return httpx.Response(200, json={"id": "test", "choices": [
            {"index": 0, "message": {"role": "assistant", "content": "OK"}, "finish_reason": "stop"}]})
    def factory(**kwargs):
        assert kwargs["max_retries"] == 0
        return real_openai(**kwargs, http_client=httpx.Client(transport=httpx.MockTransport(handle)))
    monkeypatch.setattr(openai, "OpenAI", factory)
    client = CortexModel()
    try:
        assert client("configured-model", "test prompt", 0) == "OK"
    finally:
        client.close()
    assert len(calls) == 1


def test_cli_mock(tmp_path):
    out = tmp_path / "result.json"
    process = subprocess.run([str(ROOT / ".venv/bin/python"), "-m", "jury",
                              "fixtures/evidence_packet.json", "--out", str(out), "--mock"],
                             cwd=ROOT, capture_output=True, text=True)
    assert process.returncode == 0, process.stderr
    result = json.loads(out.read_text())
    assert result["consensus"]["jurors_counted"] == 3
    assert all("Mock review" in j["reviews"][0]["rationale"] for j in result["jurors"])


@pytest.mark.network
def test_one_real_cortex_call():
    if not all(os.environ.get(k) for k in ("SNOWFLAKE_ACCOUNT", "SNOWFLAKE_PAT", "SNOWFLAKE_MODELS")):
        pytest.skip("Set SNOWFLAKE_ACCOUNT, SNOWFLAKE_PAT and SNOWFLAKE_MODELS")
    config = {**CONFIG, "models": json.loads(os.environ["SNOWFLAKE_MODELS"])}
    validate_config(config)
    client = CortexModel()
    try:
        text = client(config["models"][0], "Reply with the single word OK", config["temperature"])
        assert isinstance(text, str) and text.strip()
    finally:
        client.close()
