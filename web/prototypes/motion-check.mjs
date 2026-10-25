import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const origin = process.env.PROTOTYPE_ORIGIN ?? "http://127.0.0.1:5173";
const evidence = fileURLToPath(new URL("../../.context/", import.meta.url));
await mkdir(`${evidence}motion`, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const samples = [];
const names = ["Story", "Atlas", "Workbench"];
let checks = 0;
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (let variant = 1; variant <= 3; variant++) {
    await page.goto(`${origin}/prototypes/?v=${variant}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
    const selector = variant === 2 ? ".field-signal" : ".map-packets .packet-one";
    const signal = page.locator(selector).first();
    const sample = () =>
      signal.evaluate((node) => ({
        transform: getComputedStyle(node).transform,
        opacity: Number(getComputedStyle(node).opacity),
        playState: getComputedStyle(node).animationPlayState,
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      }));
    const before = await sample();
    await page.screenshot({ path: `${evidence}motion/${names[variant - 1]}-before.png` });
    await page.waitForTimeout(650);
    const after = await sample();
    await page.screenshot({ path: `${evidence}motion/${names[variant - 1]}-after.png` });
    assert.notEqual(
      after.transform,
      before.transform,
      `${names[variant - 1]} must move on arrival`,
    );
    assert.ok(before.opacity > 0 || after.opacity > 0, "A moving signal must be visible");
    await page.getByRole("button", { name: "Pause animation", exact: true }).click();
    // Let the browser commit the pause before measuring a stationary frame.
    await page.waitForTimeout(80);
    const paused = await sample();
    await page.waitForTimeout(350);
    assert.equal(
      (await sample()).transform,
      paused.transform,
      "Pause must freeze the current frame",
    );
    await page.getByRole("button", { name: "Play animation", exact: true }).click();
    await page.waitForTimeout(350);
    assert.notEqual((await sample()).transform, paused.transform, "Play must resume movement");
    await page
      .getByRole("navigation", { name: "Explore the project" })
      .getByRole("button", { name: "How it works" })
      .click();
    await expect(
      page.getByRole("button", { name: "Pause workflow animation", exact: true }),
    ).toBeVisible();
    await page.waitForTimeout(3800);
    await expect(page.locator(".pipeline-stages button").nth(1)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    assert.ok(page.url().includes("/prototypes/?v="), "Tabs stay in the same page");
    samples.push({ variant: names[variant - 1], before, after, paused });
    checks += 7;
  }
  await page.close();
  await context.close();

  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  for (let variant = 1; variant <= 3; variant++) {
    await reduced.goto(`${origin}/prototypes/?v=${variant}`);
    await expect(
      reduced.getByRole("button", { name: "Reduced motion", exact: true }),
    ).toBeDisabled();
    const moving = await reduced
      .locator("main")
      .evaluate(
        (main) =>
          main
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === "running").length,
      );
    assert.equal(moving, 0, "Device reduced-motion preference must remain respected");
    await reduced
      .getByRole("navigation", { name: "Explore the project" })
      .getByRole("button", { name: "How it works" })
      .click();
    await reduced.getByRole("button", { name: "Next workflow stage" }).click();
    await expect(reduced.locator(".pipeline-stages button").nth(1)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    checks += 3;
  }
  await reduced.close();
  assert.deepEqual(errors, [], "No motion-related runtime errors");
  await writeFile(`${evidence}motion/results.json`, JSON.stringify({ checks, samples }, null, 2));
  console.log(
    `Passed ${checks} motion checks: visible autoplay, real frame movement, pause/resume, automatic workflow entry, one-page tabs and reduced motion across all three designs.`,
  );
  console.log(`Frame comparisons and measurements: ${evidence}motion/`);
} finally {
  await browser.close();
}
