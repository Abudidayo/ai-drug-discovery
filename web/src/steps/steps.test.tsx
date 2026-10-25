import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { Experiment } from "../api/types";
import { copy, networkWarningText, unscorableReasonText } from "../copy/en";
import { covidExperiment, EXPERIMENT_ID } from "../test/fixtures";
import { renderApp } from "../test/render";
import { http, serveExperiment, server } from "../test/server";

const E = `/e/${EXPERIMENT_ID}`;

/**
 * Each of these strings is said exactly once on screen (docs/design.md, "Say everything once").
 * Labels drawn on the 3D figures themselves (protein symbols, the drug's node) mark points in
 * the picture rather than repeat a statement, as in the prototype, so they don't count.
 */
function expectOnce(...texts: string[]) {
  for (const text of texts) {
    const found = screen.getAllByText(text, { ignore: "script, style, [aria-hidden='true'] *" });
    expect(found, text).toHaveLength(1);
  }
}

/** Waits for the step's figure: the network is the last thing a ready Experiment draws. */
async function ready() {
  return screen.findByRole("img", { name: copy.network.label });
}

beforeEach(() => {
  serveExperiment(covidExperiment());
});

describe("Step 1, Choose a disease, with an Experiment", () => {
  it("shows the search beside the network, with the disease proteins keyed once", async () => {
    renderApp(`${E}/disease`);
    await ready();
    expect(screen.getByRole("searchbox")).toHaveValue("COVID-19");
    expectOnce(copy.legend.disease, copy.disclaimer);
    // The search lists the Disease, so the header doesn't name it again.
    expect(within(screen.getByRole("banner")).queryByText("COVID-19")).not.toBeInTheDocument();
  });
});

describe("Step 2, Its biology", () => {
  it("lists the network's proteins by link strength and names the excluded one once", async () => {
    renderApp(`${E}/biology`);
    await ready();
    const bars = screen.getByRole("list", { name: copy.biology.targetsLabel });
    expect(within(bars).getAllByRole("listitem")).toHaveLength(8);
    expect(within(bars).getByText("ACE2")).toBeInTheDocument();
    expect(within(bars).getByText("0.82")).toBeInTheDocument();
    // CCR2 is not in the network: no bar, one sentence with the reason.
    expect(within(bars).queryByText("CCR2")).not.toBeInTheDocument();
    expectOnce(
      copy.biology.excluded.not_in_graph("CCR2"),
      copy.biology.rule(9, 8),
      copy.biology.strength,
      copy.legend.disease,
      copy.legend.link,
      "COVID-19",
      copy.disclaimer,
    );
  });

  it("explains an empty network when none of the disease's proteins map into it", async () => {
    const experiment = covidExperiment();
    experiment.targets = experiment.targets.map((target) => ({
      ...target,
      retained: false,
      excluded_reason: "not_in_graph" as const,
    }));
    experiment.network = { graph_version: "string-12.5", nodes: [], edges: [] };
    serveExperiment(experiment);
    renderApp(`${E}/biology`);
    expect(await screen.findByText(copy.network.empty)).toBeInTheDocument();
    expectOnce(copy.biology.rule(9, 0), copy.biology.excluded.not_in_graph("ACE2"));
    expect(screen.queryByRole("list", { name: copy.biology.targetsLabel })).not.toBeInTheDocument();
  });
});

describe("Step 3, Candidate drugs", () => {
  it("shows the top five, each drug named once, with every label and note once", async () => {
    renderApp(`${E}/candidates`);
    await ready();
    for (const name of [
      "Baricitinib",
      "Ruxolitinib",
      "Tofacitinib",
      "Upadacitinib",
      "Fedratinib",
    ]) {
      expectOnce(name);
    }
    expect(screen.queryByText("Tocilizumab")).not.toBeInTheDocument();
    expect(screen.queryByText("BARICITINIB")).not.toBeInTheDocument();
    expectOnce(
      copy.candidates.ranking,
      copy.candidates.closeness,
      copy.candidates.networkRank,
      copy.candidates.evidenceRank,
      copy.candidates.closenessHelp,
      copy.candidates.evidenceRankHelp,
      copy.candidates.knownAnswer("Baricitinib", "COVID-19"),
      copy.candidates.showAll(15),
      copy.legend.disease,
      copy.legend.drug,
      copy.legend.both,
      "COVID-19",
      copy.disclaimer,
    );
    // Closeness sits on the drug's own row.
    const row = screen.getByTestId("slope-row-CHEMBL2105759");
    expect(within(row).getByText("−3.1")).toBeInTheDocument();
  });

  it("reveals the whole shortlist, with no closeness where it wasn't measured", async () => {
    const user = userEvent.setup();
    renderApp(`${E}/candidates`);
    await ready();
    await user.click(screen.getByRole("checkbox", { name: copy.candidates.showAll(15) }));

    // 14 drugs have a place on the network; tocilizumab and sarilumab only a distance.
    expect(screen.getAllByTestId(/^slope-row-/)).toHaveLength(14);
    for (const id of ["CHEMBL1237022", "CHEMBL2108730"]) {
      const row = screen.getByTestId(`slope-row-${id}`);
      // A rank point at each end, and no closeness dot or value (never a zero).
      expect(row.querySelectorAll("circle")).toHaveLength(2);
      expect(row).not.toHaveTextContent(/[0-9]\.[0-9]/);
    }
    // "Not measured" and its reason are said once for both drugs.
    expectOnce(copy.candidates.notMeasured, networkWarningText("zero_null_variance"));

    // Remdesivir can't be placed: listed under the chart with its plain reason, and no score.
    expect(screen.queryByTestId("slope-row-CHEMBL4065616")).not.toBeInTheDocument();
    expectOnce("Remdesivir", unscorableReasonText("no_retained_drug_targets"));
  });

  it("names the reason once when no drug can be placed on the network", async () => {
    const experiment: Experiment = covidExperiment();
    experiment.candidates = experiment.candidates.map((candidate) => ({
      ...candidate,
      status: "not_scorable" as const,
      network: null,
      unscorable_reason: "no_retained_disease_targets" as const,
      unscorable_detail: "None of the disease's proteins are in the network.",
    }));
    serveExperiment(experiment);
    renderApp(`${E}/candidates`);
    expect(
      await screen.findByText(unscorableReasonText("no_retained_disease_targets")),
    ).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^slope-row-/)).toHaveLength(0);
    expectOnce("Baricitinib, Ruxolitinib, Tofacitinib, Upadacitinib and Fedratinib");
  });
});

describe("Step 4, Evidence", () => {
  it("shows the known-answer drug's molecule, sourced facts, warnings once and its route", async () => {
    renderApp(`${E}/evidence`);
    await ready();
    expect(
      await screen.findByRole("img", { name: copy.evidence.moleculeLabel("Baricitinib") }),
    ).toBeInTheDocument();
    expectOnce(
      "Baricitinib",
      copy.evidence.warningTitle,
      copy.evidence.pathTitle,
      copy.evidence.route.self("Baricitinib", "TYK2"),
      "Blood clots and blood vessel problems, cancer, lung problems and serious infections.",
      copy.legend.disease,
      copy.legend.drug,
      copy.legend.path,
      "COVID-19",
      copy.disclaimer,
    );
    const facts = screen.getByRole("list", { name: copy.evidence.listLabel });
    expect(within(facts).getAllByRole("listitem")).toHaveLength(6);
    // Facts are the API's plain summaries, not the source's technical statement.
    expect(within(facts).getByText("Blocks JAK1.")).toBeInTheDocument();
    expect(
      within(facts).getByText("Binds AAK1 very strongly in lab tests (9 tests)."),
    ).toBeInTheDocument();
    expect(within(facts).queryByText(/pChEMBL|association score|records/)).not.toBeInTheDocument();
    // Warnings live in the warning box only, never as a fact.
    expect(within(facts).queryByText(/cancer/i)).not.toBeInTheDocument();
    expect(within(facts).getAllByRole("link", { name: "ChEMBL" })[0]).toHaveAttribute(
      "href",
      "https://www.ebi.ac.uk/chembl/api/data/mechanism/5293.json",
    );
    expect(screen.getByRole("link", { name: "DailyMed" })).toBeInTheDocument();
  });

  it("says plainly that an antibody has no small-molecule model", async () => {
    renderApp(`${E}/evidence?drug=CHEMBL1237022`);
    await ready();
    expectOnce("Tocilizumab", copy.evidence.noModel, copy.evidence.routeTitle);
    // Ranked by distance only, so it doesn't claim to rank high.
    expect(screen.queryByText(copy.evidence.pathTitle)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: copy.evidence.moleculeLabel("Tocilizumab") }),
    ).not.toBeInTheDocument();
  });

  it("treats a missing conformer like an antibody instead of breaking", async () => {
    server.use(
      http.get("/api/molecules/{pubchem_cid}/conformer", ({ response }) =>
        response(404).json({ detail: "No 3D structure." }),
      ),
    );
    renderApp(`${E}/evidence`);
    await ready();
    expect(await screen.findByText(copy.evidence.noModel)).toBeInTheDocument();
  });

  it("explains a drug with no place on the network instead of a route", async () => {
    renderApp(`${E}/evidence?drug=CHEMBL4065616`);
    await ready();
    expectOnce(copy.evidence.noRouteTitle, unscorableReasonText("no_retained_drug_targets"));
    expect(screen.queryByText(copy.evidence.pathTitle)).not.toBeInTheDocument();
  });

  it("names the route through connecting proteins", async () => {
    renderApp(`${E}/evidence?drug=CHEMBL384467`);
    await ready();
    expectOnce(copy.evidence.route.via("Dexamethasone", "NR3C1", "IFNAR2", "STAT1"));
  });

  it("keeps the evidence list when there are no recorded warnings, without calling it safe", async () => {
    renderApp(`${E}/evidence?drug=CHEMBL2103830`);
    await ready();
    expectOnce(copy.evidence.noWarnings);
    expect(screen.queryByText(copy.evidence.warningTitle)).not.toBeInTheDocument();
  });
});
