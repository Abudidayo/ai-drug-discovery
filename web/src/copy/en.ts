/**
 * The copy deck: every sentence the interface says, in one place (docs/design.md, "Plain words").
 *
 * Only wording that holds for any Disease lives here. Text that depends on the Disease or the
 * Experiment (evidence statements, juror objections, model names, warnings, data versions) comes
 * from the API. Wording that needs a value from the API is a small function, so the sentence
 * stays here and only the value is passed in.
 *
 * Rules: sentence case, no all-caps, no arrows on buttons, no step counters, and each fact said
 * once per screen. Apostrophes are typographic (’).
 */

export const copy = {
  product: "Drug repurposing explorer",
  disclaimer:
    "For learning only. Rankings, AI reviews and binding poses are hypotheses from public data and computer models, and may be wrong. Not medical advice.",
  back: "Back",
  next: "Next",
  stepsLabel: "Steps",

  /**
   * The eight steps of plan.md §2, in order. `slug` is the URL segment in `/e/:experimentId/:step`.
   * Intros never name the Disease: the header already shows it once.
   */
  steps: [
    {
      slug: "disease",
      title: "Choose a disease",
      intro: "Start with the illness you want treatment ideas for.",
    },
    {
      slug: "biology",
      title: "Its biology",
      intro: "Proteins linked to the disease, and how they connect inside the cell.",
    },
    {
      slug: "candidates",
      title: "Candidate drugs",
      intro: "Approved drugs whose targets sit close to the disease’s proteins.",
    },
    {
      slug: "evidence",
      title: "Evidence",
      intro: "What we know about each drug, and where each claim comes from.",
    },
    {
      slug: "jury",
      title: "Model jury",
      intro: "AI models judged the same evidence without seeing our ranking.",
    },
    {
      slug: "compare",
      title: "Compare",
      intro: "Put candidates side by side.",
    },
    {
      slug: "pose",
      title: "Binding pose",
      intro: "How a drug might fit into its target protein, from a real crystal structure.",
    },
    {
      slug: "history",
      title: "Saved experiments",
      intro: "Each search is saved with the data it used, so you can come back to it.",
    },
  ],

  search: {
    placeholder: "Search diseases",
  },

  legend: {
    disease: "Disease protein",
    drug: "Drug target",
    both: "Both",
    link: "Connecting protein",
    path: "Shortest route",
  },

  biology: {
    rule: (linked: number, inNetwork: number) =>
      `We use the ${String(linked)} proteins most strongly linked to the disease. ${String(inNetwork)} of them appear in the protein network.`,
    strength: "Link strength",
    more: (count: number) => `${String(count)} more`,
    unmapped: (symbol: string) => `${symbol} isn’t in the network, so it can’t be used.`,
  },

  candidates: {
    networkRank: "Network rank",
    evidenceRank: "Evidence rank",
    evidenceRankHelp: "Ranked only by direct links between the drug’s targets and the disease.",
    closeness: "Closeness",
    closenessHelp:
      "How near a drug’s targets sit to the disease proteins, compared with random proteins. Lower is closer.",
    showAll: (count: number) => `Show all ${String(count)}`,
    knownAnswer: (drug: string, disease: string) =>
      `${drug} is already used for ${disease}. Finding it shows the method works; it isn’t a new discovery.`,
    selectedBy: { network: "Network", evidence: "Evidence" },
  },

  evidence: {
    warningTitle: "Label warning",
    missingTitle: "Not yet known",
    pathTitle: "Why it ranks high",
  },

  jury: {
    decisions: { investigate: "Investigate", watch: "Watch", deprioritise: "Set aside" },
    agreement: "Agreement",
    agreementHelp:
      "0 means no agreement between the models, 1 means full agreement. It isn’t a chance of success.",
    objectionTitle: (model: string) => `${model}’s objection`,
    contestedTitle: "Split decision",
    check: "One model cited a source it wasn’t given, so it was asked again.",
  },

  compare: {
    pick: "Change drug",
    dockable: "Binding pose",
    none: "None",
  },

  pose: {
    structure: (pdbId: string, resolutionAngstrom: number) =>
      `Crystal structure ${pdbId}, ${resolutionAngstrom.toFixed(1)} Å`,
    score: "Docking score",
    scoreHelp: "A fit estimate from the docking program. Not binding strength.",
    redock: "Redock check",
    redockHelp: "How far a re-predicted pose lands from the real one. Under 2 Å is a good match.",
    caveat: "A pose shows how a drug might fit. It doesn’t show how well it works.",
    controls: {
      surface: "Pocket surface",
      control: "Redock overlay",
      spin: "Spin",
      reset: "Reset view",
    },
    unsupportedTitle: "Not available yet",
  },

  history: {
    active: "Saved",
    archived: "Archived",
    archive: "Archive",
    restore: "Restore",
    current: "Open",
    data: (versions: readonly string[]) => `Data: ${versions.join(", ")}`,
  },

  notFound: {
    title: "Page not found",
    body: "There’s nothing at this address.",
    home: "Choose a disease",
  },

  routeError: {
    title: "Something went wrong",
    body: "This page couldn’t be shown. Reload to try again.",
    home: "Choose a disease",
  },

  /** Placeholder panels while the app is built phase by phase (see the workstream C plan). */
  pending: (phase: string) => `This step’s figure arrives in phase ${phase}.`,
} as const;

export type StepCopy = (typeof copy.steps)[number];
export type StepSlug = StepCopy["slug"];

export const stepSlugs: readonly StepSlug[] = copy.steps.map((step) => step.slug);

export function isStepSlug(value: string | undefined): value is StepSlug {
  return value !== undefined && (stepSlugs as readonly string[]).includes(value);
}

export function stepIndex(slug: StepSlug): number {
  return stepSlugs.indexOf(slug);
}

export function stepCopy(slug: StepSlug): StepCopy {
  const step = copy.steps.find((candidate) => candidate.slug === slug);
  if (step === undefined) throw new Error(`No copy for step "${slug}"`);
  return step;
}

/**
 * Why a Candidate can't be scored on the protein network.
 *
 * TODO(phase 3b): replace this local union with the generated API type
 * (`components["schemas"]["UnscorableReason"]` in src/api/schema.d.ts) once api/openapi.json
 * exists. The `Record` keeps a new code from compiling until it has wording.
 */
export type UnscorableReason = "no_retained_disease_targets" | "no_retained_drug_targets";

export const unscorableReasons: Record<UnscorableReason, string> = {
  no_retained_disease_targets:
    "None of the disease’s proteins are in the protein network, so no drug can be placed near them.",
  no_retained_drug_targets:
    "None of this drug’s targets are human proteins in the network, so it has no place in it.",
};

export function unscorableReasonText(reason: UnscorableReason): string {
  return unscorableReasons[reason];
}
