import { describe, expect, it } from "vitest";
import { covidExperiment } from "../test/fixtures";
import { byNetworkRank, focusCandidate } from "./candidates";

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
