import { describe, expect, it } from "vitest";
import { covidExperiment, covidJury } from "../test/fixtures";
import { countedJurors, excludedJurors, featuredObjection, juryRows, retriedCount } from "./jury";

describe("the recorded COVID-19 jury", () => {
  const { candidates } = covidExperiment();
  const jury = covidJury();

  it("orders rows by consensus and splits on colchicine only", () => {
    const rows = juryRows(jury, candidates);
    expect(rows.map((row) => row.candidate.name).slice(0, 3)).toEqual([
      "BARICITINIB",
      "TOFACITINIB",
      "TOCILIZUMAB",
    ]);
    expect(rows.filter((row) => row.contested).map((row) => row.candidate.name)).toEqual([
      "COLCHICINE",
    ]);
  });

  it("features the most sceptical model's objection to the known-answer drug", () => {
    const objection = featuredObjection(jury, candidates);
    expect(objection?.juror.model.display_name).toBe("GLM-5.3");
    expect(objection?.candidate.name).toBe("BARICITINIB");
    expect(objection?.text).toMatch(/^Blocking JAK1 may also weaken/);
  });

  it("counts valid jurors only, and the one that needed a retry", () => {
    expect(countedJurors(jury)).toHaveLength(3);
    expect(excludedJurors(jury)).toEqual([]);
    expect(retriedCount(jury)).toBe(1);
  });

  it("has an agreement that matches Kendall's W of the ranks", () => {
    const n = candidates.length;
    const sums = candidates.map((c) =>
      jury.votes.filter((v) => v.candidate_id === c.candidate_id).reduce((s, v) => s + v.rank, 0),
    );
    const s = sums.reduce((total, sum) => total + (sum - (3 * (n + 1)) / 2) ** 2, 0);
    expect(jury.agreement).toBeCloseTo((12 * s) / (9 * (n ** 3 - n)), 4);
    expect(jury.agreement).toBeCloseTo(0.6167, 4);
  });
});
