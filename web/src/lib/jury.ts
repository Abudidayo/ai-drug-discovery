import type { Candidate, Decision, JuryModel, JuryRun, JuryVote } from "../api/types";

/** A jury model with its fixed marker: its position in the jury, so a shape never changes. */
export interface Juror {
  model: JuryModel;
  marker: number;
}

/** One drug's row in the jury's dot plot: each counted model's vote, in jury order. */
export interface JuryRow {
  candidate: Candidate;
  votes: (JuryVote | null)[];
  contested: boolean;
}

/** One model's view of one drug, for a single cell. */
export interface JurorDecision {
  juror: Juror;
  decision: Decision;
}

/**
 * The models whose votes count: the valid jurors, in the jury's order. Invalid and failed
 * jurors have no votes and are never given any.
 */
export function countedJurors(jury: JuryRun): Juror[] {
  const valid = new Set(
    jury.jurors.filter((juror) => juror.status === "valid").map((juror) => juror.model_id),
  );
  return jury.models.flatMap((model, marker) => (valid.has(model.id) ? [{ model, marker }] : []));
}

/** Models that replied but failed the checks, or never replied, with the reason's kind. */
export function excludedJurors(jury: JuryRun): { juror: Juror; status: "invalid" | "failed" }[] {
  return jury.models.flatMap((model, marker) => {
    const status = jury.jurors.find((juror) => juror.model_id === model.id)?.status;
    return status === "invalid" || status === "failed"
      ? [{ juror: { model, marker }, status }]
      : [];
  });
}

/** Which of stream A's checks a model's answer failed, in the order they are worth naming. */
export type FailedCheck =
  "refused" | "ranking" | "unknownEvidence" | "otherDrug" | "uncited" | "safety" | "numbers";

const CHECKS: [FailedCheck, RegExp][] = [
  ["refused", /refused/],
  ["ranking", /Expected every Candidate once|Decisions must not improve/],
  ["unknownEvidence", /unknown evidence ID/],
  ["otherDrug", /evidence belongs to another Candidate/],
  ["uncited", /inline evidence must also appear in citation fields/],
  ["safety", /warnings may only be cited in safety|safety does not match packet warnings/],
  ["numbers", /unsupported or unparseable number/],
];

/**
 * The check a model's last answer failed, from its errors (stream A writes one line per
 * failure, each starting "Attempt n:"). Null when no known check is named.
 */
export function failedCheck(errors: readonly string[]): FailedCheck | null {
  const attempt = (error: string) => Number(/^Attempt (\d+):/.exec(error)?.[1] ?? 0);
  const last = Math.max(0, ...errors.map(attempt));
  const final = errors.filter((error) => attempt(error) === last);
  return CHECKS.find(([, pattern]) => final.some((error) => pattern.test(error)))?.[0] ?? null;
}

/** How many counted models needed a second attempt before their answer passed the checks. */
export function retriedCount(jury: JuryRun): number {
  return jury.jurors.filter((juror) => juror.status === "valid" && juror.attempts > 1).length;
}

function voteOf(jury: JuryRun, modelId: string, candidateId: string): JuryVote | null {
  return (
    jury.votes.find((vote) => vote.model_id === modelId && vote.candidate_id === candidateId) ??
    null
  );
}

/**
 * The dot plot's rows in consensus order (ties keep the API's order). Drugs the consensus
 * doesn't list follow in shortlist order, so no Candidate is dropped.
 */
export function juryRows(jury: JuryRun, candidates: readonly Candidate[]): JuryRow[] {
  const counted = countedJurors(jury);
  const contested = new Set(jury.contested);
  const order = (jury.consensus?.ranking ?? []).map((entry) => entry.candidate_id);
  const position = (id: string) => {
    const index = order.indexOf(id);
    return index === -1 ? order.length : index;
  };
  return [...candidates]
    .sort((a, b) => position(a.candidate_id) - position(b.candidate_id))
    .map((candidate) => ({
      candidate,
      votes: counted.map(({ model }) => voteOf(jury, model.id, candidate.candidate_id)),
      contested: contested.has(candidate.candidate_id),
    }));
}

/** Each counted model's decision on one drug, in jury order. */
export function decisionsFor(jury: JuryRun, candidateId: string): JurorDecision[] {
  return countedJurors(jury).flatMap((juror) => {
    const vote = voteOf(jury, juror.model.id, candidateId);
    return vote === null ? [] : [{ juror, decision: vote.decision }];
  });
}

/** The one objection the jury step shows. */
export interface FeaturedObjection {
  juror: Juror;
  candidate: Candidate;
  text: string;
}

/**
 * The objection worth reading first: on the known-answer drug (else the consensus favourite),
 * from the counted model that ranked it lowest, the most sceptical voice on the drug that
 * matters most. Ties go to the earlier model.
 */
export function featuredObjection(
  jury: JuryRun,
  candidates: readonly Candidate[],
): FeaturedObjection | null {
  const favourite = jury.consensus?.ranking[0]?.candidate_id;
  const candidate =
    candidates.find((c) => c.known_answer) ?? candidates.find((c) => c.candidate_id === favourite);
  if (candidate === undefined) return null;
  let featured: { juror: Juror; vote: JuryVote } | null = null;
  for (const juror of countedJurors(jury)) {
    const vote = voteOf(jury, juror.model.id, candidate.candidate_id);
    if (vote === null || vote.objection.trim() === "") continue;
    if (featured === null || vote.rank > featured.vote.rank) featured = { juror, vote };
  }
  return featured && { juror: featured.juror, candidate, text: featured.vote.objection };
}
