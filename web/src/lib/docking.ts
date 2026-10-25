import type { Candidate, DockJob, Structure } from "../api/types";
import { isAntibody } from "./candidates";

/**
 * Which drug can be docked into which prepared structure, and why the others can't (plan.md §7:
 * unsupported pairs stay visible with a plain reason).
 */

/** Why a Candidate has no binding pose to offer. */
export type UnsupportedReason = "antibody" | "no_structure" | "not_dockable";

/**
 * The structure a Candidate is docked into: its own co-crystal structure when there is one, else
 * the first prepared structure of one of its targets. A structure is only ever used for the
 * protein it contains. Undefined when the Candidate can't be docked.
 */
export function structureFor(
  candidate: Candidate,
  structures: readonly Structure[],
): Structure | undefined {
  if (!candidate.dockable) return undefined;
  const targets = new Set(candidate.targets.map((target) => target.id));
  const usable = structures.filter((structure) => targets.has(structure.target_id));
  return (
    usable.find((structure) => structure.ligand.candidate_id === candidate.candidate_id) ??
    usable[0]
  );
}

/**
 * Why a Candidate can't be docked: antibodies have no small-molecule structure, some drugs act
 * only on proteins without a prepared structure, and the rest lack what docking needs. A missing
 * PubChem compound alone doesn't make a drug an antibody. Null when it can be docked.
 */
export function unsupportedReason(
  candidate: Candidate,
  structures: readonly Structure[],
): UnsupportedReason | null {
  if (structureFor(candidate, structures) !== undefined) return null;
  if (candidate.pubchem_cid === null && isAntibody(candidate)) return "antibody";
  const targets = new Set(candidate.targets.map((target) => target.id));
  if (!structures.some((structure) => targets.has(structure.target_id))) return "no_structure";
  return "not_dockable";
}

export interface DockingChoices {
  /** Candidates with a structure to dock into, in shortlist order. */
  supported: { candidate: Candidate; structure: Structure }[];
  /** The rest, grouped by reason, each group in shortlist order. */
  unsupported: { reason: UnsupportedReason; candidates: Candidate[] }[];
}

const REASON_ORDER: readonly UnsupportedReason[] = ["no_structure", "antibody", "not_dockable"];

export function dockingChoices(
  candidates: readonly Candidate[],
  structures: readonly Structure[],
): DockingChoices {
  const supported: DockingChoices["supported"] = [];
  const groups = new Map<UnsupportedReason, Candidate[]>();
  for (const candidate of candidates) {
    const structure = structureFor(candidate, structures);
    if (structure !== undefined) {
      supported.push({ candidate, structure });
      continue;
    }
    const reason = unsupportedReason(candidate, structures) ?? "not_dockable";
    groups.set(reason, [...(groups.get(reason) ?? []), candidate]);
  }
  const unsupported = REASON_ORDER.flatMap((reason) => {
    const group = groups.get(reason);
    return group === undefined ? [] : [{ reason, candidates: group }];
  });
  return { supported, unsupported };
}

/** The drug the step opens on: the known-answer drug when it can be docked, else the first. */
export function defaultDockingChoice(choices: DockingChoices): string | undefined {
  const known = choices.supported.find(({ candidate }) => candidate.known_answer);
  return (known ?? choices.supported[0])?.candidate.candidate_id;
}

/** The latest request for this drug in this structure on the Experiment, if any. */
export function jobFor(
  jobs: readonly DockJob[],
  candidateId: string,
  structureId: string,
): DockJob | undefined {
  return jobs
    .filter(
      (job) =>
        job.kind === "candidate" &&
        job.candidate_id === candidateId &&
        job.structure_id === structureId,
    )
    .reduce<DockJob | undefined>(
      (latest, job) => (latest === undefined || job.created_at >= latest.created_at ? job : latest),
      undefined,
    );
}

/** The best pose's score, or null until there is one. Pose 1 is the best-scoring pose. */
export function bestScore(job: DockJob): number | null {
  const scores = job.scores ?? [];
  const best = scores.find((score) => score.pose === 1) ?? scores[0];
  return best?.score ?? null;
}
