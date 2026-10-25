import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { copy } from "../copy/en";
import { covidExperiment, EXPERIMENT_ID } from "../test/fixtures";
import { renderApp } from "../test/render";
import { http, networkError, server, serveExperiment } from "../test/server";

const E = `/e/${EXPERIMENT_ID}`;

describe("Choosing a disease", () => {
  it("searches, creates the Experiment, shows the build, then its biology", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/");

    await user.type(screen.getByRole("searchbox", { name: copy.search.placeholder }), "sars");
    const result = await screen.findByRole("button", { name: /COVID-19/ });
    // The matched synonym and the disease ID are quiet secondary text on the result.
    expect(within(result).getByText("MONDO_0100096")).toBeInTheDocument();
    expect(result).toHaveTextContent("SARS-CoV-2");

    await user.click(result);
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/e\/[0-9a-f-]+\/biology$/);
    });

    // Queued, then building (polled each second): the stages in plain words, the current one
    // marked. The queued moment is short-lived; its own test covers it.
    await waitFor(
      () => {
        const stages = screen.getByRole("list", { name: copy.experiment.buildLabel });
        expect(
          within(stages).getByText(copy.experiment.stages.ranking).closest("li"),
        ).toHaveAttribute("aria-current", "step");
        expect(
          within(stages).getByText(copy.experiment.stages.targets).closest("li"),
        ).toHaveAttribute("data-state", "done");
      },
      { timeout: 2500 },
    );
    // The header names the Disease once it is known.
    expect(within(screen.getByRole("banner")).getByText("COVID-19")).toBeInTheDocument();

    // Polling picks up the finished build.
    expect(
      await screen.findByRole("list", { name: copy.biology.targetsLabel }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: copy.experiment.buildLabel }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("COVID-19")).toHaveLength(1);
  });

  it("says plainly when no disease matches", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await user.type(screen.getByRole("searchbox"), "zzzz");
    expect(await screen.findByText(copy.search.noMatch("zzzz"))).toBeInTheDocument();
  });

  it("offers a retry when the search can't reach the API", async () => {
    server.use(http.untyped.get("*/api/diseases/search", networkError));
    const user = userEvent.setup();
    renderApp("/");
    await user.type(screen.getByRole("searchbox"), "covid");
    expect(await screen.findByText(copy.search.unavailable)).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: copy.retry }));
    expect(await screen.findByRole("button", { name: /COVID-19/ })).toBeInTheDocument();
    expect(screen.queryByText(copy.search.unavailable)).not.toBeInTheDocument();
  });

  it("says so when the Experiment can't be started", async () => {
    server.use(
      http.post("/api/experiments", ({ response }) =>
        response(503).json({ detail: "The ranking service is down." }),
      ),
    );
    const user = userEvent.setup();
    const { router } = renderApp("/");
    await user.type(screen.getByRole("searchbox"), "covid");
    await user.click(await screen.findByRole("button", { name: /COVID-19/ }));
    expect(await screen.findByText(copy.search.createFailed)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("marks the current Experiment's disease and reopens it without building again", async () => {
    serveExperiment(covidExperiment());
    const user = userEvent.setup();
    const { router } = renderApp(`${E}/disease`);
    const current = await screen.findByRole("button", { name: /COVID-19/ });
    expect(current).toHaveAttribute("aria-current", "true");
    await user.click(current);
    expect(router.state.location.pathname).toBe(`${E}/biology`);
  });
});

describe("An Experiment that isn't ready", () => {
  it("shows the plain error and the way back when the build failed", async () => {
    serveExperiment(covidExperiment("failed"));
    renderApp(`${E}/candidates`);
    expect(await screen.findByText(copy.experiment.failed)).toBeInTheDocument();
    expect(
      screen.getByText("The ranking could not be computed for this disease."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.experiment.chooseAnother })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows a retry when the API is down", async () => {
    server.use(http.untyped.get("*/api/experiments/:id", networkError));
    const user = userEvent.setup();
    renderApp(`${E}/biology`);
    expect(await screen.findByText(copy.experiment.unavailable)).toBeInTheDocument();

    server.resetHandlers();
    serveExperiment(covidExperiment());
    await user.click(screen.getByRole("button", { name: copy.retry }));
    expect(
      await screen.findByRole("list", { name: copy.biology.targetsLabel }),
    ).toBeInTheDocument();
  });

  it("says plainly when there is no such Experiment", async () => {
    renderApp(`${E}/biology`);
    expect(
      await screen.findByRole("heading", { level: 1, name: copy.experiment.notFound.title }),
    ).toBeInTheDocument();
  });

  it("says it is waiting while queued", async () => {
    serveExperiment(covidExperiment("queued"));
    renderApp(`${E}/evidence`);
    expect(await screen.findByText(copy.experiment.queued)).toBeInTheDocument();
  });
});
