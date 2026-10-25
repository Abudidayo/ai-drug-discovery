import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { Evaluation } from "../../api/types";
import { copy } from "../../copy/en";
import { evaluation } from "../../test/fixtures";
import { renderApp } from "../../test/render";
import { http, server } from "../../test/server";

const text = copy.evaluation;

function serve(body: Evaluation) {
  server.use(http.get("/api/evaluation", ({ response }) => response(200).json(body as never)));
}

async function rows() {
  const table = await screen.findByRole("table", { name: text.resultsTitle });
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getByRole("rowheader").textContent);
}

describe("Evaluation page", () => {
  it("is linked once from every other screen's footer", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await user.click(screen.getByRole("link", { name: text.title }));
    expect(await screen.findByRole("heading", { level: 1, name: text.title })).toBeInTheDocument();
    // On its own page, the title says it: no link to itself.
    expect(screen.queryByRole("link", { name: text.title })).not.toBeInTheDocument();
    expect(screen.getAllByText(copy.disclaimer)).toHaveLength(1);
  });

  it("puts the app's ranking first and the random baseline last", async () => {
    renderApp("/evaluation");
    const names = await rows();
    expect(names[0]).toBe(`${text.methods.degree_matched_z ?? ""}${text.ours}`);
    expect(names.at(-1)).toBe(text.methods.random);
    expect(names).toHaveLength(5);
  });

  it("switches to drugs every ranking can place, where a disease can be left out", async () => {
    const user = userEvent.setup();
    renderApp("/evaluation");
    await rows();
    expect(screen.getByRole("button", { name: text.scopes.full_eligible })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(text.found(1, 1956))).toBeInTheDocument();
    expect(screen.queryByText(text.leftOut.no_positive_in_scope)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: text.scopes.common_scorable }));
    expect(screen.getByText(text.leftOut.no_positive_in_scope)).toBeInTheDocument();
    expect(screen.getByText(text.tooFew(1))).toBeInTheDocument();
    // One Disease: no likely ranges to explain.
    expect(screen.queryByText(text.rangeNote)).not.toBeInTheDocument();
  });

  it("says when the numbers are an example, and gives each value's likely range", async () => {
    renderApp("/evaluation");
    await rows();
    expect(screen.getByText(text.example)).toBeInTheDocument();
    expect(screen.getByText(text.rangeNote)).toBeInTheDocument();
    expect(screen.getAllByText(/likely between/).length).toBeGreaterThan(0);
  });

  it("shows a missing metric as missing, never as zero", async () => {
    const [first, ...rest] = evaluation.results;
    if (first === undefined) throw new Error("empty fixture");
    const metrics = Object.fromEntries(
      Object.entries(first.metrics).filter(([name]) => name !== "mrr"),
    );
    serve({
      ...evaluation,
      fixture_note: null,
      results: [{ ...first, metrics, confidence_intervals: null }, ...rest],
    });
    renderApp("/evaluation");
    await rows();
    expect(screen.getAllByText(text.missing)).toHaveLength(1);
    expect(screen.queryByText(text.example)).not.toBeInTheDocument();
  });

  it("says so when nothing has been frozen yet", async () => {
    serve({ results: [], diseases: [], fixture_note: null });
    renderApp("/evaluation");
    expect(await screen.findByText(text.empty)).toBeInTheDocument();
  });

  it("offers to ask again when the server doesn't answer", async () => {
    server.use(http.get("/api/evaluation", () => HttpResponse.error()));
    renderApp("/evaluation");
    expect(await screen.findByText(text.unavailable)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.retry })).toBeInTheDocument();
  });
});
