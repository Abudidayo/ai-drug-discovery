"""The ranking seam: how the live source picks a Disease's shortlist.

`LiveSource` hands a `RankingBackend` the Disease's Targets, every Target's
evidence-only score and the approved drug universe, and gets back the shortlist
in order, with why each drug was selected.

- `EvidenceRanking` is plan.md section 4.4's transparent fallback and today's
  only backend: stream A's direct Target-evidence baseline
  (`pipeline.experiment.direct_shortlist`). The Experiment says so
  (`ranking_method` evidence_only): no network is drawn, no network score is
  invented, and every Candidate is `not_scorable` with `network_unavailable`.
- `NetworkRanking` is where stream B's network-proximity ranking will plug in
  once it merges. It is a stub until then.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

from ..schemas import (
    SHORTLIST_MAX,
    CandidateNetwork,
    CandidateStatus,
    DataRelease,
    NetworkGraph,
    RankingMethod,
    RankingSettings,
    SelectedBy,
    SelectionReason,
    TargetExcludedReason,
    UnscorableReason,
)
from ..stream_a import JSON, direct_shortlist


@dataclass(frozen=True)
class RankingInput:
    """What a ranking sees. Nothing here names a drug's indications or trials."""

    disease_id: str
    target_ids: list[str]
    """The selected Disease Targets (the top `top_targets` by evidence-only score)."""
    scores: Mapping[str, float]
    """Evidence-only association score of every Target associated with the Disease."""
    drugs: Sequence[JSON]
    """The approved drug universe: `drug_targets.json` rows (stream A A2)."""


@dataclass(frozen=True)
class Ranked:
    """One shortlisted drug, as the ranking placed it."""

    candidate_id: str
    status: CandidateStatus
    selected_by: list[SelectedBy]
    selection_reasons: list[SelectionReason]
    network: CandidateNetwork | None
    unscorable_reason: UnscorableReason | None
    direct_evidence_rank: int | None


@dataclass(frozen=True)
class Ranking:
    """A ranking's shortlist, in shortlist order, and what it used."""

    shortlist: list[Ranked]
    eligible: int
    """Drugs the ranking could place at all, of which the shortlist is the top."""
    network: NetworkGraph | None
    """The subgraph to draw; None when no network ranking ran."""
    excluded_targets: dict[str, TargetExcludedReason] = field(
        default_factory=dict[str, TargetExcludedReason]
    )
    """Disease Targets the ranking could not use, and why; the rest are retained."""


class RankingBackend(Protocol):
    method: RankingMethod
    releases: list[DataRelease]
    """Releases the ranking adds to the Experiment's, e.g. the network's string-12.5."""

    def settings(self) -> RankingSettings: ...

    def rank(self, request: RankingInput, exclude: frozenset[str]) -> Ranking:
        """The shortlist of at most SHORTLIST_MAX drugs, leaving out `exclude` (drugs the
        caller found ineligible, e.g. with no confirmed regulator approval). The same
        input always gives the same result."""
        ...


class EvidenceRanking:
    """plan.md section 4.4: "Evidence ranking - network unavailable".

    Stream A's direct Target-evidence baseline, unchanged: each regulator-approved
    drug scores the highest evidence-only association score among its own Targets
    (every Target associated with the Disease counts, not only the top 50); drugs
    with no positive score are left out; the rest are ranked by that score, highest
    first, ties broken by ChEMBL ID in string order; the top 15 are the shortlist.
    No drug name, indication or trial is looked at.
    """

    method: RankingMethod = "evidence_only"

    def __init__(self, top_targets: int = 50) -> None:
        self._top_targets = top_targets
        self.releases: list[DataRelease] = []

    def settings(self) -> RankingSettings:
        return RankingSettings(
            top_targets=self._top_targets,
            randomisations=None,
            seed=None,
            min_bin_size=None,
            network_slots=0,
            evidence_slots=SHORTLIST_MAX,
        )

    def rank(self, request: RankingInput, exclude: frozenset[str]) -> Ranking:
        drugs = [drug for drug in request.drugs if drug["drug_id"] not in exclude]
        ids, eligible = direct_shortlist(drugs, dict(request.scores))
        shortlist = [
            Ranked(
                candidate_id=candidate_id,
                status="not_scorable",
                selected_by=["evidence"],
                selection_reasons=["evidence_ranking_network_unavailable"],
                network=None,
                unscorable_reason="network_unavailable",
                direct_evidence_rank=rank,
            )
            for rank, candidate_id in enumerate(ids, 1)
        ]
        return Ranking(shortlist=shortlist, eligible=eligible, network=None)


class NetworkRanking:
    """Stream B's network-proximity ranking (Zaid's `ranking.scoring.RankingEngine`).

    Not available yet: stream B is not merged and needs its STRING-built artefact
    bundle (a 157 MiB distance matrix). When it lands, this adapter should:

    - load `ranking.scoring.load_artifacts(artifacts_dir)` once and keep one
      `RankingEngine(artifacts, RankingSettings())`, so each Disease costs a
      lookup (about 4.6 s), not a rebuild;
    - pass `RankingInput.target_ids` and the eligible drugs, minus `exclude`;
    - map its statuses (`scored`, `distance_only`, `not_scorable`) and coded
      `unscorable_reason` onto the contract's, and its Target coverage onto
      `excluded_targets` (`not_in_graph`, `outside_largest_component`);
    - fill the shortlist 10 network + 5 evidence, deduplicated, then from the
      next eligible drugs to 15, recording each selection reason
      (plan.md section 4.4);
    - cut the drawn subgraph down to the routes from Candidate Targets to
      Disease Targets, and archive the full output with its SHA-256;
    - report `method = "network"`, the network settings and `string-12.5`.
    """

    method: RankingMethod = "network"

    def __init__(self, artifacts_dir: Path) -> None:
        self.releases: list[DataRelease] = ["string-12.5"]
        raise NotImplementedError(
            f"Stream B's network ranking is not merged yet (artefacts: {artifacts_dir}). "
            "Use EvidenceRanking."
        )

    def settings(self) -> RankingSettings:
        raise NotImplementedError

    def rank(self, request: RankingInput, exclude: frozenset[str]) -> Ranking:
        raise NotImplementedError
