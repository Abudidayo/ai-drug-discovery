// Local test bench for the three public data sources behind the evidence pipeline.
// Zero dependencies: run with `node demos/data-sources/server.mjs` (Node 18+).

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = "127.0.0.1";
const TIMEOUT_MS = 15_000;
// Base URLs are overridable so a failing source can be simulated during testing.
const OPEN_TARGETS_URL =
  process.env.OPEN_TARGETS_URL ?? "https://api.platform.opentargets.org/api/v4/graphql";
const CHEMBL_BASE = process.env.CHEMBL_BASE ?? "https://www.ebi.ac.uk/chembl/api/data";
const PUBCHEM_BASE = process.env.PUBCHEM_BASE ?? "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

const DISEASE_ID = /^[A-Za-z]+_\d+$/;
const CHEMBL_ID = /^CHEMBL\d+$/;
const MAX_QUERY_LENGTH = 100;

// Open Targets clinical stages, most advanced first.
const STAGE_ORDER = [
  "APPROVAL", "PHASE_4", "PHASE_3", "PHASE_2_3", "PHASE_2", "PHASE_1_2", "PHASE_1",
  "EARLY_PHASE_1", "UNKNOWN",
];

const SEARCH_QUERY = `
  query SearchDiseases($q: String!) {
    search(queryString: $q, entityNames: ["disease"], page: { index: 0, size: 10 }) {
      total
      hits { id name description }
    }
  }`;

const DISEASE_QUERY = `
  query Disease($id: String!, $targets: Int!) {
    disease(efoId: $id) {
      id
      name
      description
      associatedTargets(page: { index: 0, size: $targets }) {
        count
        rows { score target { id approvedSymbol approvedName } }
      }
      drugAndClinicalCandidates {
        count
        rows { maxClinicalStage drug { id name drugType } }
      }
    }
  }`;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Fetch JSON from one upstream source and record what happened in `sources`. */
async function fetchSource(sources, name, url, init = {}) {
  const started = performance.now();
  const record = { name, url, status: null, ms: null, ok: false };
  sources.push(record);
  try {
    const response = await fetch(url, {
      ...init,
      headers: { accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    record.status = response.status;
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`${name} returned HTTP ${response.status}`);
    }
    if (body === null) {
      throw new Error(`${name} returned a response that is not JSON`);
    }
    record.ok = true;
    return body;
  } catch (error) {
    record.error =
      error.name === "TimeoutError"
        ? `${name} did not answer within ${TIMEOUT_MS / 1000} s`
        : error.message.startsWith(name)
          ? error.message
          : `${name} could not be reached: ${error.cause?.code ?? error.message}`;
    throw new Error(record.error);
  } finally {
    record.ms = Math.round(performance.now() - started);
  }
}

async function openTargets(sources, label, query, variables) {
  const body = await fetchSource(sources, label, OPEN_TARGETS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (body.errors?.length) {
    const message = `${label} query failed: ${body.errors[0].message}`;
    sources.at(-1).ok = false;
    sources.at(-1).error = message;
    throw new Error(message);
  }
  return body.data;
}

function intParam(params, name, fallback, max) {
  const value = Number(params.get(name) ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new RequestError(400, `${name} must be a whole number from 1 to ${max}`);
  }
  return value;
}

async function searchDiseases(params, sources) {
  const q = params.get("q")?.trim() ?? "";
  if (!q) throw new RequestError(400, "q is required");
  if (q.length > MAX_QUERY_LENGTH) {
    throw new RequestError(400, `q must be at most ${MAX_QUERY_LENGTH} characters`);
  }
  const raw = await openTargets(sources, "Open Targets search", SEARCH_QUERY, { q });
  return {
    data: { query: q, total: raw.search.total, hits: raw.search.hits },
    raw: { openTargets: raw },
  };
}

async function getDisease(id, params, sources) {
  if (!DISEASE_ID.test(id)) {
    throw new RequestError(400, "Disease ID must look like MONDO_0100096 or EFO_0001378");
  }
  const targets = intParam(params, "targets", 10, 100);
  const drugs = intParam(params, "drugs", 25, 2000);
  const raw = await openTargets(sources, "Open Targets disease", DISEASE_QUERY, { id, targets });
  if (!raw.disease) {
    throw new RequestError(404, `Open Targets has no disease with ID ${id}`);
  }
  const { associatedTargets, drugAndClinicalCandidates } = raw.disease;
  const rank = (stage) => {
    const index = STAGE_ORDER.indexOf(stage);
    return index === -1 ? STAGE_ORDER.length : index;
  };
  const sortedDrugs = drugAndClinicalCandidates.rows
    .filter((row) => row.drug)
    .sort(
      (a, b) =>
        rank(a.maxClinicalStage) - rank(b.maxClinicalStage) ||
        a.drug.name.localeCompare(b.drug.name),
    );
  return {
    data: {
      id: raw.disease.id,
      name: raw.disease.name,
      description: raw.disease.description,
      targets: {
        total: associatedTargets.count,
        rows: associatedTargets.rows.map((row) => ({
          id: row.target.id,
          symbol: row.target.approvedSymbol,
          name: row.target.approvedName,
          score: row.score,
        })),
      },
      drugs: {
        total: drugAndClinicalCandidates.count,
        rows: sortedDrugs.slice(0, drugs).map((row) => ({
          id: row.drug.id,
          name: row.drug.name,
          type: row.drug.drugType,
          maxClinicalStage: row.maxClinicalStage,
        })),
      },
    },
    raw: { openTargets: raw },
  };
}

function settled(result) {
  return result.status === "fulfilled"
    ? { ok: true, value: result.value }
    : { ok: false, error: result.reason.message };
}

async function getDrug(id, sources) {
  if (!CHEMBL_ID.test(id)) {
    throw new RequestError(400, "Drug ID must be a ChEMBL ID such as CHEMBL2105759");
  }
  const chembl = (path) => `${CHEMBL_BASE}/${path}`;
  const [molecule, mechanisms, warnings, indications] = (
    await Promise.allSettled([
      fetchSource(sources, "ChEMBL molecule", chembl(`molecule/${id}.json`)),
      fetchSource(sources, "ChEMBL mechanisms", chembl(`mechanism.json?molecule_chembl_id=${id}&limit=100`)),
      fetchSource(sources, "ChEMBL warnings", chembl(`drug_warning.json?molecule_chembl_id=${id}&limit=100`)),
      fetchSource(sources, "ChEMBL indications", chembl(`drug_indication.json?molecule_chembl_id=${id}&limit=500`)),
    ])
  ).map(settled);

  // PubChem is matched on the exact structure (InChIKey) from ChEMBL, not on the drug name.
  const inchiKey = molecule.ok ? molecule.value.molecule_structures?.standard_inchi_key : null;
  let pubchem;
  if (!molecule.ok) {
    pubchem = { ok: false, skipped: true, error: "Skipped because the ChEMBL molecule lookup failed" };
  } else if (!inchiKey) {
    pubchem = {
      ok: false,
      skipped: true,
      error: "Skipped: ChEMBL has no small-molecule structure for this drug (for example, an antibody)",
    };
  } else {
    const properties = "MolecularFormula,MolecularWeight,XLogP,SMILES,IUPACName";
    pubchem = settled(
      (
        await Promise.allSettled([
          fetchSource(
            sources,
            "PubChem properties",
            `${PUBCHEM_BASE}/compound/inchikey/${inchiKey}/property/${properties}/JSON`,
          ),
        ])
      )[0],
    );
  }

  const block = (result, pick) =>
    result.ok ? { ok: true, ...pick(result.value) } : { ok: false, error: result.error, skipped: result.skipped };

  const data = {
    id,
    molecule: block(molecule, (m) => ({
      name: m.pref_name,
      type: m.molecule_type,
      maxPhase: m.max_phase === null ? null : Number(m.max_phase),
      firstApproval: m.first_approval,
      boxedWarning: m.black_box_warning === 1,
      withdrawn: m.withdrawn_flag,
      smiles: m.molecule_structures?.canonical_smiles ?? null,
      inchiKey: m.molecule_structures?.standard_inchi_key ?? null,
    })),
    mechanisms: block(mechanisms, (m) => ({
      rows: m.mechanisms.map((row) => ({
        description: row.mechanism_of_action,
        actionType: row.action_type,
        targetId: row.target_chembl_id,
      })),
    })),
    warnings: block(warnings, (w) => ({
      rows: w.drug_warnings.map((row) => ({
        type: row.warning_type,
        warningClass: row.warning_class,
        description: row.warning_description,
        country: row.warning_country,
        year: row.warning_year,
        refs: (row.warning_refs ?? []).map((ref) => ({ type: ref.ref_type, url: ref.ref_url })),
      })),
    })),
    indications: block(indications, (i) => ({
      total: i.page_meta.total_count,
      rows: i.drug_indications
        .map((row) => ({
          term: row.efo_term ?? row.mesh_heading,
          efoId: row.efo_id,
          maxPhase: row.max_phase_for_ind === null ? null : Number(row.max_phase_for_ind),
        }))
        .sort((a, b) => (b.maxPhase ?? -1) - (a.maxPhase ?? -1) || a.term.localeCompare(b.term)),
    })),
    pubchem: block(pubchem, (p) => {
      const compound = p.PropertyTable.Properties[0];
      return {
        cid: compound.CID,
        formula: compound.MolecularFormula,
        weight: compound.MolecularWeight === undefined ? null : Number(compound.MolecularWeight),
        xlogp: compound.XLogP ?? null,
        iupacName: compound.IUPACName ?? null,
        imageUrl: `${PUBCHEM_BASE}/compound/cid/${compound.CID}/PNG?image_size=300x300`,
        pageUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${compound.CID}`,
      };
    }),
  };

  if (sources.every((source) => !source.ok)) {
    throw new RequestError(502, "Every data source failed for this drug");
  }
  return {
    data,
    raw: {
      chemblMolecule: molecule.value,
      chemblMechanisms: mechanisms.value,
      chemblWarnings: warnings.value,
      chemblIndications: indications.value,
      pubchem: pubchem.value,
    },
  };
}

function send(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body, null, 2));
}

async function route(url, sources) {
  const { pathname, searchParams } = url;
  if (pathname === "/api/diseases") return searchDiseases(searchParams, sources);
  const disease = pathname.match(/^\/api\/diseases\/([^/]+)$/);
  if (disease) return getDisease(decodeURIComponent(disease[1]), searchParams, sources);
  const drug = pathname.match(/^\/api\/drugs\/([^/]+)$/);
  if (drug) return getDrug(decodeURIComponent(drug[1]), sources);
  throw new RequestError(404, `No endpoint at ${pathname}`);
}

const indexPath = new URL("./index.html", import.meta.url);

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method !== "GET") {
    return send(response, 405, { error: "Only GET is supported" });
  }
  if (url.pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    return response.end(await readFile(indexPath));
  }
  const sources = [];
  try {
    const { data, raw } = await route(url, sources);
    const body = { data, sources };
    if (url.searchParams.get("raw") === "1") body.raw = raw;
    send(response, 200, body);
  } catch (error) {
    // Upstream failures are not RequestErrors; their message names the source that failed.
    const status = error instanceof RequestError ? error.status : 502;
    send(response, status, { error: error.message, sources });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Data-source demo running at http://${HOST}:${PORT}`);
});
