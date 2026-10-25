import type { components } from "../api/schema";

type BuildStage = components["schemas"]["BuildStage"];
type EvidenceSource = components["schemas"]["EvidenceSource"];
type TargetExcludedReason = components["schemas"]["TargetExcludedReason"];

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
  retry: "Try again",

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
    noMatch: (query: string) => `No diseases match “${query}”. Try another name.`,
    unavailable: "Disease search isn’t answering right now.",
    createFailed: "The experiment couldn’t be started. The server isn’t answering.",
  },

  /** An Experiment while it loads, builds or fails. */
  experiment: {
    loading: "Loading the experiment",
    buildLabel: "Building the experiment",
    queued: "Waiting to start",
    stages: {
      targets: "Finding the proteins linked to the disease",
      ranking: "Placing approved drugs on the protein network",
      evidence: "Collecting the evidence for each drug",
      saving: "Saving the results",
    } satisfies Record<BuildStage, string>,
    failed: "This experiment couldn’t be built.",
    chooseAnother: "Choose another disease",
    unavailable: "The experiment couldn’t be loaded. The server isn’t answering.",
    notFound: {
      title: "Experiment not found",
      body: "There’s no saved experiment at this address.",
      home: "Choose a disease",
    },
  },

  network: {
    title: "Protein network",
    label: "Protein network in 3D. Drag to rotate.",
    unavailable: "The 3D view needs WebGL, which this browser doesn’t offer.",
    empty: "None of the disease’s proteins are in the protein network, so there’s nothing to draw.",
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
    targetsLabel: "Disease proteins by link strength",
    excluded: {
      not_in_graph: (symbol: string) =>
        `${symbol} isn’t in the protein network, so it can’t be used.`,
      outside_largest_component: (symbol: string) =>
        `${symbol} sits apart from the main protein network, so it can’t be used.`,
    } satisfies Record<TargetExcludedReason, (symbol: string) => string>,
  },

  candidates: {
    ranking: "Ranking",
    chartLabel: "Candidate drugs: closeness, network rank and evidence rank",
    networkRank: "Network rank",
    evidenceRank: "Evidence rank",
    evidenceRankHelp: "Ranked only by direct links between the drug’s targets and the disease.",
    closeness: "Closeness",
    closenessHelp:
      "How near a drug’s targets sit to the disease proteins, compared with random proteins. Lower is closer.",
    showAll: (count: number) => `Show all ${String(count)}`,
    notMeasured: "Not measured",
    notRanked: "Not ranked",
    knownAnswer: (drug: string, disease: string) =>
      `${drug} is already used for ${disease}. Finding it shows the method works; it isn’t a new discovery.`,
    selectedBy: { network: "Network", evidence: "Evidence" },
  },

  evidence: {
    listLabel: "Sourced facts",
    sources: { open_targets: "Open Targets", chembl: "ChEMBL" } satisfies Record<
      EvidenceSource,
      string
    >,
    warningTitle: "Label warning",
    noWarnings: "No label warnings are recorded. That doesn’t mean the drug is safe.",
    missingTitle: "Not yet known",
    pathTitle: "Why it ranks high",
    /** For a drug ranked by distance only: it has a route, but closeness didn't rank it high. */
    routeTitle: "Its route to the disease",
    noRouteTitle: "Not on the network",
    route: {
      self: (drug: string, target: string) =>
        `${drug} acts on ${target}, which is itself a disease protein.`,
      direct: (drug: string, target: string, disease: string) =>
        `${drug} acts on ${target}, which connects directly to ${disease}, a disease protein.`,
      via: (drug: string, target: string, disease: string, through: string) =>
        `${drug} acts on ${target}, which reaches ${disease}, a disease protein, through ${through}.`,
    },
    moleculeLabel: (drug: string) => `${drug} in 3D. Drag to rotate.`,
    noModel: "Antibody: no small-molecule 3D model",
    modelUnavailable: "The 3D model couldn’t be loaded.",
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
 * Why a Candidate can't be scored on the protein network. The codes come from the API
 * contract, so a new code fails to compile until it has wording here.
 */
export type UnscorableReason = components["schemas"]["UnscorableReason"];

export const unscorableReasons: Record<UnscorableReason, string> = {
  no_retained_disease_targets:
    "None of the disease’s proteins are in the protein network, so no drug can be placed near them.",
  no_retained_drug_targets:
    "None of this drug’s targets are human proteins in the network, so it has no place in it.",
};

/** Why a network score is incomplete or less reliable. Same compile-time guarantee. */
export type NetworkWarning = components["schemas"]["NetworkWarning"];

export const networkWarnings: Record<NetworkWarning, string> = {
  zero_null_variance:
    "Random proteins all landed at the same distance, so closeness can’t be measured. Ranked by distance only.",
  insufficient_degree_matched_pool:
    "Too few comparable proteins to compare against, so closeness is less reliable.",
};

export function networkWarningText(warning: NetworkWarning): string {
  return networkWarnings[warning];
}

export function unscorableReasonText(reason: UnscorableReason): string {
  return unscorableReasons[reason];
}
