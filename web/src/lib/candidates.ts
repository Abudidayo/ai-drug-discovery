import type { Candidate, NetworkGraph } from "../api/types";
import { copy } from "../copy/en";
import { drugName, listOf } from "./format";

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
