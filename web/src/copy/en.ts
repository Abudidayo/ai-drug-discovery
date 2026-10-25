import type { components } from "../api/schema";
import type { UnsupportedReason } from "../lib/docking";

type BuildStage = components["schemas"]["BuildStage"];
type Decision = components["schemas"]["Decision"];
type JurorStatus = components["schemas"]["JurorStatus"];
type EvidenceSource = components["schemas"]["EvidenceSource"];
type TargetExcludedReason = components["schemas"]["TargetExcludedReason"];
type ControlStatus = components["schemas"]["ControlStatus"];

/** A length in ångströms, e.g. 1.74 Å or 2 Å: at most two decimals, no trailing zeros. */
function angstrom(value: number): string {
  return `${String(Number(value.toFixed(2)))} Å`;
}

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
      intro: "Approved drugs whose targets are closely tied to the disease’s proteins.",
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
      ranking: "Ranking approved drugs",
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
    /** When no network ranking ran, every linked protein is used. */
    ruleNoNetwork: (linked: number) =>
      `We use the ${String(linked)} proteins most strongly linked to the disease.`,
    noNetwork: "The protein network isn’t available for this experiment.",
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
    /** The shortlist when no network ranking ran (ranking_method evidence_only). */
    evidenceOnly: {
      title: "Ranked by evidence (protein network unavailable)",
      help: "No protein network ranking ran for this experiment, so drugs are ranked only by direct links between their targets and the disease.",
      listLabel: "Candidate drugs by evidence rank",
      rank: (rank: number) => `Evidence rank ${String(rank)}`,
    },
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
    /** No PubChem compound, and nothing says the drug is an antibody. */
    noModelNeutral: "No 3D model is available for this drug",
    modelUnavailable: "The 3D model couldn’t be loaded.",
  },

  jury: {
    ask: "Ask the Model jury",
    /** Before the jury is asked: who will review. */
    panel: (models: string) => `${models} will each review the evidence for every drug.`,
    askFailed: "The jury couldn’t be asked. The server isn’t answering.",
    archived: "This experiment is archived. Restore it in Saved experiments to ask the jury.",
    progressLabel: "Model jury progress",
    queued: "Waiting to start",
    jurorStatus: {
      pending: "Waiting",
      running: "Reviewing the evidence",
      valid: "Done",
      invalid: "Its answers didn’t pass our checks",
      failed: "Didn’t answer",
    } satisfies Record<JurorStatus, string>,
    unavailable: "Review unavailable",
    plotLabel: "Each model’s rank and decision for every drug",
    drug: "Drug",
    rank: "Rank by each model",
    rankOf: (model: string, rank: number) => `${model}: rank ${String(rank)}`,
    decisions: {
      investigate: "Investigate",
      watch: "Watch",
      deprioritise: "Set aside",
    } satisfies Record<Decision, string>,
    agreement: "Agreement",
    agreementHelp:
      "0 means no agreement between the models, 1 means full agreement. It isn’t a chance of success.",
    agreementMissing: "Fewer than two models answered, so agreement can’t be measured.",
    objectionTitle: (model: string, drug: string) => `${model}’s objection to ${drug}`,
    contestedTitle: "Split decision",
    contestedNote: (count: number) =>
      count === 1
        ? "The models chose different next steps for this drug."
        : `The models chose different next steps for these ${String(count)} drugs.`,
    retried: (count: number) =>
      count === 1
        ? "One model’s first answer didn’t pass our checks, so it was asked again."
        : `${String(count)} models’ first answers didn’t pass our checks, so they were asked again.`,
    excluded: {
      invalid: (model: string) =>
        `${model}’s answers didn’t pass our checks, so it has no votes here.`,
      failed: (model: string) => `${model} didn’t answer, so it has no votes here.`,
    },
  },

  compare: {
    pick: "Change drug",
    tableLabel: "Candidate drugs side by side",
    /** Read by screen readers only: the header of the row-label column. */
    rowsHeader: "Compared on",
    decision: "Jury decision",
    targets: "Targets",
    moreTargets: (shown: string, more: number) => `${shown} and ${String(more)} more`,
    approval: "Approval",
    notRecorded: "Not recorded",
    noWarnings: "None recorded",
    /** Not "Binding pose": that is the next step's name, already in the navigation. */
    dockable: "Docking",
    pose: {
      done: (target: string) => `Computed in ${target}`,
      running: (target: string) => `Being computed in ${target}`,
      possible: (target: string) => `Possible in ${target}`,
      unavailable: "Not available",
    },
    none: "None",
  },

  pose: {
    pick: "Change drug",
    /** The structure line: which crystal structure of which protein, and how sharp it is. */
    structure: (pdbId: string, symbol: string, resolutionAngstrom: number) =>
      `Crystal structure ${pdbId} of ${symbol}, ${angstrom(resolutionAngstrom)} resolution`,
    viewerLabel: (drug: string, protein: string) =>
      `${drug} in ${protein}, in 3D. Drag to rotate, scroll to zoom.`,
    show: "Show binding pose",
    archived: "This experiment is archived. Restore it in Saved experiments to compute a pose.",
    queued: "Waiting to start",
    running: "Computing the binding pose. This can take up to three minutes.",
    failed: "The binding pose couldn’t be computed.",
    requestFailed: "The binding pose couldn’t be requested. The server isn’t answering.",
    unavailable: "Docking isn’t available right now.",
    /** Docking is down, but this pair was computed before. Replaces `unavailable`. */
    saved: "Docking isn’t available right now, so this is a saved result.",
    noFiles: "This result has a score but no 3D model to show.",
    loading: "Loading the 3D model",
    filesFailed: "The 3D model couldn’t be loaded.",
    noneSupported: "None of these drugs can be docked yet.",
    scoresLabel: "How far to trust this pose",
    score: "Docking score",
    scoreHelp:
      "A rough fit estimate from the docking program, without units. More negative is a better fit. It isn’t a measured binding strength.",
    redock: "Redock check",
    redockHelp: (threshold: number) =>
      `We dock the crystal’s own drug back into this structure and measure how far it lands from its real position. Under ${angstrom(threshold)} means the setup finds a known answer; it says nothing about other drugs.`,
    redockStatus: {
      passed: "Good match",
      failed: "Poor match",
      not_measured: "Not measured yet",
    } satisfies Record<ControlStatus, string>,
    /** Fixture data, said once for every made-up value on the screen. */
    fixture: (result: "pose" | "score" | null, control: boolean): string | null => {
      const subject =
        result === "pose"
          ? "this pose, its docking score"
          : result === "score"
            ? "this docking score"
            : null;
      if (subject === null) return control ? "Demo data: the redock check is made up." : null;
      if (control) return `Demo data: ${subject} and the redock check are made up.`;
      return result === "pose"
        ? "Demo data: this pose and its docking score are made up."
        : "Demo data: this docking score is made up.";
    },
    caveat:
      "A pose is a guess at how a drug could sit in this pocket. It isn’t evidence that the drug binds here, or that it works.",
    controls: {
      surface: "Pocket surface",
      overlay: "Crystal position",
      spin: "Spin",
      reset: "Reset view",
    },
    legend: { protein: "Protein", drug: "Drug" },
    unsupportedTitle: "Not available yet",
    unsupported: {
      no_structure: (names: string, count: number) =>
        `${names}: no prepared structure of ${count === 1 ? "its" : "their"} target proteins yet.`,
      antibody: (names: string, count: number) =>
        `${names} ${count === 1 ? "is an antibody" : "are antibodies"}. Docking needs a small molecule.`,
      not_dockable: (names: string, count: number) =>
        `${names}: ${count === 1 ? "its" : "their"} structure isn’t ready for docking yet.`,
    } satisfies Record<UnsupportedReason, (names: string, count: number) => string>,
  },

  history: {
    viewLabel: "Which experiments to list",
    listLabel: "Experiments",
    active: "Saved",
    archived: "Archived",
    archive: "Archive",
    restore: "Restore",
    current: "Open",
    loading: "Loading saved experiments",
    unavailable: "Saved experiments couldn’t be loaded. The server isn’t answering.",
    emptyActive: "No saved experiments yet.",
    emptyArchived: "No archived experiments.",
    counts: (candidates: number, docked: number) =>
      `${String(candidates)} candidate ${candidates === 1 ? "drug" : "drugs"}, ${String(docked)} binding ${docked === 1 ? "pose" : "poses"}`,
    actionFailed: "That didn’t work. The server isn’t answering.",
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
  network_unavailable:
    "No protein network ranking ran for this experiment, so this drug has no route to the disease to show.",
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
