import type { Candidate, NetworkGraph } from "../api/types";
import { copy } from "../copy/en";
import { capitalise, drugName, listOf } from "./format";

/** A Candidate that has a place in the protein network: scored or distance_only. */
export type PlacedCandidate = Candidate & { network: NonNullable<Candidate["network"]> };

export function isPlaced(candidate: Candidate): candidate is PlacedCandidate {
  return candidate.network !== null;
}

/** Placed Candidates in network-rank order; scored ones always rank before distance_only ones. */
export function byNetworkRank(candidates: readonly Candidate[]): PlacedCandidate[] {
  return candidates.filter(isPlaced).sort((a, b) => a.network.rank - b.network.rank);
}

/**
 * The Candidate the Evidence step is about: the one asked for, else the known-answer check, else
 * the top of the shortlist.
 */
export function focusCandidate(
  candidates: readonly Candidate[],
  preferredId?: string | null,
): Candidate | undefined {
  return (
    candidates.find((candidate) => candidate.candidate_id === preferredId) ??
    candidates.find((candidate) => candidate.known_answer) ??
    candidates[0]
  );
}

/** Protein IDs a Candidate acts on that are drawn in the network. */
export function drawnTargets(candidate: Candidate, graph: NetworkGraph): string[] {
  const drawn = new Set(graph.nodes.map((node) => node.id));
  return candidate.targets.map((target) => target.id).filter((id) => drawn.has(id));
}

/**
 * The route from a Candidate to the Disease in plain words, naming each protein by its symbol.
 * Null when the Candidate has no place in the network.
 */
export function routeSentence(candidate: Candidate, graph: NetworkGraph): string | null {
  if (candidate.network === null) return null;
  const symbols = new Map(graph.nodes.map((node) => [node.id, node.symbol]));
  const names = candidate.network.path.map((id) => symbols.get(id) ?? id);
  const drug = drugName(candidate.name);
  const [first, ...rest] = names;
  if (first === undefined) return null;
  const last = rest.at(-1);
  if (last === undefined) return copy.evidence.route.self(drug, first);
  const through = rest.slice(0, -1);
  if (through.length === 0) return copy.evidence.route.direct(drug, first, last);
  return copy.evidence.route.via(drug, first, last, listOf(through));
}

/**
 * The label risks as one plain sentence, from each cited warning's summary, e.g. "Serious
 * infections, cancer and lung problems." Null when no warning is recorded.
 */
export function warningSentence(candidate: Candidate): string | null {
  const byId = new Map(candidate.evidence.map((item) => [item.id, item]));
  const risks: string[] = [];
  for (const warning of candidate.warnings) {
    const summary = byId.get(warning.evidence_id)?.summary.replace(/\.$/, "");
    if (summary === undefined) continue;
    const risk = summary.charAt(0).toLowerCase() + summary.slice(1);
    if (!risks.includes(risk)) risks.push(risk);
  }
  return risks.length === 0 ? null : `${capitalise(listOf(risks))}.`;
}

/** What the regulators' approval records say, e.g. "Approved by the US regulator (FDA)." */
export function approvals(candidate: Candidate): string[] {
  return [
    ...new Set(
      candidate.evidence.filter((item) => item.kind === "approval").map((item) => item.summary),
    ),
  ];
}

/** How many drugs the Compare step puts side by side. */
export const COMPARED = 3;

/**
 * The drugs compared first: the known-answer drug and the two after it on the shortlist (or the
 * top three when there is no known answer).
 */
export function defaultPicks(candidates: readonly Candidate[]): string[] {
  const ids = candidates.map((candidate) => candidate.candidate_id);
  const start = Math.max(
    0,
    candidates.findIndex((candidate) => candidate.known_answer),
  );
  const picks = [...ids.slice(start), ...ids.slice(0, start)];
  return picks.slice(0, Math.min(COMPARED, ids.length));
}
