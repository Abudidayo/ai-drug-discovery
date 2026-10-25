import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { copy, stepSlugs, type StepSlug } from "../copy/en";
import { covidExperiment, EXPERIMENT_ID } from "../test/fixtures";
import { renderApp } from "../test/render";
import { serveExperiment } from "../test/server";
import { Shell } from "./Shell";

const E = `/e/${EXPERIMENT_ID}`;

function renderAt(path: string) {
  return renderApp(path).router;
}

beforeEach(() => {
  serveExperiment(covidExperiment());
});

const titleOf = (slug: StepSlug) => copy.steps[stepSlugs.indexOf(slug)]?.title ?? "";

function expectOnStep(slug: StepSlug) {
  const title = titleOf(slug);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
  const nav = screen.getByRole("navigation", { name: copy.stepsLabel });
  const current = within(nav).getAllByRole("link", { current: "step" });
  expect(current).toHaveLength(1);
  expect(current[0]).toHaveAccessibleName(title);
}

describe("Shell", () => {
  describe.each(stepSlugs)("step %s", (slug) => {
    it("says the title once as a heading and marks the nav by state only", async () => {
      renderAt(`${E}/${slug}`);
      const title = titleOf(slug);
      const intro = copy.steps[stepSlugs.indexOf(slug)]?.intro ?? "";
      // Let the Experiment load, so the step's own figure is on screen too.
      await screen.findByRole("link", { name: copy.evaluation.title });

      expect(screen.getAllByRole("heading", { name: title })).toHaveLength(1);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getAllByText(intro)).toHaveLength(1);
      expectOnStep(slug);
      // The title appears in the heading and as the plain nav label, nowhere else.
      expect(screen.getAllByText(title)).toHaveLength(2);
    });

    it("labels the header buttons exactly Back and Next, with no step counter", () => {
      renderAt(`${E}/${slug}`);
      const header = screen.getByRole("banner");
      const buttons = within(header)
        .getAllByRole("button")
        .map((button) => button.textContent);
      expect(buttons).toEqual([copy.back, copy.next]);
      expect(document.body).not.toHaveTextContent(/step \d|\d (of|\/) 8/i);
    });
  });

  it("disables Back on the first step and Next on the last", () => {
    renderAt(`${E}/disease`);
    expect(screen.getByRole("button", { name: copy.back })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.next })).toBeEnabled();
    cleanup();

    renderAt(`${E}/history`);
    expect(screen.getByRole("button", { name: copy.back })).toBeEnabled();
    expect(screen.getByRole("button", { name: copy.next })).toBeDisabled();
  });

  it("moves through the steps with Back and Next", async () => {
    const user = userEvent.setup();
    const router = renderAt(`${E}/candidates`);

    await user.click(screen.getByRole("button", { name: copy.next }));
    expectOnStep("jury");
    expect(router.state.location.pathname).toBe(`${E}/jury`);

    await user.click(screen.getByRole("button", { name: copy.back }));
    await user.click(screen.getByRole("button", { name: copy.back }));
    expectOnStep("biology");
  });

  it("moves between steps with ArrowDown and ArrowUp and stops at either end", async () => {
    const user = userEvent.setup();
    const router = renderAt(`${E}/biology`);

    await user.keyboard("{ArrowDown}");
    expectOnStep("candidates");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expectOnStep("disease");
    await user.keyboard("{ArrowUp}");
    expectOnStep("disease");
    expect(router.state.location.pathname).toBe(`${E}/disease`);

    for (let i = 0; i < stepSlugs.length + 2; i++) await user.keyboard("{ArrowDown}");
    expectOnStep("history");
  });

  it("ignores arrow keys while an input is focused or a modifier is held", async () => {
    const user = userEvent.setup();
    renderAt(`${E}/biology`);
    const input = document.createElement("input");
    document.body.append(input);

    await user.click(input);
    await user.keyboard("{ArrowDown}");
    expectOnStep("biology");

    input.remove();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expectOnStep("biology");
  });

  it("navigates from the step nav", async () => {
    const user = userEvent.setup();
    renderAt(`${E}/disease`);
    const nav = screen.getByRole("navigation", { name: copy.stepsLabel });
    await user.click(within(nav).getByRole("link", { name: titleOf("pose") }));
    expectOnStep("pose");
  });
});

describe("Landing page", () => {
  it("is step 1 with no Experiment: only Back and Next, both disabled, later steps unavailable", async () => {
    const user = userEvent.setup();
    const router = renderAt("/");
    expectOnStep("disease");
    expect(screen.getByRole("button", { name: copy.back })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.next })).toBeDisabled();

    const nav = screen.getByRole("navigation", { name: copy.stepsLabel });
    expect(within(nav).getAllByRole("link")).toHaveLength(1);
    expect(within(nav).getByText(titleOf("biology"))).toHaveAttribute("aria-disabled", "true");

    await user.keyboard("{ArrowDown}");
    expect(router.state.location.pathname).toBe("/");
  });
});

describe("Disease in the header", () => {
  it("appears once when an Experiment is loaded", () => {
    const router = createMemoryRouter(
      [
        {
          path: "*",
          element: (
            <Shell step="biology" experimentId={EXPERIMENT_ID} disease="COVID-19">
              <p>Figure</p>
            </Shell>
          ),
        },
      ],
      { initialEntries: [`${E}/biology`] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getAllByText("COVID-19")).toHaveLength(1);
    expect(within(screen.getByRole("banner")).getByText("COVID-19")).toBeInTheDocument();
  });

  it("is absent before an Experiment exists", () => {
    renderAt("/");
    expect(screen.queryByText("COVID-19")).not.toBeInTheDocument();
  });
});

describe("Unknown routes", () => {
  it.each(["/nowhere", `${E}/not-a-step`, E])("%s shows a plain not-found page", (path) => {
    renderAt(path);
    expect(
      screen.getByRole("heading", { level: 1, name: copy.notFound.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.notFound.home })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
