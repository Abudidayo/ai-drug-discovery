"""Plain-language evidence summaries: the wording students see."""

from __future__ import annotations

import json

import pytest

from oxhack_api.services import plain
from oxhack_api.settings import FIXTURES_DIR


def test_target_association() -> None:
    assert plain.target_association("TYK2", "COVID-19", 0.714) == (
        "TYK2 is linked to COVID-19 (link strength 0.71)."
    )


@pytest.mark.parametrize(
    ("action", "expected"),
    [
        ("INHIBITOR", "Blocks JAK1."),
        ("antagonist", "Blocks JAK1."),
        ("AGONIST", "Activates JAK1."),
        (None, "Acts on JAK1."),
        ("something new", "Acts on JAK1."),
    ],
)
def test_mechanism_verbs(action: str | None, expected: str) -> None:
    assert plain.mechanism("JAK1", action) == expected


@pytest.mark.parametrize(
    ("pchembl", "strength"),
    [(8.0, "very strongly"), (7.5, "strongly"), (6.2, "moderately"), (5.1, "weakly")],
)
def test_bioactivity_strength(pchembl: float, strength: str) -> None:
    assert plain.bioactivity("AAK1", pchembl, 9) == f"Binds AAK1 {strength} in lab tests (9 tests)."


def test_bioactivity_single_test() -> None:
    assert plain.bioactivity("AAK1", 7.0, 1).endswith("(1 test).")


def test_join() -> None:
    assert plain.join(["A"]) == "A"
    assert plain.join(["A", "B"]) == "A and B"
    assert plain.join(["A", "B", "C"]) == "A, B and C"
    assert plain.join([f"T{i}" for i in range(15)]) == "15 proteins, including T0 and T1"


def test_warning_falls_back_to_plain_text() -> None:
    assert plain.warning("carcinogenicity") == "cancer"
    assert plain.warning(None) == "serious risks listed on the label"
    assert plain.warning("Some New Class") == "some new class"


def test_approval_names_the_regulator() -> None:
    assert plain.approval("EMA") == "Approved by the European regulator (EMA)."


BANNED = ("pChEMBL", "evidence-only", "association score", "Open Targets", "ChEMBL", "Black Box")


def test_fixture_summaries_are_plain() -> None:
    """Every fixture summary exists and avoids database and score jargon."""
    for path in FIXTURES_DIR.glob("*/experiment.json"):
        experiment = json.loads(path.read_text())
        for candidate in experiment["candidates"]:
            for item in candidate["evidence"]:
                summary = item["summary"]
                assert summary.endswith("."), summary
                assert not any(word in summary for word in BANNED), summary
