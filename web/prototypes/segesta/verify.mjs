import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const origin = process.env.PROTOTYPE_ORIGIN ?? "http://127.0.0.1:5175";
const evidence = new URL("../../../.context/segesta/", import.meta.url).pathname;
const names = ["Horizon", "Specimen", "Relay"];
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const frames = [];
let checks = 0;
function check(value, message) {
  assert.ok(value, message);
  checks++;
}
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    acceptDownloads: true,
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const nav = page.getByRole("navigation", { name: "Explore the project" });
  const sample = () =>
    page
      .locator("[data-motion-target]")
      .first()
      .evaluate((element) => ({
        transform: getComputedStyle(element).transform,
        opacity: getComputedStyle(element).opacity,
      }));
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  for (const [index, name] of names.entries()) {
    await page.goto(`${origin}/prototypes/segesta/?v=${index + 1}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(nav.getByRole("button")).toHaveCount(3);
    checks++;
    await expect(
      nav.getByRole("button", { name: "Problem & solution", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    checks++;
    await page.waitForTimeout(180);
    const first = await sample();
    await page.waitForTimeout(650);
    const second = await sample();
    check(first.transform !== second.transform, `${name}: overview visibly autoplays`);
    await page.getByRole("button", { name: "Pause animation", exact: true }).click();
    await page.waitForTimeout(80);
    const frozen = await sample();
    await page.waitForTimeout(400);
    assert.deepEqual(await sample(), frozen, `${name}: pause freezes actual rendered motion`);
    checks++;
    check(
      await page
        .locator("main")
        .evaluate((main) =>
          main
            .getAnimations({ subtree: true })
            .every((animation) => animation.playState !== "running"),
        ),
      `${name}: all overview motion pauses`,
    );
    await page.screenshot({ path: `${evidence}${name}-problem.png`, fullPage: true });
    await page.screenshot({ path: `${evidence}${name}-laptop.png` });
    await page.getByRole("button", { name: "Replay animation", exact: true }).click();
    await page.waitForTimeout(250);
    check(
      (await sample()).transform !== frozen.transform,
      `${name}: replay resumes the explanation`,
    );
    if (index === 0) {
      check(await page.locator(".lab-story-steps").isVisible(), "Research story is visible");
      await page.waitForTimeout(5300);
      await expect(page.locator(".lab-story-steps button").nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      checks++;
    }
    for (const tab of ["Problem & solution", "Workflow", "Results"]) {
      await nav.getByRole("button", { name: tab, exact: true }).click();
      for (const size of [
        { width: 1003, height: 667 },
        { width: 1280, height: 800 },
        { width: 1440, height: 900 },
        { width: 1600, height: 1000 },
      ]) {
        await page.setViewportSize(size);
        check(!(await overflow()), `${name}/${tab}: no laptop overflow at ${size.width}`);
        if (size.width === 1003) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({
            path: `${evidence}${name}-${tab === "Problem & solution" ? "problem" : tab.toLowerCase()}-user-1003.png`,
            fullPage: true,
          });
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await nav.getByRole("button", { name: "Workflow", exact: true }).click();
    const before = await sample();
    await page.waitForTimeout(600);
    check(
      (await sample()).transform !== before.transform,
      `${name}: workflow diagram visibly autoplays`,
    );
    await page.waitForTimeout(4700);
    await expect(page.locator(".stage-list button").nth(1)).toHaveAttribute("aria-pressed", "true");
    checks++;
    await page.getByRole("button", { name: "Pause animation", exact: true }).click();
    await page.waitForTimeout(80);
    for (let stage = 0; stage < 4; stage++) {
      await page.locator(".stage-list button").nth(stage).click();
      await expect(page.locator(".stage-list button").nth(stage)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      checks++;
      check(
        await page.locator(".stage-visual").isVisible(),
        `${name}: stage ${stage + 1} rendered`,
      );
    }
    await page.locator(".stage-list button").first().click();
    await page.screenshot({ path: `${evidence}${name}-workflow.png`, fullPage: true });
    await page.getByRole("button", { name: "Explore the results", exact: true }).click();
    const resultBefore = await sample();
    await page.waitForTimeout(650);
    check(
      (await sample()).transform !== resultBefore.transform,
      `${name}: results visibly autoplay`,
    );
    await page.getByRole("button", { name: "Pause animation", exact: true }).click();
    await page.waitForTimeout(80);
    const resultPause = await sample();
    await page.waitForTimeout(350);
    assert.deepEqual(await sample(), resultPause);
    checks++;
    await expect(page.locator("tbody tr")).toHaveCount(5);
    checks++;
    await page.getByRole("button", { name: "Show all 15", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(15);
    checks++;
    const search = page.getByRole("searchbox", { name: "Find a drug or protein" });
    await search.fill("zzz-no-such-compound");
    await expect(page.getByText("No matching candidates")).toBeVisible();
    checks++;
    await expect(page.getByRole("button", { name: "Export CSV", exact: true })).toBeDisabled();
    checks++;
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    await search.fill("Baricitinib");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    checks++;
    await search.press("ArrowLeft");
    check(page.url().includes(`v=${index + 1}`), "Picker shortcuts do not intercept typing");
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    await (await downloading).saveAs(`${evidence}${name}-example.csv`);
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
    await page.getByRole("button", { name: "Show top five", exact: true }).click();
    await page.locator("tbody button").nth(1).click();
    await expect(page.locator(".evidence-title h3")).toHaveText(
      await page.locator("tbody strong").nth(1).innerText(),
    );
    checks++;
    await page.getByRole("button", { name: "AI review", exact: true }).click();
    await expect(page.locator(".review-content")).toBeVisible();
    checks++;
    await page.locator("tbody button").first().click();
    await page.getByRole("button", { name: "Molecule", exact: true }).click();
    await expect(page.getByRole("slider", { name: "Rotate molecular structure" })).toBeVisible();
    checks++;
    await page.getByRole("slider", { name: "Rotate molecular structure" }).fill("95");
    await page.getByRole("button", { name: "Evidence", exact: true }).click();
    await page.getByText("What this prototype demonstrates", { exact: true }).click();
    await expect(
      page.getByText("Optional Docker-based preparation", { exact: false }),
    ).toBeVisible();
    checks++;
    await page.getByText("What this prototype demonstrates", { exact: true }).click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${evidence}${name}-results.png`, fullPage: true });
    frames.push({ name, first, second, frozen });
  }
  await page.locator("h1").click();
  await page.keyboard.press("1");
  await expect(page.locator(".horizon")).toBeVisible();
  checks++;
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".specimen")).toBeVisible();
  checks++;
  await page.reload();
  await expect(page.locator(".specimen")).toBeVisible();
  checks++;
  await nav.getByRole("button", { name: "Results", exact: true }).click();
  await page.keyboard.press("r");
  await expect(
    nav.getByRole("button", { name: "Problem & solution", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  checks++;
  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  for (let variant = 1; variant <= 3; variant++) {
    await reduced.goto(`${origin}/prototypes/segesta/?v=${variant}`);
    const reducedNav = reduced.getByRole("navigation", { name: "Explore the project" });
    for (const tab of ["Problem & solution", "Workflow", "Results"]) {
      await reducedNav.getByRole("button", { name: tab, exact: true }).click();
      await expect(
        reduced.getByRole("button", { name: "Reduced motion enabled", exact: true }),
      ).toBeDisabled();
      checks++;
      check(
        await reduced
          .locator("main")
          .evaluate((main) =>
            main
              .getAnimations({ subtree: true })
              .every((animation) => animation.playState !== "running"),
          ),
        `Reduced motion: ${variant}/${tab}`,
      );
    }
    await reducedNav.getByRole("button", { name: "Workflow", exact: true }).click();
    await reduced.locator(".stage-list button").nth(2).click();
    await expect(reduced.locator(".stage-list button").nth(2)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    checks++;
    await reduced.setViewportSize({ width: 390, height: 844 });
    check(
      !(await reduced.evaluate(() => document.documentElement.scrollWidth > innerWidth)),
      `Small-screen fallback: ${variant}`,
    );
    await reduced.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      scrollTo(0, 0);
    });
    await reduced.screenshot({
      path: `${evidence}${names[variant - 1]}-small.png`,
      fullPage: true,
    });
    await reduced.setViewportSize({ width: 1440, height: 900 });
  }
  assert.deepEqual(errors, []);
  checks++;
  await writeFile(
    `${evidence}verification.json`,
    JSON.stringify({ checks, errors, frames }, null, 2),
  );
  console.log(`Passed ${checks} browser checks. Screenshots and frame samples: ${evidence}`);
} finally {
  await browser.close();
}
