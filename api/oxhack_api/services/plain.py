"""Plain-language summaries of evidence, for students.

Each EvidenceItem keeps its precise, source-naming `statement` (the jury and
audits use it). `summary` says the same fact in words a student can read at a
glance: no database names, no score names, no units they haven't met. Both
the fixtures and the live pipeline build summaries with these functions, so
the wording stays the same everywhere.
"""

from __future__ import annotations

# ChEMBL action types, as verbs.
_ACTIONS: dict[str, str] = {
    "inhibitor": "Blocks",
    "antagonist": "Blocks",
    "negative allosteric modulator": "Dampens",
    "blocker": "Blocks",
    "agonist": "Activates",
    "partial agonist": "Partly activates",
    "positive allosteric modulator": "Boosts",
    "activator": "Activates",
    "modulator": "Changes the activity of",
    "binding agent": "Binds",
    "degrader": "Breaks down",
}

# Open Targets toxicity classes on drug labels, in everyday words.
_TOXICITY: dict[str, str] = {
    "infectious disease": "serious infections",
    "vascular toxicity": "blood clots and blood vessel problems",
    "carcinogenicity": "cancer",
    "teratogenicity": "harm to an unborn baby",
    "respiratory toxicity": "lung problems",
    "gastrointestinal toxicity": "gut problems",
    "hepatotoxicity": "liver damage",
    "cardiotoxicity": "heart problems",
    "nephrotoxicity": "kidney damage",
    "neurotoxicity": "nerve damage",
    "hematological toxicity": "blood problems",
    "dermatological toxicity": "serious skin reactions",
    "psychiatric toxicity": "mood or behaviour changes",
    "immune system toxicity": "immune system problems",
    "metabolic toxicity": "metabolic problems",
    "musculoskeletal toxicity": "muscle or bone problems",
}

_REGULATORS: dict[str, str] = {
    "FDA": "the US regulator (FDA)",
    "EMA": "the European regulator (EMA)",
    "PMDA": "Japan's regulator (PMDA)",
    "DailyMed": "the US regulator (FDA)",
}


def join(names: list[str], limit: int = 4) -> str:
    """'A', 'A and B', 'A, B and C'; past `limit` names, a count with two examples."""
    if len(names) > limit:
        return f"{len(names)} proteins, including {names[0]} and {names[1]}"
    if len(names) <= 2:
        return " and ".join(names)
    return ", ".join(names[:-1]) + " and " + names[-1]


def target_association(target: str, disease: str, score: float) -> str:
    return f"{target} is linked to {disease} (link strength {score:.2f})."


def mechanism(target: str, action_type: str | None) -> str:
    verb = _ACTIONS.get((action_type or "").lower(), "Acts on")
    return f"{verb} {target}."


def mechanism_non_human(description: str, action_type: str | None) -> str:
    """A drug whose only target isn't a human protein, e.g. a viral enzyme."""
    verb = _ACTIONS.get((action_type or "").lower(), "Acts on")
    return f"{verb} {description}, which is not a human protein."


def bioactivity(target: str, median_pchembl: float, n_activities: int) -> str:
    # pChEMBL is -log10(molar potency): 8 is about 10 nM, 7 about 100 nM, 6 about 1 uM.
    if median_pchembl >= 8:
        strength = "very strongly"
    elif median_pchembl >= 7:
        strength = "strongly"
    elif median_pchembl >= 6:
        strength = "moderately"
    else:
        strength = "weakly"
    tests = "test" if n_activities == 1 else "tests"
    return f"Binds {target} {strength} in lab tests ({n_activities} {tests})."


def approval(regulator: str) -> str:
    return f"Approved by {_REGULATORS.get(regulator, regulator)}."


def warning(toxicity_class: str | None) -> str:
    """One label risk, lower case, to be joined into the warning sentence."""
    if not toxicity_class:
        return "serious risks listed on the label"
    return _TOXICITY.get(toxicity_class.lower(), toxicity_class.lower())
