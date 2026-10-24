import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { copy, stepSlugs, type StepSlug } from "../copy/en";
import { routes } from "./routes";
import { Shell } from "./Shell";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

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
    it("says the title once as a heading and marks the nav by state only", () => {
      renderAt(`/e/exp-1/${slug}`);
      const title = titleOf(slug);
      const intro = copy.steps[stepSlugs.indexOf(slug)]?.intro ?? "";

      expect(screen.getAllByRole("heading", { name: title })).toHaveLength(1);
      expect(screen.getAllByRole("heading")).toHaveLength(1);
      expect(screen.getAllByText(intro)).toHaveLength(1);
      expectOnStep(slug);
      // The title appears in the heading and as the plain nav label, nowhere else.
      expect(screen.getAllByText(title)).toHaveLength(2);
    });

    it("shows the disclaimer exactly once", () => {
      renderAt(`/e/exp-1/${slug}`);
      expect(screen.getAllByText(copy.disclaimer)).toHaveLength(1);
    });

    it("labels the buttons exactly Back and Next, with no step counter", () => {
      renderAt(`/e/exp-1/${slug}`);
      const buttons = screen.getAllByRole("button").map((button) => button.textContent);
      expect(buttons).toEqual([copy.back, copy.next]);
      expect(document.body).not.toHaveTextContent(/step \d|\d (of|\/) 8/i);
    });

    it("renders a placeholder figure naming the phase that fills it", () => {
      renderAt(`/e/exp-1/${slug}`);
      expect(screen.getByText(/arrives in phase \w+\./)).toBeInTheDocument();
    });
  });

  it("disables Back on the first step and Next on the last", () => {
    renderAt("/e/exp-1/disease");
    expect(screen.getByRole("button", { name: copy.back })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.next })).toBeEnabled();
    cleanup();

    renderAt("/e/exp-1/history");
    expect(screen.getByRole("button", { name: copy.back })).toBeEnabled();
    expect(screen.getByRole("button", { name: copy.next })).toBeDisabled();
  });

  it("moves through the steps with Back and Next", async () => {
    const user = userEvent.setup();
    const router = renderAt("/e/exp-1/candidates");

    await user.click(screen.getByRole("button", { name: copy.next }));
    expectOnStep("evidence");
    expect(router.state.location.pathname).toBe("/e/exp-1/evidence");

    await user.click(screen.getByRole("button", { name: copy.back }));
    await user.click(screen.getByRole("button", { name: copy.back }));
    expectOnStep("biology");
  });

  it("moves between steps with ArrowDown and ArrowUp and stops at either end", async () => {
    const user = userEvent.setup();
    const router = renderAt("/e/exp-1/biology");

    await user.keyboard("{ArrowDown}");
    expectOnStep("candidates");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expectOnStep("disease");
    await user.keyboard("{ArrowUp}");
    expectOnStep("disease");
    expect(router.state.location.pathname).toBe("/e/exp-1/disease");

    for (let i = 0; i < stepSlugs.length + 2; i++) await user.keyboard("{ArrowDown}");
    expectOnStep("history");
  });

  it("ignores arrow keys while an input is focused or a modifier is held", async () => {
    const user = userEvent.setup();
    renderAt("/e/exp-1/biology");
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
    renderAt("/e/exp-1/disease");
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
    expect(screen.getAllByText(copy.disclaimer)).toHaveLength(1);
  });
});

describe("Disease in the header", () => {
  it("appears once when an Experiment is loaded", () => {
    const router = createMemoryRouter(
      [
        {
          path: "*",
          element: (
            <Shell step="biology" experimentId="exp-1" disease="COVID-19">
              <p>Figure</p>
            </Shell>
          ),
        },
      ],
      { initialEntries: ["/e/exp-1/biology"] },
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
  it.each(["/nowhere", "/e/exp-1/not-a-step", "/e/exp-1"])(
    "%s shows a plain not-found page",
    (path) => {
      renderAt(path);
      expect(
        screen.getByRole("heading", { level: 1, name: copy.notFound.title }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: copy.notFound.home })).toHaveAttribute("href", "/");
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      expect(screen.getAllByText(copy.disclaimer)).toHaveLength(1);
    },
  );
});
