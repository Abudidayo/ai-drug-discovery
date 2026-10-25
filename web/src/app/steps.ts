import { stepIndex, stepSlugs, type StepSlug } from "../copy/en";

/** The landing page is step 1 before any Experiment exists. */
export const HOME_PATH = "/";

/** Where a step lives. Without an Experiment only step 1 has a page: the landing page. */
export function stepPath(experimentId: string | undefined, slug: StepSlug): string | undefined {
  if (experimentId === undefined) return slug === "disease" ? HOME_PATH : undefined;
  return `/e/${encodeURIComponent(experimentId)}/${slug}`;
}

/** The step `offset` places away from `slug`, or undefined past either end. */
export function neighbourStep(slug: StepSlug, offset: -1 | 1): StepSlug | undefined {
  return stepSlugs[stepIndex(slug) + offset];
}
