import { expect, test, type Page } from "@playwright/test";

/*
 * Steps 5, 6 and 8 against the real API in fixture mode (COVID-19): ask the Model jury and watch
 * each model answer, compare three drugs, then archive and restore the Experiment. Wording comes
 * from web/src/copy/en.ts; model names come from the API.
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
