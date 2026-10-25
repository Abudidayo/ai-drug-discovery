import { describe, expect, it } from "vitest";
import type { DockJob } from "../api/types";
import { covidExperiment, covidWithJury, dockJob, redockControl } from "../test/fixtures";
import { followUpStates } from "./followUps";

const withJobs = (...jobs: DockJob[]) => ({ ...covidExperiment(), dock_jobs: jobs });

describe("followUpStates", () => {
  it("is idle for both while nothing has been asked", () => {
    expect(followUpStates(covidExperiment())).toEqual({ jury: "idle", pose: "idle" });
  });

  it.each([
    ["queued", "working"],
    ["running", "working"],
    ["done", "ready"],
    ["failed", "idle"],
  ] as const)("follows the jury: %s is %s", (status, state) => {
    expect(followUpStates(covidWithJury(status)).jury).toBe(state);
  });

  it("is working while any pose is queued or running, even when others are done", () => {
    expect(followUpStates(withJobs(dockJob("done", "a"), dockJob("queued", "b"))).pose).toBe(
      "working",
    );
    expect(followUpStates(withJobs(dockJob("running", "a"), dockJob("failed", "b"))).pose).toBe(
      "working",
    );
  });

  it("is ready once a pose is done and none is working, even when others failed", () => {
    expect(followUpStates(withJobs(dockJob("failed", "a"), dockJob("done", "b"))).pose).toBe(
      "ready",
    );
  });

  it("is idle when every pose failed", () => {
    expect(followUpStates(withJobs(dockJob("failed"))).pose).toBe("idle");
  });

  it("counts only the drugs' poses, not the docking's own checks", () => {
    expect(followUpStates(withJobs(redockControl())).pose).toBe("idle");
    expect(followUpStates(withJobs({ ...redockControl(), status: "running" })).pose).toBe("idle");
  });
});
