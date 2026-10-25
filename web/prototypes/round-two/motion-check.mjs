import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const origin = process.env.PROTOTYPE_ORIGIN ?? "http://127.0.0.1:5173";
const evidence = fileURLToPath(new URL("../../../.context/round-two/motion/", import.meta.url));
const names = ["Folio", "Orbit", "Assembly"];
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const samples = [];
const errors = [];
let checks = 0;

async function frame(page) {
  return page.locator("main [data-motion-target]").evaluateAll((elements) =>
    elements.map((element, index) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        index,
        tag: element.tagName,
        className: element.getAttribute("class"),
        transform: style.transform,
        opacity: Number(style.opacity),
        playState: style.animationPlayState,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        visible:
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0.08 &&
          box.width > 0 &&
          box.height > 0 &&
          box.right > 0 &&
          box.left < innerWidth &&
          box.bottom > 0 &&
          box.top < innerHeight,
      };
    }),
  );
}

function visiblyChanged(before, after) {
  return before.some((previous, index) => {
    const next = after[index];
    return (
      next &&
      (previous.visible || next.visible) &&
      (Math.abs(previous.x - next.x) > 2 ||
        Math.abs(previous.y - next.y) > 2 ||
        Math.abs(previous.width - next.width) > 2 ||
        Math.abs(previous.height - next.height) > 2 ||
        Math.abs(previous.opacity - next.opacity) > 0.12)
    );
  });
}

async function inspectScene(page, label, workflow = false) {
  const pauseName = workflow ? "Pause workflow animation" : "Pause animation";
  const playName = workflow ? "Play workflow animation" : "Play animation";
  const replayName = workflow ? "Replay workflow animation" : "Replay animation";
  await expect(page.getByRole("button", { name: pauseName, exact: true }).first()).toBeVisible();
  await page.waitForTimeout(350);
  const before = await frame(page);
  assert.ok(before.length > 0, `${label}: explanatory figure has motion targets`);
  await page.screenshot({ path: `${evidence}${label}-a.png` });
  let after;
  let moved = false;
  // Sample the full explanation beat, including authored reading holds.
  for (let index = 0; index < 4; index++) {
    await page.waitForTimeout(450);
    after = await frame(page);
    moved = visiblyChanged(before, after);
  }
  assert.ok(moved, `${label}: visible geometry or opacity must change on arrival`);
  await page.screenshot({ path: `${evidence}${label}-b.png` });
  await page.getByRole("button", { name: pauseName, exact: true }).first().click();
  await page.waitForTimeout(120);
  const paused = await frame(page);
  await page.waitForTimeout(350);
  const frozen = await frame(page);
  assert.deepEqual(frozen, paused, `${label}: pause freezes the current visual frame`);
  assert.ok(
    paused.every((item) => item.playState === "paused"),
    `${label}: all targets paused`,
  );
  await page.getByRole("button", { name: playName, exact: true }).first().click();
  await page.waitForTimeout(500);
  const resumed = await frame(page);
  // A loop can contain a deliberate reading hold. Its timeline must still resume.
  const timelineRunning = await page
    .locator("main [data-motion-target]")
    .evaluateAll((elements) =>
      elements.some((element) =>
        element.getAnimations().some((animation) => animation.playState === "running"),
      ),
    );
  assert.ok(timelineRunning, `${label}: play resumes the animation timeline`);
  await page.getByRole("button", { name: pauseName, exact: true }).first().click();
  await page.getByRole("button", { name: replayName, exact: true }).first().click();
  await expect(page.getByRole("button", { name: pauseName, exact: true }).first()).toBeVisible();
  const replayTimes = await page
    .locator("main [data-motion-target]")
    .evaluateAll((elements) =>
      elements.flatMap((element) =>
        element.getAnimations().map((animation) => Number(animation.currentTime)),
      ),
    );
  assert.ok(
    replayTimes.length > 0 && replayTimes.every((time) => time < 200),
    `${label}: replay restarts the figure`,
  );
  if (workflow) {
    await expect(page.locator("[data-workflow-step]").first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  samples.push({ label, before, after, paused, resumed, replayTimes });
  checks += workflow ? 9 : 8;
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  for (let variant = 1; variant <= 3; variant++) {
    const name = names[variant - 1].toLowerCase();
    await page.goto(`${origin}/prototypes/round-two/?v=${variant}`);
    await page.evaluate(() => document.fonts.ready);
    await inspectScene(page, `${name}-problem`);
    const navigation = page.getByRole("navigation", { name: "Explore the project" });
    await navigation.getByRole("button", { name: "Workflow", exact: true }).click();
    await inspectScene(page, `${name}-workflow-0`, true);
    for (let stage = 1; stage <= 3; stage++) {
      await page.locator("[data-workflow-step]").nth(stage).click();
      await page.getByRole("button", { name: "Play workflow animation", exact: true }).click();
      await inspectScene(page, `${name}-workflow-${stage}`, true);
    }
    await navigation.getByRole("button", { name: "Results", exact: true }).click();
    await inspectScene(page, `${name}-results`);
    console.log(
      `${names[variant - 1]}: visible motion and pause/play/replay pass across all three tabs and four workflow stages.`,
    );
  }
  await page.close();

  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  for (let variant = 1; variant <= 3; variant++) {
    await reduced.goto(`${origin}/prototypes/round-two/?v=${variant}`);
    const navigation = reduced.getByRole("navigation", { name: "Explore the project" });
    for (const tab of ["Problem & solution", "Workflow", "Results"]) {
      await navigation.getByRole("button", { name: tab, exact: true }).click();
      await reduced.waitForTimeout(350);
      assert.equal(
        await reduced
          .locator("main")
          .evaluate(
            (main) =>
              main
                .getAnimations({ subtree: true })
                .filter((animation) => animation.playState === "running").length,
          ),
        0,
        `${names[variant - 1]} ${tab}: reduced motion stops animation`,
      );
      if (tab === "Workflow") {
        await reduced.getByRole("button", { name: "Next workflow stage", exact: true }).click();
        await expect(reduced.locator("[data-workflow-step]").nth(1)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await reduced
          .getByRole("button", { name: "Replay workflow animation", exact: true })
          .click();
        await expect(reduced.locator("[data-workflow-step]").first()).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      } else {
        await expect(
          reduced.getByRole("button", { name: "Reduced motion", exact: true }).first(),
        ).toBeDisabled();
        await reduced
          .getByRole("button", { name: "Replay animation", exact: true })
          .first()
          .click();
        // Hover/focus colour feedback is allowed to settle; no explanatory motion may run.
        await reduced.waitForTimeout(350);
        assert.equal(
          await reduced
            .locator("main")
            .evaluate(
              (main) =>
                main
                  .getAnimations({ subtree: true })
                  .filter((animation) => animation.playState === "running").length,
            ),
          0,
          `${names[variant - 1]} ${tab}: replay preserves reduced motion`,
        );
      }
      checks += 3;
    }
  }
  await reduced.close();
  assert.deepEqual(errors, [], "No motion-related runtime errors");
  await writeFile(`${evidence}results.json`, JSON.stringify({ checks, samples, errors }, null, 2));
  console.log(
    `Passed ${checks} motion checks. Paired rendered frames and measurements: ${evidence}`,
  );
} finally {
  await browser.close();
}
