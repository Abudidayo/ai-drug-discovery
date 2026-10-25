/**
 * Test data, read straight from the API's own fixture files (`@api-fixtures` is an alias for
 * `api/oxhack_api/fixtures`), so the web tests and the API serve one copy of the data.
 */
import covidFile from "@api-fixtures/MONDO_0100096/experiment.json";
import type { BuildStage, Conformer, DiseaseSearchResult, Experiment } from "../api/types";

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
