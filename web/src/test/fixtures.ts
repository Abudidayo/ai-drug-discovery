/**
 * Test data, read straight from the API's own fixture files (`@api-fixtures` is an alias for
 * `api/oxhack_api/fixtures`), so the web tests and the API serve one copy of the data.
 */
import covidFile from "@api-fixtures/MONDO_0100096/experiment.json";
import juryFile from "@api-fixtures/MONDO_0100096/jury.json";
import structuresFile from "@api-fixtures/structures.json";
import type {
  BuildStage,
  Conformer,
  DiseaseSearchResult,
  DockJob,
  Experiment,
  ExperimentSummary,
  JuryRun,
  Structure,
} from "../api/types";

/** The shape of `fixtures/<disease_id>/experiment.json` (the API's `ExperimentFixture`). */
type ExperimentFixture = Pick<
  Experiment,
  | "disease"
  | "data_releases"
  | "ranking_settings"
  | "jury_config"
  | "targets"
  | "network"
  | "candidates"
> & { fixture_note: string; description: string | null; synonyms: string[] };

// JSON imports widen string literals (e.g. a status becomes `string`); the API validates this
// file against the same contract, so narrowing it here is safe.
const covid = covidFile as unknown as ExperimentFixture;

const conformerFiles = import.meta.glob<Conformer>("@api-fixtures/conformers/*.json", {
  eager: true,
  import: "default",
});

export const conformers = new Map(
  Object.values(conformerFiles).map((conformer) => [conformer.pubchem_cid, conformer]),
);

export const COVID_ID = covid.disease.id;
export const EXPERIMENT_ID = "7b0f2c56-3e8a-4d61-9a3c-2f5e8d1b4a90";

/** The COVID-19 Experiment in any state; ready by default. A fresh copy on every call. */
export function covidExperiment(
  status: Experiment["status"] = "ready",
  stage: BuildStage | null = null,
  id = EXPERIMENT_ID,
): Experiment {
  const ready = status === "ready";
  const data = structuredClone(covid);
  return {
    id,
    status,
    stage: status === "building" ? (stage ?? "targets") : null,
    error: status === "failed" ? "The ranking could not be computed for this disease." : null,
    disease: data.disease,
    data_releases: data.data_releases,
    ranking_settings: data.ranking_settings,
    jury_config: data.jury_config,
    targets: ready ? data.targets : [],
    network: ready ? data.network : null,
    candidates: ready ? data.candidates : [],
    jury: null,
    dock_jobs: [],
    fixture_note: data.fixture_note,
    created_at: "2026-10-25T09:00:00Z",
    archived_at: null,
  };
}

/** What the API's fixture search answers for `query`. */
export function searchDiseases(query: string): DiseaseSearchResult[] {
  const needle = query.trim().toLowerCase();
  const name = covid.disease.name.toLowerCase();
  if (name.includes(needle)) {
    return [{ ...covid.disease, description: covid.description, matched_synonym: null }];
  }
  const synonym = covid.synonyms.find((s) => s.toLowerCase().includes(needle));
  if (synonym === undefined) return [];
  return [{ ...covid.disease, description: covid.description, matched_synonym: synonym }];
}

/** The shape of `fixtures/<disease_id>/jury.json`: one recorded jury run. */
type JuryFixture = Pick<JuryRun, "jurors" | "votes" | "consensus" | "agreement" | "contested">;

const covidJuryFile = juryFile as unknown as JuryFixture;

export const structures = (structuresFile as unknown as { structures: Structure[] }).structures;

/**
 * The COVID-19 jury run in any state. `finished` jurors have answered (with their recorded
 * votes), the next one is reviewing and the rest wait. Done by default: the recorded run.
 */
export function covidJury(status: JuryRun["status"] = "done", finished = 3): JuryRun {
  const data = structuredClone(covidJuryFile);
  const models = structuredClone(covid.jury_config.models);
  const done = status === "done";
  const jurors = data.jurors.map((juror, index) => {
    if (done || index < finished) return juror;
    const running = status === "running" && index === finished;
    return {
      ...juror,
      status: running ? ("running" as const) : ("pending" as const),
      attempts: running ? 1 : 0,
      latency_ms: null,
      errors: [],
    };
  });
  const answered = new Set(
    jurors.filter((juror) => juror.status === "valid").map((juror) => juror.model_id),
  );
  return {
    status,
    models,
    jurors,
    votes: data.votes.filter((vote) => answered.has(vote.model_id)),
    consensus: done ? data.consensus : null,
    agreement: done ? data.agreement : null,
    contested: done ? data.contested : [],
    error: status === "failed" ? "The Model jury is unavailable right now." : null,
    created_at: "2026-10-25T09:05:00Z",
    started_at: status === "queued" ? null : "2026-10-25T09:05:01Z",
    finished_at: done || status === "failed" ? "2026-10-25T09:07:48Z" : null,
  };
}

/** The ready COVID-19 Experiment with its jury in the given state. */
export function covidWithJury(status: JuryRun["status"] = "done", finished = 3): Experiment {
  return { ...covidExperiment(), jury: covidJury(status, finished) };
}

/** A docking job for baricitinib in 6WTO. */
export function dockJob(status: DockJob["status"], id = "5d0c7a43-8c3e-4b8e-9a51-0e7f0c2b1a01") {
  const structure = structures[0];
  if (structure === undefined) throw new Error("No structures in the fixture");
  const job: DockJob = {
    id,
    kind: "candidate",
    status,
    experiment_id: EXPERIMENT_ID,
    candidate_id: "CHEMBL2105759",
    target_id: structure.target_id,
    structure_id: structure.id,
    settings: {
      engine: "vina",
      engine_version: "1.2.7",
      exhaustiveness: 16,
      seed: 42,
      n_poses: 9,
      box: structure.box,
      meeko_version: null,
      rdkit_version: null,
    },
    scores: null,
    files: null,
    control_rmsd: null,
    error: null,
    cached_from: null,
    fixture: true,
    created_at: "2026-10-25T09:10:00Z",
    started_at: status === "queued" ? null : "2026-10-25T09:10:01Z",
    finished_at: null,
  };
  return job;
}

/** What the history list says about an Experiment. */
export function summaryOf(experiment: Experiment): ExperimentSummary {
  return {
    id: experiment.id,
    status: experiment.status,
    disease: experiment.disease,
    data_releases: experiment.data_releases,
    juror_count: experiment.jury_config.models.length,
    jury_status: experiment.jury?.status ?? null,
    candidate_count: experiment.candidates.length,
    docked_count: experiment.dock_jobs.filter((job) => job.status === "done").length,
    created_at: experiment.created_at,
    archived_at: experiment.archived_at,
  };
}
