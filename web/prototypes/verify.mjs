import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const origin = process.env.PROTOTYPE_ORIGIN ?? "http://127.0.0.1:5173";
const evidence = fileURLToPath(new URL("../../.context/", import.meta.url));
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const errors = [];
let checks = 0;

async function settled(page) {
  await expect(page.locator("h1")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function fits(page, name) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  assert.ok(dimensions.content <= dimensions.viewport, `${name}: page overflows horizontally`);
  const overlaps = await page.evaluate(() => {
    const picker = document.querySelector(".proto-picker").getBoundingClientRect();
    return [...document.querySelectorAll(".section-tabs button, .brand, .demo-badge")].some(
      (element) => {
        const box = element.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.right > picker.left &&
          box.left < picker.right &&
          box.bottom > picker.top &&
          box.top < picker.bottom
        );
      },
    );
  });
  assert.equal(overlaps, false, `${name}: picker must not cover navigation or branding`);
  checks += 2;
}
async function capture(page, name) {
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${evidence}${name}.png`, fullPage: true, animations: "disabled" });
}

try {
  for (let variant = 1; variant <= 3; variant++) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${origin}/prototypes/?v=${variant}`);
    await settled(page);
    await fits(page, `variant ${variant} desktop overview`);
    await expect(
      page.getByRole("navigation", { name: "Explore the project" }).getByRole("button"),
    ).toHaveCount(3);
    await capture(page, `prototype-${variant}-desktop`);

    const navigation = page.getByRole("navigation", { name: "Explore the project" });
    await navigation.getByRole("button", { name: "How it works" }).click();
    const stages = page.locator(".pipeline-stages button");
    await expect(stages).toHaveCount(4);
    for (let step = 0; step < 4; step++) {
      await stages.nth(step).click();
      await expect(stages.nth(step)).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".pipeline-outcome strong")).not.toBeEmpty();
      await fits(page, `variant ${variant} workflow ${step}`);
      checks++;
    }
    await stages.nth(2).click();
    await capture(page, `prototype-${variant}-workflow`);
    await stages.nth(0).click();
    await page.clock.install();
    await page.getByRole("button", { name: "Play workflow animation", exact: true }).click();
    await page.clock.fastForward(3700);
    await expect(stages.nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Pause workflow animation", exact: true }).click();
    await page.clock.fastForward(8000);
    await expect(stages.nth(1)).toHaveAttribute("aria-pressed", "true");
    checks += 2;

    await navigation.getByRole("button", { name: "Results", exact: true }).click();
    await expect(page.locator(".candidate-table tbody tr")).toHaveCount(5);
    await fits(page, `variant ${variant} desktop results`);
    const search = page.getByRole("searchbox", { name: "Find a drug or protein" });
    await search.fill("not-a-real-drug");
    await expect(page.getByRole("heading", { name: "No matching candidates" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export CSV" })).toBeDisabled();
    await page.getByRole("button", { name: "Clear search" }).click();
    await page.getByRole("button", { name: "Show all 15" }).click();
    await expect(page.locator(".candidate-table tbody tr")).toHaveCount(15);
    await expect(page.getByRole("row").filter({ hasText: "Remdesivir" })).toContainText(
      "Unavailable",
    );
    await search.fill("JAK1");
    assert.ok((await page.locator(".candidate-table tbody tr").count()) >= 3);
    await search.fill("");
    await page.getByLabel("Sort candidates").selectOption("name");
    await expect(page.locator(".candidate-table tbody tr").first()).toContainText("Anifrolumab");
    await page.getByLabel("Sort candidates").selectOption("shortlist");
    await page.locator(".candidate-name").filter({ hasText: "Ruxolitinib" }).click();
    await expect(
      page.getByRole("complementary", { name: "Details for Ruxolitinib" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "AI review", exact: true }).click();
    await expect(page.locator(".review-entry")).toHaveCount(3);
    await page.locator(".candidate-name").filter({ hasText: "Baricitinib" }).click();
    await page.getByRole("button", { name: "Molecule", exact: true }).click();
    const range = page.getByRole("slider", { name: "Rotate molecular structure" });
    await expect(range).toBeVisible();
    assert.ok((await page.locator(".molecule-bond").count()) > 15);
    await range.focus();
    await range.press("ArrowRight");
    await expect(range).toHaveValue("26");
    assert.ok(page.url().endsWith(`v=${variant}`), "slider arrows must not switch prototype");
    await page.getByRole("button", { name: "Evidence", exact: true }).click();
    await expect(page.locator(".evidence-list a").first()).toHaveAttribute("href", /^https:\/\//);
    await page.getByRole("button", { name: "Show top five" }).click();
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadEvent;
    const downloadPath = `${evidence}prototype-${variant}-export.csv`;
    await download.saveAs(downloadPath);
    const csv = await readFile(downloadPath, "utf8");
    assert.ok(csv.includes("fictional ranks and scores"));
    assert.ok(csv.includes("Baricitinib"));
    checks += 13;
    if (variant === 3) {
      await page.locator(".compact-rank-review > summary").click();
      await expect(page.getByRole("button", { name: "Replay rank changes" })).toBeVisible();
      await page.getByRole("button", { name: "Replay rank changes" }).click();
      checks += 2;
    }
    await capture(page, `prototype-${variant}-results`);
    if (variant === 3) await page.locator(".compact-rank-review > summary").click();

    for (const size of [
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1600, height: 1000 },
    ]) {
      await page.setViewportSize(size);
      for (const tab of ["Why it matters", "How it works", "Results"]) {
        await navigation.getByRole("button", { name: tab, exact: true }).click();
        await fits(page, `variant ${variant} ${size.width}px ${tab}`);
        if (tab === "Results") {
          const first = await page.locator(".candidate-table tbody tr").first().boundingBox();
          assert.ok(
            first && first.y < size.height,
            `variant ${variant}: first candidate should be visible on a ${size.width}px laptop`,
          );
          checks++;
        }
      }
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    await navigation.getByRole("button", { name: "How it works" }).click();
    await stages.nth(0).click();
    await page.getByRole("button", { name: "Next workflow stage" }).click();
    await expect(stages.nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.clock.fastForward(10000);
    await expect(stages.nth(1)).toHaveAttribute("aria-pressed", "true");
    assert.equal(
      await page
        .locator(".pipeline-scene")
        .evaluate(
          (el) =>
            el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length,
        ),
      0,
    );
    checks += 3;
    await page.close();
  }

  const pickerPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  pickerPage.on("pageerror", (error) => errors.push(error.message));
  await pickerPage.goto(`${origin}/prototypes/?v=99`);
  await settled(pickerPage);
  await expect(pickerPage.locator(".proto-picker-item[data-active]")).toHaveText("Story");
  await pickerPage.keyboard.press("2");
  await expect(pickerPage.locator(".proto-picker-item[data-active]")).toHaveText("Atlas");
  await pickerPage.reload();
  await expect(pickerPage.locator(".proto-picker-item[data-active]")).toHaveText("Atlas");
  await pickerPage.keyboard.press("ArrowRight");
  await expect(pickerPage.locator(".proto-picker-item[data-active]")).toHaveText("Workbench");
  await pickerPage.getByLabel("Disease", { exact: true }).fill("2");
  await expect(pickerPage.locator(".proto-picker-item[data-active]")).toHaveText("Workbench");
  await pickerPage.getByRole("button", { name: "Run the example" }).click();
  await expect(
    pickerPage.getByText("This prototype includes COVID-19 only.", { exact: false }),
  ).toBeVisible();
  await pickerPage.getByLabel("Disease", { exact: true }).fill("COVID-19");
  await pickerPage.getByRole("button", { name: "Run the example" }).click();
  await expect(pickerPage.locator(".pipeline-stages")).toBeVisible();
  await pickerPage.locator("body").click({ position: { x: 10, y: 10 } });
  await pickerPage.keyboard.press("r");
  await expect(pickerPage.getByRole("heading", { name: /Less searching/ })).toBeVisible();
  checks += 8;
  await pickerPage.close();
  assert.deepEqual(errors, [], "No browser runtime or console errors");
  console.log(
    `Passed ${checks} browser checks across three variants, laptop layouts and reduced motion. No runtime or console errors.`,
  );
  console.log(`Screenshots and CSV exports: ${evidence}`);
} finally {
  await browser.close();
}
