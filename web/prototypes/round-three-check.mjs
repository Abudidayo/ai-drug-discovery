import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
const origin = process.env.PROTOTYPE_ORIGIN ?? "http://127.0.0.1:5174";
const evidence = new URL("../../.context/website-designs/", import.meta.url).pathname;
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const names = ["Half Life"];
let checks = 0;
const errors = [];
const samples = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    acceptDownloads: true,
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (let v = 1; v <= names.length; v++) {
    await page.goto(`${origin}/prototypes/?v=${v}`);
    await page.evaluate(() => document.fonts.ready);
    const nav = page.getByRole("navigation", { name: "Explore the project", includeHidden: true });
    await expect(nav.getByRole("button", { includeHidden: true })).toHaveCount(3);
    if (v === 1) await expect(nav).toBeHidden();
    checks++;
    await expect(
      nav.getByRole("button", { name: "Problem & solution", exact: true, includeHidden: true }),
    ).toHaveAttribute("aria-current", "page");
    checks++;
    const sample = () =>
      page.locator(".lab-pipetting-arm").evaluate((n) => ({
        transform: getComputedStyle(n).transform,
        opacity: getComputedStyle(n).opacity,
        arm: getComputedStyle(document.querySelector(".lab-pipetting-arm")).transform,
        monitor: getComputedStyle(document.querySelector(".lab-monitor-signal")).transform,
        drop: getComputedStyle(document.querySelector(".lab-sample-drop")).transform,
        dropOpacity: getComputedStyle(document.querySelector(".lab-sample-drop")).opacity,
      }));
    await page.waitForTimeout(250);
    const first = await sample();
    await page.waitForTimeout(650);
    const second = await sample();
    assert.notEqual(first.transform, second.transform);
    checks++;
    assert.notEqual(first.arm, second.arm, "Generated scientist must visibly articulate");
    checks++;
    assert.notEqual(first.monitor, second.monitor, "Laboratory signals must travel");
    checks++;
    await page.waitForTimeout(950);
    assert.ok(Number((await sample()).dropOpacity) > 0.1, "A sample drop must be visible");
    checks++;
    await page.getByRole("button", { name: "Pause animation", exact: true }).click();
    await page.waitForTimeout(60);
    const paused = await sample();
    await page.waitForTimeout(400);
    assert.deepEqual(await sample(), paused);
    checks++;
    await page.getByRole("button", { name: "Play animation", exact: true }).click();
    await page.waitForTimeout(500);
    assert.notEqual((await sample()).monitor, paused.monitor);
    checks++;
    await page.getByRole("button", { name: "Replay animation", exact: true }).click();
    await page.waitForTimeout(8150);
    await expect(page.locator("h1")).toContainText("The clues exist");
    await expect(page.locator(".problem-story")).toHaveAttribute("data-chapter", "1");
    checks++;
    await expect(page.locator(".source-note")).toHaveCount(0);
    checks++;
    assert.ok(
      await page
        .locator(".lab-camera-world")
        .evaluate(
          (node, minimum) => new DOMMatrix(getComputedStyle(node).transform).a > minimum,
          v === 1 ? 1.7 : 2.6,
        ),
    );
    checks++;
    checks++;
    await page.getByRole("button", { name: "Replay animation", exact: true }).click();
    await expect(page.locator("h1")).toContainText("The clues exist");
    checks++;
    await page.screenshot({ path: `${evidence}${names[v - 1]}-problem.png`, fullPage: true });
    for (const size of [
      { width: 1280, height: 800 },
      { width: 1600, height: 1000 },
    ]) {
      await page.setViewportSize(size);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      checks++;
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole("button", { name: "See how it works", exact: true }).click();
    await expect(page.locator(".half-life-workflow")).toBeVisible();
    await expect(page.locator(".workflow-presentation")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Story", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    checks++;
    for (let step = 0; step < 5; step++) {
      await page.locator("[data-stage]").nth(step).click();
      await expect(page.locator("[data-stage]").nth(step)).toHaveAttribute("aria-current", "step");
      checks++;
    }
    await page.getByRole("button", { name: "Technical", exact: true }).click();
    await expect(page.locator("[data-stage]")).toHaveCount(0);
    await expect(page.locator("#workflow-map")).toBeVisible();
    await page.getByText("Technical details", { exact: true }).click();
    await expect(page.locator("#technical-diagram")).toHaveAccessibleName(
      /TigerData.*AutoDock Vina/,
    );
    await page.getByText("Technical details", { exact: true }).click();
    assert.equal(new URL(page.url()).searchParams.has("stage"), false);
    checks++;
    await page.getByRole("button", { name: "Read evidence word for word" }).click();
    await expect(page.locator("#evidence-select option")).toHaveCount(18);
    await expect(page.locator("#evidence-statement")).toContainText("ChEMBL 37");
    checks++;
    await page.keyboard.press("Escape");
    await page.screenshot({ path: `${evidence}${names[v - 1]}-workflow.png`, fullPage: true });
    await nav.getByRole("button", { name: "Results", exact: true }).click();
    await expect(nav.getByRole("button", { name: "Results", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    checks++;
    const transform = () =>
      page
        .locator(".rank-traveler")
        .first()
        .evaluate((n) => getComputedStyle(n).transform);
    const before = await transform();
    await page.waitForTimeout(650);
    assert.notEqual(await transform(), before);
    checks++;
    await page.getByRole("button", { name: "Pause animation", exact: true }).click();
    await page.waitForTimeout(70);
    const stopped = await transform();
    await page.waitForTimeout(350);
    assert.equal(await transform(), stopped);
    checks++;
    await expect(page.locator("tbody tr")).toHaveCount(5);
    checks++;
    await page.getByRole("button", { name: "Show all 15" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(15);
    checks++;
    const search = page.getByRole("searchbox", { name: "Find a drug or protein" });
    await search.fill("zz-no-match");
    await expect(page.getByText("No matching candidates")).toBeVisible();
    checks++;
    await expect(page.getByRole("button", { name: "Export CSV" })).toBeDisabled();
    checks++;
    await page.getByRole("button", { name: "Clear search" }).click();
    await search.fill("Baricitinib");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    checks++;
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    await (await downloading).saveAs(`${evidence}${names[v - 1]}-shortlist.csv`);
    checks++;
    await search.fill("");
    await page.getByRole("combobox", { name: "Sort candidates" }).selectOption("name");
    const sorted = await page.locator("tbody strong").allTextContents();
    assert.deepEqual(
      sorted,
      [...sorted].sort((a, b) => a.localeCompare(b)),
    );
    checks++;
    await page.getByRole("combobox", { name: "Sort candidates" }).selectOption("shortlist");
    await page.getByRole("button", { name: "Show top five" }).click();
    await page.locator("tbody button").nth(1).click();
    const selected = await page.locator("tbody button").nth(1).locator("strong").innerText();
    await expect(page.locator(".r2-evidence-heading h3")).toHaveText(selected);
    checks++;
    await page.getByRole("button", { name: "AI review", exact: true }).click();
    await expect(page.locator(".r2-model-reviews")).toBeVisible();
    checks++;
    await page.locator("tbody button").first().click();
    await page.getByRole("button", { name: "Molecule", exact: true }).click();
    await expect(page.getByRole("slider", { name: "Rotate molecular structure" })).toBeVisible();
    checks++;
    await page.getByRole("slider", { name: "Rotate molecular structure" }).fill("80");
    await page.getByRole("button", { name: "Evidence", exact: true }).click();
    await page.screenshot({ path: `${evidence}${names[v - 1]}-results.png`, fullPage: true });
    assert.equal(new URL(page.url()).searchParams.has("v"), false);
    checks++;
    samples.push({ variant: names[v - 1], first, second, paused });
  }
  await expect(page.locator(".proto-picker, .prototype-comparison-bar")).toHaveCount(0);
  checks++;
  await page.goto(`${origin}/prototypes/?v=3`);
  await expect(page.locator(".keynote")).toBeVisible();
  await expect(page.locator(".fieldnotes, .signal")).toHaveCount(0);
  assert.equal(new URL(page.url()).searchParams.has("v"), false);
  checks++;
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".keynote")).toBeVisible();
  checks++;
  await page.reload();
  await expect(page.locator("h1")).toContainText("The clues exist");
  checks++;
  await page.close();
  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  for (let v = 1; v <= names.length; v++) {
    await reduced.goto(`${origin}/prototypes/?v=${v}`);
    await expect(
      reduced.getByRole("button", { name: "Reduced motion", exact: true }),
    ).toBeDisabled();
    checks++;
    assert.equal(
      await reduced
        .locator("main")
        .evaluate(
          (m) => m.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length,
        ),
      0,
    );
    checks++;
    await reduced.locator(".chapter-nav button").nth(1).click();
    await expect(reduced.locator("h1")).toContainText("The clues exist");
    await expect(reduced.locator(".problem-story")).toHaveAttribute("data-chapter", "1");
    checks++;
    checks++;
    await reduced.getByRole("button", { name: "See how it works", exact: true }).click();
    await reduced.getByRole("button", { name: "Technical", exact: true }).click();
    await expect(reduced.locator("[data-stage]")).toHaveCount(0);
    await expect(reduced.locator(".technical-overview")).toBeVisible();
    checks++;
  }
  assert.deepEqual(errors, []);
  checks++;
  await writeFile(
    `${evidence}verification.json`,
    JSON.stringify({ checks, errors, samples }, null, 2),
  );
  console.log(`Passed ${checks} checks for the selected Half Life website. Evidence: ${evidence}`);
} finally {
  await browser.close();
}
