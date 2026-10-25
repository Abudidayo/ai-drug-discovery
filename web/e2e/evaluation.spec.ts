import { expect, test } from "./console";

/*
 * The evaluation page against the real API in fixture mode: reached from the footer, it shows
 * each ranking beside the random baseline, switches which drugs are ranked, and fits a phone.
 */

test("a student opens the evaluation from the footer and switches which drugs are ranked", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "How well the ranking works" }).click();
  await expect(page).toHaveURL(/\/evaluation$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How well the ranking works");
  await expect(page.getByRole("link", { name: "How well the ranking works" })).toHaveCount(0);

  const table = page.getByRole("table", { name: "Known treatments found" });
  const names = table.getByRole("rowheader");
  await expect(names).toHaveCount(5);
  await expect(names.first()).toContainText("Network closeness");
  await expect(names.last()).toHaveText("Random order");

  await page.getByRole("button", { name: "Drugs every ranking can place" }).click();
  await expect(page.getByText("25 known treatments among 1,307 drugs")).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the page fits the screen and only the table scrolls sideways", async ({ page }) => {
    await page.goto("/evaluation");
    await expect(page.getByRole("table")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });
});
