"""Live mode: the evidence ranking, stream A's jury mapping, and a real build when data exists."""

from __future__ import annotations

import json
import time
from typing import Any

import pytest

from oxhack_api.services import plain
from oxhack_api.services.live_jury import display_name, map_jury_result
from oxhack_api.services.ranking import EvidenceRanking, RankingInput
from oxhack_api.settings import REPO_ROOT

FIXTURES = REPO_ROOT / "fixtures"
DATA = REPO_ROOT / "data"


def drug(drug_id: str, *targets: str, regulator: str = "FDA") -> dict[str, Any]:
    return {
        "drug_id": drug_id,
        "name": drug_id,
        "approval": {"sources": [regulator] if regulator else [], "disease_ids": []},
        "targets": [{"target_id": t} for t in targets],
    }


def request(drugs: list[dict[str, Any]], scores: dict[str, float]) -> RankingInput:
    return RankingInput(
        disease_id="MONDO_0100096", target_ids=list(scores), scores=scores, drugs=drugs
    )


T1, T2, T3 = "ENSG00000000001", "ENSG00000000002", "ENSG00000000003"


def test_evidence_ranking_uses_each_drugs_best_target_and_breaks_ties_by_id() -> None:
    drugs = [drug("CHEMBL9", T2), drug("CHEMBL10", T1, T3), drug("CHEMBL2", T2), drug("CHEMBL7")]
    ranking = EvidenceRanking().rank(request(drugs, {T1: 0.4, T2: 0.9, T3: 0.95}), frozenset())
    # CHEMBL10's best Target scores 0.95; CHEMBL2 and CHEMBL9 tie at 0.9 and sort by ID as
    # strings; CHEMBL7 has no Target linked to the Disease and is left out.
    assert [r.candidate_id for r in ranking.shortlist] == ["CHEMBL10", "CHEMBL2", "CHEMBL9"]
    assert ranking.eligible == 3
    assert ranking.network is None


def test_evidence_ranking_skips_drugs_without_regulator_approval() -> None:
    drugs = [drug("CHEMBL1", T1, regulator=""), drug("CHEMBL2", T1)]
    ranking = EvidenceRanking().rank(request(drugs, {T1: 0.5}), frozenset())
    assert [r.candidate_id for r in ranking.shortlist] == ["CHEMBL2"]


def test_evidence_ranking_never_invents_a_network_result() -> None:
    ranking = EvidenceRanking().rank(request([drug("CHEMBL1", T1)], {T1: 0.5}), frozenset())
    [only] = ranking.shortlist
    assert only.network is None
    assert only.status == "not_scorable"
    assert only.unscorable_reason == "network_unavailable"
    assert only.direct_evidence_rank == 1


def test_evidence_ranking_is_deterministic_and_respects_exclusions() -> None:
    drugs = [drug(f"CHEMBL{i}", T1 if i % 2 else T2) for i in range(1, 40)]
    scores = {T1: 0.7, T2: 0.7}
    first = EvidenceRanking().rank(request(drugs, scores), frozenset({"CHEMBL1"}))
    second = EvidenceRanking().rank(request(list(reversed(drugs)), scores), frozenset({"CHEMBL1"}))
    ids = [r.candidate_id for r in first.shortlist]
    assert ids == [r.candidate_id for r in second.shortlist]
    assert len(ids) == 15
    assert "CHEMBL1" not in ids


def test_stream_a_jury_result_maps_without_inventing_votes() -> None:
    result = json.loads((FIXTURES / "jury_result.json").read_text())
    packet = json.loads((FIXTURES / "evidence_packet.json").read_text())
    mapped = map_jury_result(result, packet)

    statuses = {j.model_id: j.status for j in mapped.jurors}
    invalid = [model for model, status in statuses.items() if status == "invalid"]
    assert invalid, "the fixture records an invalid juror"
    for model in invalid:
        assert model not in mapped.votes
    for juror, recorded in zip(mapped.jurors, result["jurors"], strict=True):
        assert [u.model_dump() for u in juror.token_usage] == recorded.get("token_usage", [])
    labels = {c["label"]: c["candidate_id"] for c in packet["candidates"]}
    assert set(mapped.outcome.contested) <= set(labels.values())
    assert mapped.outcome.agreement == result["consensus"]["kendalls_w"]


@pytest.mark.parametrize(
    ("model_id", "expected"),
    [
        ("claude-opus-5-5", "Claude Opus 5.5"),
        ("claude-sonnet-5", "Claude Sonnet 5"),
        ("openai-gpt-5.4", "GPT-5.4"),
        ("glm-5.3", "GLM-5.3"),
        ("kimi-k3", "Kimi K3"),
    ],
)
def test_model_display_names(model_id: str, expected: str) -> None:
    assert display_name(model_id) == expected


def test_network_unavailable_reason_is_plain() -> None:
    text = plain.network_unavailable("Baricitinib", "COVID-19")
    assert "network" in text
    assert "z-score" not in text


needs_data = pytest.mark.skipif(
    not (DATA / "drug_targets.json").is_file(),
    reason="run `uv run python -m oxhack_api.prepare` first to download the live data",
)


@needs_data
@pytest.mark.network
def test_live_covid_build_end_to_end() -> None:
    """A real build over the prepared data (Open Targets is called for the Disease)."""
    from fastapi.testclient import TestClient

    from oxhack_api.app import build_components, create_app
    from oxhack_api.settings import Settings

    settings = Settings(source="live", jury="mock", fixture_delay_ms=0)
    experiment: dict[str, Any] = {}
    with TestClient(create_app(components=build_components(settings))) as client:
        created = client.post("/api/experiments", json={"disease_id": "MONDO_0100096"}).json()
        for _ in range(600):
            experiment = client.get(f"/api/experiments/{created['id']}").json()
            if experiment["status"] in {"ready", "failed"}:
                break
            time.sleep(0.5)
    assert experiment["status"] == "ready", experiment.get("error")
    assert experiment["ranking_method"] == "evidence_only"
    candidates: list[dict[str, Any]] = experiment["candidates"]
    assert 0 < len(candidates) <= 15
    banned = ("pChEMBL", "evidence-only", "ChEMBL", "Open Targets", "Black Box")
    for candidate in candidates:
        assert candidate["network"] is None
        items: list[dict[str, Any]] = candidate["evidence"]
        for item in items:
            assert not any(word in item["summary"] for word in banned), item["summary"]


def test_snowflake_json_settings_fail_plainly(monkeypatch: pytest.MonkeyPatch) -> None:
    """uv's .env reader drops the double quotes of an unquoted JSON value."""
    from pydantic import ValidationError

    from oxhack_api.settings import SnowflakeSettings

    monkeypatch.setenv("SNOWFLAKE_MODELS", "[claude-opus-5-5,openai-gpt-5.4,kimi-k3]")
    with pytest.raises(ValidationError, match="wrap the JSON in single quotes"):
        SnowflakeSettings()
    monkeypatch.setenv("SNOWFLAKE_MODELS", '["a","b","c"]')
    monkeypatch.setenv("SNOWFLAKE_REASONING_EFFORT", "")
    settings = SnowflakeSettings()
    assert settings.models == ["a", "b", "c"]
    assert settings.reasoning_effort == {}


def test_database_url_accepts_the_codespace_name(monkeypatch: pytest.MonkeyPatch) -> None:
    from oxhack_api.settings import Settings

    monkeypatch.delenv("OXHACK_DATABASE_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", "postgresql://example/db")
    assert Settings().database_url == "postgresql://example/db"
    monkeypatch.setenv("OXHACK_DATABASE_URL", "postgresql://preferred/db")
    assert Settings().database_url == "postgresql://preferred/db"
    assert Settings(database_url="postgresql://kwarg/db").database_url == "postgresql://kwarg/db"
