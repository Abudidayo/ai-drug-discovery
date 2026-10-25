import { describe, expect, it } from "vitest";
import { copy } from "./en";

describe("the split-decision note", () => {
  it("speaks of one drug or of how many", () => {
    expect(copy.jury.contestedNote(1)).toBe("The models chose different next steps for this drug.");
    expect(copy.jury.contestedNote(10)).toBe(
      "The models chose different next steps for these 10 drugs.",
    );
  });
});
