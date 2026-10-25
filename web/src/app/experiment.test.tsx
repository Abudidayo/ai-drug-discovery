import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { copy } from "../copy/en";
import { covidExperiment, EXPERIMENT_ID } from "../test/fixtures";
import { renderApp } from "../test/render";
import { fakeApi, http, networkError, server, serveExperiment } from "../test/server";

const E = `/e/${EXPERIMENT_ID}`;

/** The search box once the Experiment has loaded and its Disease name is pre-filled. */
async function loadedSearchbox() {
  await waitFor(() => {
    expect(screen.getByRole("searchbox", { name: copy.search.placeholder })).toHaveValue(
      "COVID-19",
    );
  });
  return screen.getByRole("searchbox", { name: copy.search.placeholder });
}

describe("Choosing a disease", () => {
  it("builds the first common disease on arrival, on step 1, then Next shows its biology", async () => {
    const created = fakeApi.created;
    const user = userEvent.setup();
    const { router } = renderApp("/");

    // Nothing saved yet: the first common Disease starts building, and step 1 stays on screen
    // with it marked in the list and its build in one line.
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/e\/[0-9a-f-]+\/disease$/);
    });
    expect(fakeApi.created).toBe(created + 1);
    expect(screen.getByText(copy.search.common)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /COVID-19/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      await screen.findByRole("img", { name: copy.network.label }, { timeout: 3000 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.next }));
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/e\/[0-9a-f-]+\/biology$/);
    });
    expect(
      await screen.findByRole("list", { name: copy.biology.targetsLabel }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(fakeApi.created).toBe(created + 1);
  });

  it("shows the build on step 2 while it runs", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/");
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/e\/[0-9a-f-]+\/disease$/);
    });
    // Keep it building for a few polls, so the stages can be read on step 2.
    const id = router.state.location.pathname.split("/")[2] ?? "";
    const building = covidExperiment("building", "ranking", id);
    fakeApi.experiments.set(id, [building, building, covidExperiment("ready", null, id)]);
    await user.click(screen.getByRole("button", { name: copy.next }));

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

  it("searches every disease, with the matched synonym and ID as quiet secondary text", async () => {
    serveExperiment(covidExperiment());
    const user = userEvent.setup();
    renderApp(`${E}/disease`);
    const box = await loadedSearchbox();
    await user.clear(box);
    await user.type(box, "sars");
    // The search results replace the common Diseases; the match is underlined, so its text
    // is split across elements.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /COVID-19/ })).toHaveTextContent("SARS-CoV-2");
    });
    const result = screen.getByRole("button", { name: /COVID-19/ });
    expect(within(result).getByText("MONDO_0100096")).toBeInTheDocument();
    expect(screen.queryByText(copy.search.common)).not.toBeInTheDocument();
  });

  it("says plainly when no disease matches", async () => {
    serveExperiment(covidExperiment());
    const user = userEvent.setup();
    renderApp(`${E}/disease`);
    const box = await loadedSearchbox();
    await user.clear(box);
    await user.type(box, "zzzz");
    expect(await screen.findByText(copy.search.noMatch("zzzz"))).toBeInTheDocument();
  });

  it("offers a retry when the search can't reach the API", async () => {
    server.use(http.untyped.get("*/api/diseases/search", networkError));
    serveExperiment(covidExperiment());
    const user = userEvent.setup();
    renderApp(`${E}/disease`);
    const box = await loadedSearchbox();
    await user.clear(box);
    await user.type(box, "covid");
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
    const { router } = renderApp("/");
    // The first common Disease couldn't be opened: step 1 stays, saying so, with a retry.
    expect(await screen.findByText(copy.search.createFailed)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.retry })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("marks the current Experiment's disease, and choosing it again changes nothing", async () => {
    serveExperiment(covidExperiment());
    const created = fakeApi.created;
    const user = userEvent.setup();
    const { router } = renderApp(`${E}/disease`);
    const current = await screen.findByRole("button", { name: /COVID-19/ });
    expect(current).toHaveAttribute("aria-current", "true");
    await user.click(current);
    expect(router.state.location.pathname).toBe(`${E}/disease`);
    expect(fakeApi.created).toBe(created);
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
