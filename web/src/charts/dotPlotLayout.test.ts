import { describe, expect, it } from "vitest";
import { markerNudges, rankPosition, rankTicks } from "./dotPlotLayout";

describe("rankPosition", () => {
  it("centres each rank in an equal slot", () => {
    expect(rankPosition(1, 10)).toBe(5);
    expect(rankPosition(10, 10)).toBe(95);
  });
});

describe("rankTicks", () => {
  it("labels 1 and every fifth rank", () => {
    expect(rankTicks(15)).toEqual([1, 5, 10, 15]);
    expect(rankTicks(12)).toEqual([1, 5, 10]);
    expect(rankTicks(3)).toEqual([1, 2, 3]);
    expect(rankTicks(0)).toEqual([]);
  });
});

describe("markerNudges", () => {
  it("fans out models that share a rank and leaves the others on the line", () => {
    expect(markerNudges([1, 1, 2])).toEqual([-4.5, 4.5, 0]);
    expect(markerNudges([4, 4, 4])).toEqual([-9, 0, 9]);
    expect(markerNudges([3, null, 7])).toEqual([0, 0, 0]);
  });
});
