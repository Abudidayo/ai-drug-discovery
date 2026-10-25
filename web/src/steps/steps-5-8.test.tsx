import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { Experiment } from "../api/types";
import { copy } from "../copy/en";
import { dateTime } from "../lib/format";
import {
  covidExperiment,
  covidJury,
  covidWithJury,
  dockJob,
  EXPERIMENT_ID,
} from "../test/fixtures";
import { renderApp } from "../test/render";
import { fakeApi, http, serveExperiment, server } from "../test/server";

const E = `/e/${EXPERIMENT_ID}`;
const MODELS = ["Claude Sonnet 5", "GPT-5.4", "GLM-5.3"];

/** Each string is said exactly once on screen (docs/design.md, "Say everything once"). */
function expectOnce(...texts: string[]) {
  for (const text of texts) {
    const found = screen.getAllByText(text, {
      ignore: "script, style, option, [aria-hidden='true'] *",
    });
    expect(found, text).toHaveLength(1);
  }
}

describe("Step 5, Model jury", () => {
  it("offers one button, then shows the result: one row per drug, one split, agreement and one objection", async () => {
    serveExperiment(covidExperiment());
    const user = userEvent.setup();
    renderApp(`${E}/jury`);
    const ask = await screen.findByRole("button", { name: copy.jury.ask });
    expectOnce(copy.jury.panel("Claude Sonnet 5, GPT-5.4 and GLM-5.3"), copy.disclaimer);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(ask);
    const table = await screen.findByRole("table", { name: copy.jury.plotLabel });
    const rows = within(table).getAllByTestId(/^jury-row-/);
    expect(rows).toHaveLength(15);
    // Consensus order: the known-answer drug first, thalidomide last.
    expect(rows[0]).toHaveAttribute("data-testid", "jury-row-CHEMBL2105759");
    expect(rows.at(-1)).toHaveAttribute("data-testid", "jury-row-CHEMBL468");
    // Exactly one split decision, marked once, on colchicine.
    const contested = rows.filter((row) => row.hasAttribute("data-contested"));
    expect(contested.map((row) => row.dataset.testid)).toEqual(["jury-row-CHEMBL107"]);
    const colchicine = screen.getByTestId("jury-row-CHEMBL107");
    for (const word of ["Investigate", "Watch", "Set aside"]) {
      expect(within(colchicine).getByText(word)).toBeInTheDocument();
    }
    // Model names come from the API, each said once (as its column's heading here).
    expectOnce(
      ...MODELS,
      copy.jury.contestedTitle + ".",
      copy.jury.agreement,
      copy.jury.agreementHelp,
      "0.62",
      copy.jury.objectionTitle("GLM-5.3", "Baricitinib"),
      "Blocking JAK1 may also weaken the body's early antiviral defence, so early in infection it could do harm.",
      copy.jury.retried(1),
      copy.jury.rank,
      copy.disclaimer,
    );
    // Each row's ranks are readable without the picture.
    expect(
      within(screen.getByTestId("jury-row-CHEMBL2105759")).getByRole("cell", {
        name: "Claude Sonnet 5: rank 1, GPT-5.4: rank 1, GLM-5.3: rank 2",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.jury.ask })).not.toBeInTheDocument();
  });

  it("shows each model's progress in plain words while the jury reviews", async () => {
    serveExperiment(covidWithJury("running", 1));
    renderApp(`${E}/jury`);
    const progress = await screen.findByRole("list", { name: copy.jury.progressLabel });
    const items = within(progress).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      `Claude Sonnet 5${copy.jury.jurorStatus.valid}`,
      `GPT-5.4${copy.jury.jurorStatus.running}`,
      `GLM-5.3${copy.jury.jurorStatus.pending}`,
    ]);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(copy.jury.agreement)).not.toBeInTheDocument();
  });

  it("says the review is unavailable when the run failed, and shows no votes", async () => {
    serveExperiment(covidWithJury("failed", 0));
    renderApp(`${E}/jury`);
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.jury.unavailable);
    expectOnce(copy.jury.unavailable, "The Model jury is unavailable right now.");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("Investigate")).not.toBeInTheDocument();
  });

  it("says which check each model's answers failed when too few passed", async () => {
    const experiment = covidWithJury("failed", 0);
    const jury = experiment.jury ?? covidJury();
    const errors: Record<string, string[]> = {
      "claude-sonnet-5": [
        "Attempt 1: C4: evidence belongs to another Candidate",
        "Attempt 2: C4: unsupported or unparseable number in rationale",
      ],
      "openai-gpt-5.4": ["Attempt 2: C12: inline evidence must also appear in citation fields"],
    };
    experiment.jury = {
      ...jury,
      jurors: jury.jurors.map((juror) => {
        const failed = errors[juror.model_id];
        return failed
          ? { ...juror, status: "invalid" as const, attempts: 2, errors: failed }
          : { ...juror, status: "valid" as const };
      }),
    };
    serveExperiment(experiment);
    renderApp(`${E}/jury`);
    const list = await screen.findByRole("list", { name: copy.jury.progressLabel });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      `Claude Sonnet 5${copy.jury.invalidBecause(copy.jury.failedCheck.numbers)}`,
      `GPT-5.4${copy.jury.invalidBecause(copy.jury.failedCheck.uncited)}`,
      `GLM-5.3${copy.jury.jurorStatus.valid}`,
    ]);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("leaves out a model whose answers failed the checks, and says so once", async () => {
    const experiment = covidWithJury("done");
    const jury = experiment.jury ?? covidJury();
    experiment.jury = {
      ...jury,
      jurors: jury.jurors.map((juror) =>
        juror.model_id === "glm-5.3" ? { ...juror, status: "invalid" as const } : juror,
      ),
      votes: jury.votes.filter((vote) => vote.model_id !== "glm-5.3"),
    };
    serveExperiment(experiment);
    renderApp(`${E}/jury`);
    const table = await screen.findByRole("table", { name: copy.jury.plotLabel });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(4);
    expect(within(table).queryByText("GLM-5.3")).not.toBeInTheDocument();
    expectOnce(copy.jury.excluded.invalid("GLM-5.3"));
    // No invented votes: two markers per row.
    expect(
      within(screen.getByTestId("jury-row-CHEMBL2105759")).getByRole("cell", {
        name: "Claude Sonnet 5: rank 1, GPT-5.4: rank 1",
      }),
    ).toBeInTheDocument();
  });

  it("disables asking on an archived experiment, with one short reason", async () => {
    serveExperiment({ ...covidExperiment(), archived_at: "2026-10-25T10:00:00Z" });
    renderApp(`${E}/jury`);
    const ask = await screen.findByRole("button", { name: copy.jury.ask });
    expect(ask).toBeDisabled();
    expect(ask).toHaveAccessibleDescription(copy.jury.archived);
    expectOnce(copy.jury.archived);
  });

  it("shows the API's reason when asking is refused", async () => {
    serveExperiment(covidExperiment());
    server.use(
      http.post("/api/experiments/{experiment_id}/jury", ({ response }) =>
        response(409).json({ detail: "This Experiment is still being built." }),
      ),
    );
    const user = userEvent.setup();
    renderApp(`${E}/jury`);
    await user.click(await screen.findByRole("button", { name: copy.jury.ask }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This Experiment is still being built.",
    );
  });
});

/** The value of each column's drug picker, left to right. */
function picked() {
  return screen
    .getAllByRole("combobox", { name: copy.compare.pick })
    .map((select) => (select as HTMLSelectElement).value);
}

function cellsOf(label: string): string[] {
  const header = screen.getByRole("rowheader", { name: label });
  const row = header.closest("[role='row']");
  if (!(row instanceof HTMLElement)) throw new Error(`No row for ${label}`);
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

describe("Step 6, Compare", () => {
  it("puts the known-answer drug and the next two side by side, each row labelled once", async () => {
    serveExperiment(covidExperiment());
    renderApp(`${E}/compare`);
    await screen.findByRole("table", { name: copy.compare.tableLabel });
    expect(picked()).toEqual(["CHEMBL2105759", "CHEMBL1789941", "CHEMBL221959"]);
    expectOnce(
      copy.candidates.networkRank,
      copy.candidates.evidenceRank,
      copy.compare.targets,
      copy.compare.approval,
      copy.evidence.warningTitle,
      copy.compare.dockable,
      copy.disclaimer,
    );
    // No jury yet, so no decision row.
    expect(screen.queryByRole("rowheader", { name: copy.compare.decision })).toBeNull();
    expect(cellsOf(copy.candidates.networkRank)).toEqual(["1", "2", "3"]);
    expect(cellsOf(copy.candidates.evidenceRank)).toEqual(["1", "241", "2"]);
    expect(cellsOf(copy.compare.targets)[0]).toBe("JAK1, JAK2, TYK2 and AAK1");
    expect(cellsOf(copy.compare.approval)[0]).toBe("Approved by the US regulator (FDA).");
    expect(cellsOf(copy.evidence.warningTitle)[0]).toBe(
      "Blood clots and blood vessel problems, cancer, lung problems and serious infections.",
    );
    await waitFor(() => {
      expect(cellsOf(copy.compare.dockable)).toEqual(
        ["JAK2", "JAK2", "JAK2"].map(copy.compare.pose.possible),
      );
    });

    // Three molecules, one shared canvas: never more than three WebGL contexts on the step.
    for (const name of ["Baricitinib", "Ruxolitinib", "Tofacitinib"]) {
      expect(
        await screen.findByRole("img", { name: copy.evidence.moleculeLabel(name) }),
      ).toBeInTheDocument();
    }
    expect(document.querySelectorAll("canvas").length).toBeLessThanOrEqual(3);
  });

  it("swaps a drug for another on the shortlist, with plain lines where data is missing", async () => {
    serveExperiment(covidExperiment());
    const user = userEvent.setup();
    renderApp(`${E}/compare`);
    await screen.findByRole("table", { name: copy.compare.tableLabel });
    const [, , third] = screen.getAllByRole("combobox", { name: copy.compare.pick });
    if (third === undefined) throw new Error("No third column");
    // A drug already in another column can't be picked twice.
    expect(within(third).getByRole("option", { name: "Baricitinib" })).toBeDisabled();

    await user.selectOptions(third, "CHEMBL1237022");
    expect(picked()).toEqual(["CHEMBL2105759", "CHEMBL1789941", "CHEMBL1237022"]);
    expect(cellsOf(copy.candidates.networkRank)[2]).toBe("1308");
    expect(cellsOf(copy.compare.dockable)[2]).toBe(copy.compare.pose.unavailable);
    expect(await screen.findByText(copy.evidence.noModel)).toBeInTheDocument();

    await user.selectOptions(third, "CHEMBL4065616");
    expect(cellsOf(copy.candidates.networkRank)[2]).toBe(copy.candidates.notRanked);
    await user.selectOptions(third, "CHEMBL2103830");
    expect(cellsOf(copy.evidence.warningTitle)[2]).toBe(copy.compare.noWarnings);
  });

  it("adds the jury's decision, with a split shown for each model", async () => {
    serveExperiment(covidWithJury("done"));
    const user = userEvent.setup();
    renderApp(`${E}/compare`);
    await screen.findByRole("table", { name: copy.compare.tableLabel });
    expect(cellsOf(copy.compare.decision)).toEqual(["Investigate", "Watch", "Investigate"]);
    const [, , third] = screen.getAllByRole("combobox", { name: copy.compare.pick });
    if (third === undefined) throw new Error("No third column");
    await user.selectOptions(third, "CHEMBL107");
    expectOnce(copy.jury.contestedTitle);
    expect(cellsOf(copy.compare.decision)[2]).toBe(
      "Split decisionClaude Sonnet 5: WatchGPT-5.4: InvestigateGLM-5.3: Set aside",
    );
  });

  it("says a binding pose is computed once its docking job is done", async () => {
    serveExperiment({ ...covidExperiment(), dock_jobs: [dockJob("done")] });
    renderApp(`${E}/compare`);
    await waitFor(() => {
      expect(cellsOf(copy.compare.dockable)[0]).toBe(copy.compare.pose.done("JAK2"));
    });
  });
});

const POSE_LABEL = copy.pose.viewerLabel("Baricitinib", "JAK2");
const STRUCTURE_LINE = copy.pose.structure("6WTO", "JAK2", 1.74);
const NO_STRUCTURE = copy.pose.unsupported.no_structure(
  "Fostamatinib, Dexamethasone, Imatinib, Remdesivir and Colchicine",
  5,
);
const ANTIBODIES = copy.pose.unsupported.antibody(
  "Anifrolumab, Siltuximab, Tocilizumab and Sarilumab",
  4,
);

function control(name: string) {
  return screen.getByRole("button", { name });
}

/** The pose's 3D view once its files are in and the viewer has drawn them. */
async function poseView() {
  const view = await screen.findByRole("img", { name: POSE_LABEL }, { timeout: 4000 });
  await waitFor(() => {
    expect(view).toHaveAttribute("data-ready", "true");
  });
  return view;
}

describe("Step 7, Binding pose", () => {
  it("shows a computed pose with its controls, and says each number, help and reason once", async () => {
    serveExperiment({ ...covidExperiment(), dock_jobs: [dockJob("done")] });
    const user = userEvent.setup();
    renderApp(`${E}/pose`);
    const view = await poseView();

    const picker = screen.getByRole("combobox", { name: copy.pose.pick });
    expect(picker).toHaveValue("CHEMBL2105759");
    expect(
      within(picker)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "Baricitinib",
      "Ruxolitinib",
      "Tofacitinib",
      "Upadacitinib",
      "Fedratinib",
      "Thalidomide",
    ]);
    expectOnce(
      STRUCTURE_LINE,
      copy.pose.score,
      copy.pose.scoreHelp,
      "−10.2",
      copy.pose.redock,
      copy.pose.redockHelp(2),
      copy.pose.redockStatus.passed,
      copy.pose.fixture("pose", true) ?? "",
      copy.pose.caveat,
      copy.pose.unsupportedTitle,
      NO_STRUCTURE,
      ANTIBODIES,
      copy.pose.legend.protein,
      copy.pose.legend.drug,
      copy.disclaimer,
    );
    expect(screen.getByText(/^0\.74/)).toHaveAttribute("data-fixture", "true");
    // Plain words: the program and the statistic are never named.
    expect(document.body).not.toHaveTextContent(/vina|rmsd/i);
    // The hidden network and the pose: never more than three WebGL canvases on the step.
    expect(view.querySelectorAll("canvas")).toHaveLength(1);
    expect(document.querySelectorAll("canvas").length).toBeLessThanOrEqual(3);

    // Four controls above the view: the surface starts on, spin too (motion isn't reduced).
    expect(control(copy.pose.controls.surface)).toHaveAttribute("aria-pressed", "true");
    expect(control(copy.pose.controls.overlay)).toHaveAttribute("aria-pressed", "false");
    expect(control(copy.pose.controls.spin)).toHaveAttribute("aria-pressed", "true");
    expect(control(copy.pose.controls.reset)).toBeEnabled();
    await waitFor(() => {
      expect(view).toHaveAttribute("data-surface", "on");
    });
    await user.click(control(copy.pose.controls.surface));
    expect(control(copy.pose.controls.surface)).toHaveAttribute("aria-pressed", "false");
    await waitFor(() => {
      expect(view).toHaveAttribute("data-surface", "off");
    });
    await user.click(control(copy.pose.controls.surface));
    await waitFor(() => {
      expect(view).toHaveAttribute("data-surface", "on");
    });
    // The crystal position is keyed only while its overlay is drawn, with the toggle's label.
    const overlayKey = () =>
      screen.queryAllByText(copy.pose.controls.overlay).filter((el) => el.closest("li"));
    expect(overlayKey()).toHaveLength(0);
    await user.click(control(copy.pose.controls.overlay));
    expect(control(copy.pose.controls.overlay)).toHaveAttribute("aria-pressed", "true");
    expect(overlayKey()).toHaveLength(1);
    await user.click(control(copy.pose.controls.spin));
    expect(control(copy.pose.controls.spin)).toHaveAttribute("aria-pressed", "false");
    await user.click(control(copy.pose.controls.reset));
  });

  it("asks for a pose, follows the job while it waits and runs, then shows it", async () => {
    const experiment = covidExperiment();
    serveExperiment(experiment);
    server.use(
      http.post("/api/dock", ({ response }) => {
        fakeApi.experiments.set(experiment.id, [
          { ...experiment, dock_jobs: [dockJob("running")] },
          { ...experiment, dock_jobs: [dockJob("done")] },
        ]);
        return response(202).json(dockJob("queued") as never);
      }),
    );
    const user = userEvent.setup();
    renderApp(`${E}/pose`);
    // Before a request: the structure and its redock check, but no docking score yet.
    const show = await screen.findByRole("button", { name: copy.pose.show });
    expectOnce(STRUCTURE_LINE, copy.pose.redock, copy.pose.fixture(null, true) ?? "");
    expect(screen.queryByText(copy.pose.score)).not.toBeInTheDocument();

    await user.click(show);
    expect(await screen.findByRole("status")).toHaveTextContent(
      new RegExp(`^(${copy.pose.queued}|${copy.pose.running})$`),
    );
    expect(await screen.findByText(copy.pose.running)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.pose.show })).not.toBeInTheDocument();
    await poseView();
    expectOnce(copy.pose.score, "−10.2");
  });

  it("says plainly when the pose couldn’t be computed, and offers to try again", async () => {
    serveExperiment({ ...covidExperiment(), dock_jobs: [dockJob("failed")] });
    const user = userEvent.setup();
    renderApp(`${E}/pose`);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(copy.pose.failed);
    expect(alert).toHaveTextContent("Vina stopped: the box is outside the receptor.");
    expect(screen.queryByText(copy.pose.score)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.retry }));
    await poseView();
    expect(screen.queryByText(copy.pose.failed)).not.toBeInTheDocument();
  });

  it("falls back to a saved result when docking is unavailable, and says so once", async () => {
    serveExperiment(covidExperiment());
    server.use(
      http.post("/api/dock", ({ response }) =>
        response.untyped(
          HttpResponse.json({ detail: "The docking worker is down." }, { status: 503 }),
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(`${E}/pose`);
    await user.click(await screen.findByRole("button", { name: copy.pose.show }));
    await poseView();
    expectOnce(copy.pose.saved, copy.pose.score);
    expect(screen.queryByText(copy.pose.unavailable)).not.toBeInTheDocument();

    // Ruxolitinib in 6WTN has no saved result to fall back to.
    await user.selectOptions(
      screen.getByRole("combobox", { name: copy.pose.pick }),
      "CHEMBL1789941",
    );
    expectOnce(copy.pose.structure("6WTN", "JAK2", 1.83), copy.pose.redockStatus.not_measured);
    await user.click(screen.getByRole("button", { name: copy.pose.show }));
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.pose.unavailable);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText(copy.pose.score)).not.toBeInTheDocument();
  });

  it("disables asking on an archived experiment, with one short reason", async () => {
    serveExperiment({ ...covidExperiment(), archived_at: "2026-10-25T10:00:00Z" });
    renderApp(`${E}/pose`);
    const show = await screen.findByRole("button", { name: copy.pose.show });
    expect(show).toBeDisabled();
    expect(show).toHaveAccessibleDescription(copy.pose.archived);
    expectOnce(copy.pose.archived);
  });

  it("shows a score without a 3D model when a result has no files", async () => {
    serveExperiment({
      ...covidExperiment(),
      dock_jobs: [{ ...dockJob("done"), files: null }],
    });
    renderApp(`${E}/pose`);
    expect(await screen.findByText(copy.pose.noFiles)).toBeInTheDocument();
    expectOnce(copy.pose.score, "−10.2", copy.pose.fixture("score", true) ?? "");
    expect(screen.queryByRole("button", { name: copy.pose.controls.surface })).toBeNull();
  });
});

describe("Step 8, Saved experiments", () => {
  const other = (): Experiment => ({
    ...covidExperiment("ready", null, "11111111-2222-4333-8444-555555555555"),
    created_at: "2026-10-24T15:30:00Z",
    dock_jobs: [dockJob("done")],
  });

  it("lists saved experiments, marks the open one and says the data once", async () => {
    serveExperiment(covidExperiment());
    serveExperiment(other());
    renderApp(`${E}/history`);
    const list = await screen.findByRole("list", { name: copy.history.listLabel });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const [open] = items;
    if (open === undefined) throw new Error("No open experiment listed");
    expect(items[0]).toHaveAttribute("aria-current", "true");
    expect(within(open).getByText(copy.history.current)).toBeInTheDocument();
    expect(items[0]).toHaveTextContent(dateTime("2026-10-25T09:00:00Z"));
    expect(items[0]).toHaveTextContent(copy.history.counts(15, 0));
    expect(items[1]).toHaveTextContent(copy.history.counts(15, 1));
    expectOnce(
      copy.history.current,
      copy.history.data(["Open Targets 26.09", "ChEMBL 37", "STRING 12.5"]),
      copy.disclaimer,
    );
    expect(within(open).getByRole("link", { name: "COVID-19" })).toHaveAttribute(
      "href",
      `${E}/biology`,
    );
    expect(document.body).not.toHaveTextContent(/delete/i);
  });

  it("archives and restores an experiment", async () => {
    serveExperiment(covidExperiment());
    serveExperiment(other());
    const user = userEvent.setup();
    renderApp(`${E}/history`);
    const saved = await screen.findByRole("button", { name: /^Saved/ });
    const archived = screen.getByRole("button", { name: /^Archived/ });
    expect(saved).toHaveAttribute("aria-pressed", "true");

    const [first] = await screen.findAllByRole("button", { name: copy.history.archive });
    if (first === undefined) throw new Error("No archive button");
    await user.click(first);
    await expect
      .poll(() =>
        within(screen.getByRole("list", { name: copy.history.listLabel })).getAllByRole("listitem"),
      )
      .toHaveLength(1);
    expect(archived).toHaveTextContent("1");

    await user.click(archived);
    expect(archived).toHaveAttribute("aria-pressed", "true");
    const restore = await screen.findByRole("button", { name: copy.history.restore });
    await user.click(restore);
    expect(await screen.findByText(copy.history.emptyArchived)).toBeInTheDocument();
    await user.click(saved);
    await expect
      .poll(() =>
        within(screen.getByRole("list", { name: copy.history.listLabel })).getAllByRole("listitem"),
      )
      .toHaveLength(2);
  });

  it("explains in plain words why an experiment can't be archived yet", async () => {
    serveExperiment({ ...covidExperiment(), dock_jobs: [dockJob("running")] });
    const user = userEvent.setup();
    renderApp(`${E}/history`);
    await user.click(await screen.findByRole("button", { name: copy.history.archive }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /^A binding pose is still being computed for this Experiment\./,
    );
    expect(
      within(screen.getByRole("list", { name: copy.history.listLabel })).getAllByRole("listitem"),
    ).toHaveLength(1);
  });

  it("opens on the archived list when the open experiment is archived", async () => {
    serveExperiment({ ...covidExperiment(), archived_at: "2026-10-25T10:00:00Z" });
    renderApp(`${E}/history`);
    const archived = await screen.findByRole("button", { name: /^Archived/ });
    await waitFor(() => {
      expect(archived).toHaveAttribute("aria-pressed", "true");
    });
    expect(await screen.findByRole("button", { name: copy.history.restore })).toBeInTheDocument();
  });
});
