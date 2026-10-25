import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { faceOn, firstMolecule } from "./poseScene";

describe("firstMolecule", () => {
  it("keeps only the best pose of an SDF file", () => {
    const sdf = "pose 1\nM  END\n$$$$\npose 2\nM  END\n$$$$\n";
    expect(firstMolecule(sdf)).toBe("pose 1\nM  END\n$$$$\n");
    expect(firstMolecule("pose 1\nM  END\n")).toBe("pose 1\nM  END\n");
  });
});

describe("faceOn", () => {
  // A flat drug, long along y and thin along z.
  const drug = [
    { x: 0, y: -3, z: 0 },
    { x: 0.8, y: -1, z: 0.05 },
    { x: -0.8, y: 1, z: -0.05 },
    { x: 0, y: 3, z: 0 },
  ];

  it("turns a flat drug to face the reader, its long side across the screen", () => {
    const turn = faceOn(drug, []);
    const long = new Vector3(0, 1, 0).applyQuaternion(turn);
    const thin = new Vector3(0, 0, 1).applyQuaternion(turn);
    expect(Math.abs(long.x)).toBeCloseTo(1, 2);
    expect(Math.abs(thin.z)).toBeCloseTo(1, 2);
  });

  it("looks in from the side with less protein in the way", () => {
    /** Where a wall of protein at depth `z` ends up: below 0 is behind the drug. */
    const wallDepth = (z: number) => {
      const wall = Array.from({ length: 20 }, (_, i) => ({ x: (i % 5) - 2, y: i / 5 - 2, z }));
      return new Vector3(0, 0, z).applyQuaternion(faceOn(drug, wall)).z;
    };
    expect(wallDepth(6)).toBeLessThan(0);
    expect(wallDepth(-6)).toBeLessThan(0);
  });
});
