"""The live Model jury: stream A's `jury.client.run_jury` (`OXHACK_JURY=mock|cortex`).

- **cortex**: the three models in `SNOWFLAKE_MODELS`, through stream A's
  `CortexModel` (Snowflake Cortex, `SNOWFLAKE_ACCOUNT` and `SNOWFLAKE_PAT`), with
  `SNOWFLAKE_REASONING_EFFORT` saved in `jury_config.reasoning_effort`.
- **mock**: stream A's `mock_model`, a practice review. No model is called; every
  ballot is a placeholder ("Mock review: no scientific assessment was
  performed"). `jury_config.mode` is `mock` and the jurors are named "Practice
  reviewer A/B/C", so the UI can say so.

Both send the same blinded evidence packet, rebuilt from the saved Experiment
(`jury_packet`), and map stream A's result onto `Juror`, `JuryVote` and the
consensus. Stream A runs the jurors one after another and returns only at the
end; it has no per-juror callback yet. Until it does, this backend reports each
juror as `running` when stream A first asks it, and saves every review when the
run finishes.
"""

from __future__ import annotations

import logging
import queue
import random
import threading
from collections.abc import Generator
from dataclasses import dataclass
from typing import Literal, cast

from ..schemas import (
    Consensus,
    ConsensusEntry,
    Experiment,
    Juror,
    JuryConfig,
    JuryModel,
    JuryVote,
    SafetyReview,
    TokenUsage,
)
from ..stream_a import (
    JSON,
    PACKET_SHUFFLE_SEED,
    PROMPT_VERSION,
    ModelCall,
    cortex_model,
    jury_settings,
    mock_model,
    run_jury,
    validate_packet,
)
from .jury import JurorFinished, JurorStarted, JuryOutcome, JurySteps, JuryUnavailable

log = logging.getLogger(__name__)

LiveJuryMode = Literal["mock", "cortex"]

# Known Cortex model families, by model ID prefix, with how to show the name.
_FAMILIES: list[tuple[str, str]] = [
    ("claude-", "Anthropic"),
    ("openai-", "OpenAI"),
    ("gpt-", "OpenAI"),
    ("glm-", "Zhipu"),
    ("llama", "Meta"),
    ("mistral", "Mistral AI"),
    ("mixtral", "Mistral AI"),
    ("deepseek", "DeepSeek"),
    ("kimi", "Moonshot AI"),
    ("snowflake-", "Snowflake"),
    ("gemma", "Google"),
]
_UPPER = {"gpt", "glm", "ai"}


def model_family(model_id: str) -> str:
    """The company behind a Cortex model ID, or the ID itself when unknown."""
    lowered = model_id.lower()
    return next((family for prefix, family in _FAMILIES if lowered.startswith(prefix)), model_id)


def display_name(model_id: str) -> str:
    """A readable name for a Cortex model ID: claude-sonnet-5 is Claude Sonnet 5,
    claude-opus-5-5 is Claude Opus 5.5 (Cortex writes version dots as hyphens),
    openai-gpt-5.4 is GPT-5.4, glm-5.3 is GLM-5.3, kimi-k3 is Kimi K3."""
    name = model_id.removeprefix("openai-")
    words: list[str] = []
    for word in name.split("-"):
        if word.isdigit() and words and words[-1].replace(".", "").isdigit():
            words[-1] = f"{words[-1]}.{word}"
        else:
            words.append(word)
    if words[0].lower() in _UPPER and len(words) > 1:
        return f"{words[0].upper()}-{'-'.join(words[1:])}"
    return " ".join(w.upper() if w.lower() in _UPPER else w.capitalize() for w in words)


def jury_packet(experiment: Experiment) -> JSON:
    """The blinded evidence packet stream A's jury reads, rebuilt from the Experiment.

    Equal to the packet `build_evidence_packet` stored for a live build: the same
    evidence items (without the plain summaries), and the same C labels (the
    Candidates in ChEMBL ID order, shuffled with its seed). Works for fixture
    Experiments too.
    """
    ordered = sorted(experiment.candidates, key=lambda c: c.candidate_id)
    random.Random(PACKET_SHUFFLE_SEED).shuffle(ordered)
    evidence: dict[str, JSON] = {}
    for candidate in experiment.candidates:
        for item in candidate.evidence:
            evidence[item.id] = item.model_dump(mode="json", exclude={"summary"})
    return {
        "experiment_id": str(experiment.id),
        "disease": {"id": experiment.disease.id, "name": experiment.disease.name},
        "releases": list(experiment.data_releases),
        "candidates": [
            {
                "label": f"C{index}",
                "candidate_id": c.candidate_id,
                "name": c.name,
                "targets": [t.model_dump(mode="json") for t in c.targets],
                "evidence_ids": [item.id for item in c.evidence],
                "safety_status": c.safety_status,
            }
            for index, c in enumerate(ordered, 1)
        ],
        "evidence": [evidence[key] for key in sorted(evidence, key=lambda e: int(e[1:]))],
    }


@dataclass(frozen=True)
class MappedJury:
    """Stream A's jury result in the API's terms."""

    jurors: list[Juror]
    votes: dict[str, list[JuryVote]]
    """Each valid juror's votes, by model ID."""
    outcome: JuryOutcome


def map_jury_result(result: JSON, packet: JSON) -> MappedJury:
    """Map `run_jury`'s result onto the contract. Invalid and failed jurors keep their
    attempts, errors and token usage, and contribute no vote."""
    labels = {c["label"]: cast(str, c["candidate_id"]) for c in packet["candidates"]}
    jurors: list[Juror] = []
    votes: dict[str, list[JuryVote]] = {}
    for juror in result["jurors"]:
        model_id = cast(str, juror["model"])
        jurors.append(
            Juror(
                model_id=model_id,
                status=juror["status"],
                attempts=juror["attempts"],
                latency_ms=juror["latency_ms"],
                errors=list(juror["validation"]["errors"]),
                token_usage=[
                    TokenUsage(
                        attempt=usage["attempt"],
                        input_tokens=usage["input_tokens"],
                        output_tokens=usage["output_tokens"],
                    )
                    for usage in juror.get("token_usage", [])
                ],
            )
        )
        if juror["status"] != "valid":
            continue
        votes[model_id] = [
            JuryVote(
                model_id=model_id,
                candidate_id=labels[review["label"]],
                rank=review["rank"],
                decision=review["decision"],
                direction=review["direction"],
                rationale=review["rationale"],
                objection=review["objection"],
                missing_evidence=list(review["missing_evidence"]),
                supporting_evidence_ids=list(review["supporting_evidence_ids"]),
                contradicting_evidence_ids=list(review["contradicting_evidence_ids"]),
                safety=SafetyReview.model_validate(review["safety"]),
            )
            for review in juror["reviews"]
        ]
    combined = result["consensus"]
    consensus = Consensus(
        method=combined["method"],
        jurors_counted=combined["jurors_counted"],
        ranking=[
            ConsensusEntry(
                candidate_id=labels[entry["label"]],
                rank=entry["rank"],
                borda_points=entry["borda_points"],
            )
            for entry in combined["ranking"]
        ],
    )
    outcome = JuryOutcome(
        consensus=consensus,
        agreement=combined["kendalls_w"],
        contested=[labels[label] for label in combined["contested"]],
    )
    return MappedJury(jurors=jurors, votes=votes, outcome=outcome)


class StreamAJury:
    """Implements `JuryBackend` with stream A's jury, in mock or Cortex mode."""

    def __init__(
        self,
        mode: LiveJuryMode,
        *,
        models: list[str] | None = None,
        reasoning_effort: dict[str, str | None] | None = None,
    ) -> None:
        shared = jury_settings()
        self.mode: LiveJuryMode = mode
        if mode == "mock":
            ids = cast(list[str], shared["models"])
            self._models = [
                JuryModel(
                    id=model_id,
                    display_name=f"Practice reviewer {chr(ord('A') + index)}",
                    family="Practice review (no model called)",
                )
                for index, model_id in enumerate(ids)
            ]
            effort: dict[str, str] = {}
        else:
            if not models:
                raise ValueError("A Cortex jury needs its three model IDs (SNOWFLAKE_MODELS)")
            self._models = [
                JuryModel(id=m, display_name=display_name(m), family=model_family(m))
                for m in models
            ]
            effort = {m: e for m, e in (reasoning_effort or {}).items() if e is not None}
        self._config = JuryConfig(
            mode=mode,
            models=self._models,
            prompt_version=PROMPT_VERSION,
            temperature=shared["temperature"],
            max_attempts=shared["max_attempts"],
            shuffle_seed=shared["shuffle_seed"],
            reasoning_effort=effort,
        )

    def configure(self, proposed: JuryConfig | None) -> JuryConfig:
        return self._config.model_copy(deep=True)

    def review(self, experiment: Experiment) -> JurySteps:
        config = experiment.jury_config
        if config.mode != self.mode:
            raise JuryUnavailable(
                f"This Experiment's jury is {config.mode}, but the API runs a {self.mode} jury."
            )
        if not experiment.candidates:
            raise JuryUnavailable("There are no Candidates for the Model jury to review.")
        packet = jury_packet(experiment)
        try:
            validate_packet(packet)
        except ValueError as exc:
            raise JuryUnavailable(f"The evidence cannot be sent to the jury: {exc}") from exc
        settings: JSON = {
            "models": [m.id for m in config.models],
            "prompt_version": config.prompt_version,
            "temperature": config.temperature,
            "max_attempts": config.max_attempts,
            "shuffle_seed": config.shuffle_seed,
            "reasoning_effort": {m.id: config.reasoning_effort.get(m.id) for m in config.models},
        }
        result = yield from self._run(packet, settings, dict(config.reasoning_effort))
        mapped = map_jury_result(result, packet)
        for juror in mapped.jurors:
            yield JurorFinished(juror, mapped.votes.get(juror.model_id, []))
        if mapped.outcome.consensus.jurors_counted == 0:
            raise JuryUnavailable(
                "No juror returned a review that passed the checks, so there is no consensus. "
                "Each juror's errors say why."
            )
        return mapped.outcome

    def _run(
        self, packet: JSON, settings: JSON, effort: dict[str, str]
    ) -> Generator[JurorStarted, None, JSON]:
        """Run stream A's jury on a helper thread, yielding each juror as it starts."""
        events: queue.Queue[str | JSON | BaseException] = queue.Queue()
        started: set[str] = set()

        def run() -> None:
            client: ModelCall | None = None
            try:
                client = mock_model if self.mode == "mock" else cortex_model(effort)
                inner = client

                def call(model: str, prompt: str, temperature: float) -> object:
                    if model not in started:
                        started.add(model)
                        events.put(model)
                    return inner(model, prompt, temperature)

                events.put(run_jury(packet, settings, call))
            except BaseException as exc:  # handed to the job, which records it
                events.put(exc)
            finally:
                close = getattr(client, "close", None)
                if callable(close):
                    close()

        threading.Thread(target=run, name="oxhack-jury", daemon=True).start()
        while True:
            event = events.get()
            if isinstance(event, str):
                yield JurorStarted(event)
            elif isinstance(event, BaseException):
                # Provider exceptions can carry credentials; only the type is shown or logged.
                log.warning("stream A's jury raised %s", type(event).__name__)
                raise JuryUnavailable(
                    f"The Model jury could not run ({type(event).__name__})."
                ) from None
            else:
                return event
