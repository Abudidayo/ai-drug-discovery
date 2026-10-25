import { describe, expect, it } from "vitest";
import type { Candidate, EvidenceItem } from "../api/types";
import { covidExperiment } from "../test/fixtures";
import { byNetworkRank, focusCandidate, listedEvidence, routeOf } from "./candidates";

const HASH = "a".repeat(64);
const TYK2 = "ENSG00000105397";
const JAK1 = "ENSG00000162434";

function route(id: string, ids: string[]): EvidenceItem {
  return {
    id,
    kind: "network_path",
    source: "string",
    source_id: `${ids.join(">")}@${HASH}`,
    url: "https://string-db.org/cgi/network",
    release: "string-12.5",
    statement: "A network association.",
    summary: `${id} route.`,
    values: { hops: ids.length - 1 },
  };
}

describe("focusCandidate", () => {
  const { candidates } = covidExperiment();

  it("prefers the asked-for drug, then the known answer, then the top of the shortlist", () => {
    expect(focusCandidate(candidates, "CHEMBL941")?.name).toBe("IMATINIB");
    expect(focusCandidate(candidates, "CHEMBL0")?.name).toBe("BARICITINIB");
    const withoutKnownAnswer = candidates.map((c) => ({ ...c, known_answer: false })).reverse();
    expect(focusCandidate(withoutKnownAnswer)?.name).toBe("THALIDOMIDE");
  });
});

describe("byNetworkRank", () => {
  it("orders placed drugs by network rank and leaves out unplaceable ones", () => {
    const ranks = byNetworkRank(covidExperiment().candidates).map((c) => c.network.rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1308, 1309]);
  });
});

describe("listedEvidence", () => {
  const experiment = covidExperiment();
  const baricitinib = experiment.candidates.find((c) => c.name === "BARICITINIB");
  if (baricitinib?.network == null) throw new Error("the fixture places baricitinib");
  const path = baricitinib.network.path;
  const withRoutes: Candidate = {
    ...baricitinib,
    evidence: [...baricitinib.evidence, route("E901", [TYK2]), route("E902", [JAK1, TYK2])],
  };

  it("reads a route's proteins from its source ID", () => {
    expect(routeOf(route("E902", [JAK1, TYK2]))).toEqual([JAK1, TYK2]);
    expect(baricitinib.evidence.map(routeOf)).not.toContainEqual(expect.anything());
  });

  it("leaves out warnings and the route the network panel already says in words", () => {
    expect(path).toEqual([TYK2]);
    const listed = listedEvidence(withRoutes, experiment.network).map((item) => item.id);
    expect(listed).not.toContain("E901");
    expect(listed).toContain("E902");
    expect(withRoutes.evidence.filter((item) => item.kind === "warning")).not.toHaveLength(0);
    expect(listedEvidence(withRoutes, experiment.network).map((item) => item.kind)).not.toContain(
      "warning",
    );
  });

  it("keeps every route when no network panel is shown", () => {
    const listed = listedEvidence(withRoutes, null).map((item) => item.id);
    expect(listed).toEqual(expect.arrayContaining(["E901", "E902"]));
  });
});
