import type { Experiment } from "../api/types";
import type { StepSlug } from "../copy/en";

/**
 * The work the API starts on its own once an Experiment is built (its follow-ups): the Model
 * jury's review and a binding pose for each drug that can be docked. The step navigation shows
 * where each stands, so a reader on an earlier step sees it being prepared and when it is ready.
 */

/** The steps whose result is prepared in the background, in navigation order. */
export const FOLLOW_UP_STEPS = ["jury", "pose"] as const satisfies readonly StepSlug[];

export type FollowUpStep = (typeof FOLLOW_UP_STEPS)[number];

/**
 * Where a follow-up stands: being prepared, or ready to read. Idle covers everything with nothing
 * to wait for: not started yet, never asked, failed, or nothing to dock. The step itself says why.
 */
export type FollowUpState = "idle" | "working" | "ready";

export type FollowUps = Record<FollowUpStep, FollowUpState>;

const WORKING: readonly string[] = ["queued", "running"];

/** Where an Experiment's jury and its drugs' binding poses stand. */
export function followUpStates(experiment: Experiment): FollowUps {
  const jury = experiment.jury?.status;
  // Controls are the docking's own checks, not a drug's pose.
  const poses = experiment.dock_jobs.filter((job) => job.kind === "candidate");
  return {
    jury: jury === undefined ? "idle" : stateOf([jury]),
    pose: stateOf(poses.map((job) => job.status)),
  };
}

/** Working while any job is; else ready once any is done; else idle. */
function stateOf(statuses: readonly string[]): FollowUpState {
  if (statuses.some((status) => WORKING.includes(status))) return "working";
  if (statuses.includes("done")) return "ready";
  return "idle";
}

export function isFollowUpStep(slug: StepSlug): slug is FollowUpStep {
  return (FOLLOW_UP_STEPS as readonly StepSlug[]).includes(slug);
}
