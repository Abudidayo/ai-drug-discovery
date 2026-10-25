import type { Page } from "@playwright/test";
import { expect, test } from "./console";

/*
 * Steps 5 to 8 against the real API in fixture mode (COVID-19): ask the Model jury and watch
 * each model answer, compare three drugs, show a binding pose in 3D, then archive and restore the
 * Experiment. Wording comes from web/src/copy/en.ts; model names come from the API.
 */

const DISCLAIMER = /^For learning only\./;

async function expectStep(page: Page, title: string) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.getByText(DISCLAIMER)).toHaveCount(1);
}

/** Creates a COVID-19 Experiment through the API and waits until it is ready. */
async function readyExperiment(page: Page): Promise<string> {
  const created = await page.request.post("/api/experiments", {
    data: { disease_id: "MONDO_0100096" },
  });
  expect(created.status()).toBe(202);
  const { id } = (await created.json()) as { id: string };
  await expect
    .poll(
      async () => {
        const response = await page.request.get(`/api/experiments/${id}`);
        return ((await response.json()) as { status: string }).status;
      },
      { timeout: 15_000 },
    )
    .toBe("ready");
  return id;
}

test("a student asks the jury, compares drugs, then archives and restores", async ({ page }) => {
  const id = await readyExperiment(page);

  // Step 5: one button, then each model's progress, then the result.
  await page.goto(`/e/${id}/jury`);
  await expectStep(page, "Model jury");
  await page.getByRole("button", { name: "Ask the Model jury" }).click();
  const progress = page.getByRole("list", { name: "Model jury progress" });
  await expect(progress).toBeVisible();
  await expect(progress.getByRole("listitem")).toHaveCount(3);
  await expect(progress).toContainText("Claude Sonnet 5");

  const plot = page.getByRole("table", { name: "Each model’s rank and decision for every drug" });
  await expect(plot).toBeVisible({ timeout: 20_000 });
  await expect(plot.getByTestId(/^jury-row-/)).toHaveCount(15);
  await expect(plot.locator("[data-contested]")).toHaveCount(1);
  await expect(page.getByTestId("jury-row-CHEMBL107")).toHaveAttribute("data-contested", "true");
  for (const model of ["Claude Sonnet 5", "GPT-5.4", "GLM-5.3"]) {
    await expect(plot.getByRole("columnheader", { name: model })).toHaveCount(1);
  }
  await expect(page.getByText("Agreement", { exact: true })).toHaveCount(1);
  await expect(page.getByText("0.62", { exact: true })).toHaveCount(1);
  await expect(page.getByText("GLM-5.3’s objection to Baricitinib")).toHaveCount(1);
  await expect(page.getByText(/^Blocking JAK1 may also weaken/)).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Ask the Model jury" })).toHaveCount(0);

  // Step 6: three drugs side by side, the molecules on one shared canvas.
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expectStep(page, "Compare");
  const pickers = page.getByRole("combobox", { name: "Change drug" });
  await expect(pickers).toHaveCount(3);
  await expect(pickers.nth(0)).toHaveValue("CHEMBL2105759");
  await expect(page.getByRole("img", { name: "Baricitinib in 3D. Drag to rotate." })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "Jury decision" })).toHaveCount(1);
  await pickers.nth(2).selectOption("CHEMBL107");
  await expect(page.getByText("Split decision", { exact: true })).toHaveCount(1);
  await pickers.nth(1).selectOption("CHEMBL1237022");
  await expect(page.getByText("Antibody: no small-molecule 3D model")).toBeVisible();
  // The hidden network plus one canvas for every molecule: well within the browser's limit.
  expect(await page.locator("canvas").count()).toBeLessThanOrEqual(3);

  // Step 8: archive the open experiment, then restore it.
  await page.goto(`/e/${id}/history`);
  await expectStep(page, "Saved experiments");
  const list = page.getByRole("list", { name: "Experiments" });
  const open = list.locator("li[aria-current]");
  await expect(open).toContainText("COVID-19");
  await expect(open).toContainText("Open");
  await expect(page.getByText(/^Data: Open Targets/)).toHaveCount(1);
  await expect(page.getByText(/delete/i)).toHaveCount(0);
  await open.getByRole("button", { name: "Archive" }).click();
  await expect(list.locator("li[aria-current]")).toHaveCount(0);

  await page.getByRole("button", { name: /^Archived/ }).click();
  const archived = list.locator("li[aria-current]");
  await expect(archived).toContainText("COVID-19");
  await archived.getByRole("button", { name: "Restore" }).click();
  await expect(archived).toHaveCount(0);
  await page.getByRole("button", { name: /^Saved/ }).click();
  await expect(list.locator("li[aria-current]")).toContainText("COVID-19");
});

test("an archived experiment can't ask the jury, and says why", async ({ page }) => {
  const id = await readyExperiment(page);
  const archived = await page.request.post(`/api/experiments/${id}/archive`);
  expect(archived.ok()).toBe(true);
  await page.goto(`/e/${id}/jury`);
  const ask = page.getByRole("button", { name: "Ask the Model jury" });
  await expect(ask).toBeDisabled();
  await expect(page.getByText(/^This experiment is archived\./)).toHaveCount(1);
});

/**
 * Counts every WebGL context the page creates, on a canvas or offscreen (3Dmol.js draws through
 * an offscreen one), so the test can tell how many are still alive.
 */
async function trackWebGLContexts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const contexts: WebGLRenderingContext[] = [];
    interface HasContext {
      getContext: (this: unknown, ...args: never[]) => unknown;
    }
    const track = (proto: HasContext) => {
      const original = proto.getContext;
      proto.getContext = function getContext(this: unknown, ...args: never[]) {
        const context = original.apply(this, args);
        const isGL =
          context instanceof WebGLRenderingContext || context instanceof WebGL2RenderingContext;
        if (isGL && !contexts.includes(context)) contexts.push(context);
        return context;
      };
    };
    track(HTMLCanvasElement.prototype);
    track(OffscreenCanvas.prototype);
    Object.assign(window, {
      liveWebGLContexts: () => contexts.filter((context) => !context.isContextLost()).length,
    });
  });
}

function liveContexts(page: Page): Promise<number> {
  return page.evaluate(() =>
    (window as unknown as { liveWebGLContexts: () => number }).liveWebGLContexts(),
  );
}

test("a student shows baricitinib's binding pose and checks it against the crystal", async ({
  page,
}) => {
  await trackWebGLContexts(page);
  const id = await readyExperiment(page);

  // Walk on from Compare: the pose takes the stage and the network stays hidden.
  await page.goto(`/e/${id}/compare`);
  await expectStep(page, "Compare");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expectStep(page, "Binding pose");
  await expect(page.getByRole("combobox", { name: "Change drug" })).toHaveValue("CHEMBL2105759");
  await expect(
    page.getByText("Crystal structure 6WTO of JAK2, 1.74 Å resolution", { exact: true }),
  ).toHaveCount(1);
  await expect(page.getByText(/^Fostamatinib, Dexamethasone, Imatinib/)).toHaveCount(1);
  await expect(page.getByText(/are antibodies\. Docking needs a small molecule\.$/)).toHaveCount(1);
  await expect(
    page.getByRole("img", { name: "Protein network in 3D. Drag to rotate." }),
  ).toBeHidden();

  // The cached demo pair comes back at once.
  await page.getByRole("button", { name: "Show binding pose" }).click();
  const view = page.getByRole("img", {
    name: "Baricitinib in JAK2, in 3D. Drag to rotate, scroll to zoom.",
  });
  await expect(view).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
  await expect(view.locator("canvas")).toHaveCount(1);
  await expect(view.locator("canvas")).toBeVisible();
  // Each number once, marked as demo data, and never called by the program's or statistic's name.
  await expect(page.getByText("Docking score", { exact: true })).toHaveCount(1);
  await expect(page.getByText("−10.2", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Redock check", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Good match", { exact: true })).toHaveCount(1);
  await expect(
    page.getByText("Demo data: this pose, its docking score and the redock check are made up."),
  ).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText(/vina|rmsd/i);

  // The pocket surface is computed in the background; it turns off and on again cleanly.
  const surface = page.getByRole("button", { name: "Pocket surface" });
  await expect(surface).toHaveAttribute("aria-pressed", "true");
  await expect(view).toHaveAttribute("data-surface", "on", { timeout: 20_000 });
  await surface.click();
  await expect(surface).toHaveAttribute("aria-pressed", "false");
  await expect(view).toHaveAttribute("data-surface", "off");
  await surface.click();
  await expect(view).toHaveAttribute("data-surface", "on", { timeout: 20_000 });

  // The crystal position, drawn over the pose and taken away again.
  const overlay = page.getByRole("button", { name: "Crystal position" });
  await expect(overlay).toHaveAttribute("aria-pressed", "false");
  await overlay.click();
  await expect(overlay).toHaveAttribute("aria-pressed", "true");
  await overlay.click();
  await expect(overlay).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Spin" }).click();
  await page.getByRole("button", { name: "Reset view" }).click();

  // The hidden network and the pose: two live WebGL contexts, within the limit of three.
  expect(await page.locator("canvas").count()).toBeLessThanOrEqual(3);
  expect(await liveContexts(page)).toBe(2);

  // Leaving the step releases the pose's context, once the step's transition has played.
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expectStep(page, "Saved experiments");
  await expect(view).toHaveCount(0);
  await expect.poll(() => liveContexts(page)).toBe(1);
});
