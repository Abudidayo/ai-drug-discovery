import { HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createOpenApiHttp } from "openapi-msw";
import type { components, paths } from "../api/schema";
import type { Experiment } from "../api/types";
import { conformers, covidExperiment, searchDiseases } from "./fixtures";

/** MSW handlers typed by the generated contract: a wrong path or body fails `tsc`. */
export const http = createOpenApiHttp<paths>({ baseUrl: window.location.origin });

/**
 * The fake API's state. Each Experiment ID maps to the responses its GETs return in turn; the
 * last one repeats. That plays out a build (queued, building, ready) across polls.
 */
export const fakeApi = {
  experiments: new Map<string, Experiment[]>(),
  /** What a newly created Experiment answers to its GETs, in order. */
  buildSequence: (id: string): Experiment[] => [
    covidExperiment("building", "ranking", id),
    covidExperiment("ready", null, id),
  ],
  created: 0,
};

/**
 * The contract's own Experiment type. It differs from the app's only in fixed-length tuples
 * (a docking box's centre), which the tests never fill: their docking job lists are empty.
 */
const contract = (experiment: Experiment) => experiment as components["schemas"]["Experiment"];

export function serveExperiment(...responses: Experiment[]): void {
  const first = responses[0];
  if (first) fakeApi.experiments.set(first.id, responses);
}

export const handlers = [
  http.get("/api/diseases/search", ({ query, response }) => {
    const q = query.get("q");
    return response(200).json({ query: q, results: searchDiseases(q) });
  }),

  http.post("/api/experiments", async ({ request, response }) => {
    const body = await request.json();
    fakeApi.created += 1;
    const id = `00000000-0000-4000-8000-${String(fakeApi.created).padStart(12, "0")}`;
    const queued = covidExperiment("queued", null, id);
    if (body.disease_id !== queued.disease.id) {
      return response(422).json({ detail: `There is no data for the Disease ${body.disease_id}.` });
    }
    fakeApi.experiments.set(id, fakeApi.buildSequence(id));
    return response(202).json(contract(queued));
  }),

  http.get("/api/experiments/{experiment_id}", ({ params, response }) => {
    const sequence = fakeApi.experiments.get(params.experiment_id);
    const next = sequence && (sequence.length > 1 ? sequence.shift() : sequence[0]);
    if (!next) {
      return response(404).json({ detail: "There is no saved Experiment with this ID." });
    }
    return response(200).json(contract(next));
  }),

  http.get("/api/molecules/{pubchem_cid}/conformer", ({ params, response }) => {
    const conformer = conformers.get(Number(params.pubchem_cid));
    if (!conformer) {
      return response(404).json({
        detail: `No 3D structure is available for PubChem compound ${params.pubchem_cid}.`,
      });
    }
    return response(200).json(conformer);
  }),
];

export const server = setupServer(...handlers);

/** A request that never reaches the API, as when the server is down. */
export const networkError = () => HttpResponse.error();
