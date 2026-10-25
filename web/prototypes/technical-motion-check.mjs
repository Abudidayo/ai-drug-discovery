import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
const output = new URL("../../.context/technical-overview/", import.meta.url).pathname;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const errors = [];
const checks = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "no-preference",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5174/prototypes/?tab=workflow&view=technical");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#technical-diagram")).toBeHidden();
  await expect(page.locator(".walkthrough-caption, .simple-step")).toHaveCount(0);
  const mainText = await page.locator(".diagram-nodes").textContent();
  for (const term of [
    "Shared Ensembl targets",
    "Shortest STRING paths",
    "Random Walk with Restart",
    "10 network + 5 direct",
    "Statements + E-IDs",
    "Exact wording",
    "GPT-5.4",
    "GLM-5.3",
    "Kimi K3",
    "Borda",
    "TigerData",
  ])
    assert.ok(mainText.includes(term), `Missing visible method: ${term}`);
  await expect(page.locator(".simple-node-keypoint")).toHaveCount(7);
  const labelGeometry = () =>
    page
      .locator(
        ".simple-node-title, .simple-node-keypoint, .simple-node-copy, .workflow-visual text",
      )
      .evaluateAll((labels) =>
        labels.map((label) => {
          const b = label.getBoundingClientRect();
          return { text: label.textContent, x: b.x, y: b.y, width: b.width, height: b.height };
        }),
      );
  const labelsAtStart = await labelGeometry();
  const textFits = await page.locator(".simple-node").evaluateAll((nodes) =>
    nodes.every((node) => {
      const box = node.getBoundingClientRect();
      return (
        node.scrollWidth <= node.clientWidth &&
        node.scrollHeight <= node.clientHeight &&
        [...node.querySelectorAll("h2,p")].every((text) => {
          const b = text.getBoundingClientRect();
          return (
            b.left >= box.left && b.right <= box.right && b.top >= box.top && b.bottom <= box.bottom
          );
        })
      );
    }),
  );
  assert.ok(textFits, "All labels must remain inside their boxes");
  checks.push("Visible methods, algorithms and evidence; every label anchored inside its box");
  await expect(page.locator(".workflow-visual")).toHaveCount(7);
  const graphCue = page.locator("[data-node=connect] .micro-pulse").first();
  const cueOpacity = () => graphCue.evaluate((el) => getComputedStyle(el).opacity);
  const cueStart = await cueOpacity();
  await page.waitForTimeout(250);
  assert.notEqual(
    await cueOpacity(),
    cueStart,
    "The active protein-network diagram must visibly animate",
  );
  checks.push("Seven semantic visuals; active network path visibly animates");
  const signal = page.locator(".evidence-signal").first();
  const sample = () =>
    signal.evaluate((el) => ({
      transform: getComputedStyle(el).transform,
      time: el.getAnimations()[0]?.currentTime,
      state: el.getAnimations()[0]?.playState,
    }));
  await page.waitForTimeout(2250);
  const a = await sample();
  await page.waitForTimeout(250);
  const b = await sample();
  assert.notEqual(a.transform, b.transform);
  assert.equal(b.state, "running");
  checks.push("Autoplay visibly moves evidence");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await signal.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.ready)));
  await graphCue.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.ready)));
  const cuePaused = await cueOpacity();
  const paused = await sample();
  await page.waitForTimeout(500);
  assert.deepEqual(await sample(), paused);
  assert.equal(await cueOpacity(), cuePaused, "Pause must freeze internal diagram cues too");
  checks.push("Pause freezes the visible frame");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(200);
  assert.ok((await sample()).time > paused.time);
  checks.push("Play resumes without resetting");
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  assert.ok((await sample()).time < 300);
  checks.push("Replay restarts");
  const phaseDuration = await signal.evaluate(
    (el) => Number(el.getAnimations()[0].effect.getComputedTiming().duration) / 7,
  );
  const destinations = [];
  for (let phase = 0; phase < 7; phase++) {
    await page.locator(".evidence-signal").evaluateAll(
      (els, time) =>
        els.forEach((el) => {
          el.getAnimations()[0].currentTime = time;
        }),
      (phase + 1) * phaseDuration - 350,
    );
    await page.waitForTimeout(180);
    destinations.push(
      await page.locator(".simple-node[data-active='true']").getAttribute("data-node"),
    );
    assert.deepEqual(
      await labelGeometry(),
      labelsAtStart,
      "Playback must never move or replace labels",
    );
  }
  assert.deepEqual(destinations, [
    "rank",
    "packet",
    "cortex",
    "compare",
    "tiger",
    "docking",
    "tiger",
  ]);
  checks.push("All seven phases animate the connections while text stays fixed");
  for (const [width, height] of [
    [1280, 800],
    [1366, 768],
    [1440, 900],
    [1600, 1000],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(100);
    const layout = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
      footer: document.querySelector(".chapter-footer").getBoundingClientRect().bottom,
      diagram: document.querySelector("#technical-diagram").getAttribute("src"),
      header: getComputedStyle(document.querySelector(".header")).backgroundColor,
      footerBackground: getComputedStyle(document.querySelector(".chapter-footer")).backgroundColor,
    }));
    assert.ok(layout.height <= height + 1, JSON.stringify({ width, height, ...layout }));
    assert.ok(layout.width <= width);
    assert.ok(
      await page
        .locator(".simple-node")
        .evaluateAll((nodes) =>
          nodes.every(
            (node) =>
              node.scrollHeight <= node.clientHeight && node.scrollWidth <= node.clientWidth,
          ),
        ),
      `No node overflow at ${width}×${height}`,
    );
    assert.match(layout.diagram, /complete-workflow-v2/);
    assert.equal(layout.header, "rgba(0, 0, 0, 0)");
    assert.equal(layout.footerBackground, "rgba(0, 0, 0, 0)");
    if (width === 1440) await page.screenshot({ path: output + "technical-visualized.png" });
  }
  checks.push("Full pipeline fits laptop screens; transparent header and footer");
  const details = page.getByRole("button", { name: "Technical details", exact: true });
  await details.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#technical-diagram")).toBeVisible();
  await expect(page.locator("#technical-diagram")).toHaveAccessibleName(
    /openai-gpt-5.4.*glm-5.3.*kimi-k3.*TigerData.*AutoDock Vina/,
  );
  await details.click();
  checks.push("Complete original diagram and exact models remain available on demand");
  await page.getByRole("button", { name: "Read evidence word for word" }).click();
  await expect(page.locator("#evidence-detail")).toBeVisible();
  await page.keyboard.press("Escape");
  checks.push("Evidence inspector remains available");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Reduced motion", exact: true })).toBeDisabled();
  assert.equal(
    await page
      .locator(".evidence-signal")
      .evaluateAll((els) => els.flatMap((el) => el.getAnimations()).length),
    0,
  );
  await expect(page.locator("#workflow-map")).toBeVisible();
  assert.match(
    await page.locator("#technical-diagram").getAttribute("src"),
    /complete-workflow-v2/,
  );
  assert.equal(
    await page
      .locator(".technical-overview")
      .evaluate((el) => el.getAnimations({ subtree: true }).length),
    0,
    "Reduced motion stops both connector and internal diagram animations",
  );
  checks.push("Reduced motion preserves full static content");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeEnabled();
  await page.waitForTimeout(300);
  assert.equal((await sample()).state, "running");
  checks.push("Motion preference changes restore playback");
  await page.goto("http://127.0.0.1:5174/prototypes/workflow-review/?view=technical");
  await expect(page.locator("#workflow-map")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  checks.push("Standalone review uses the same animated component");
  assert.deepEqual(errors, []);
  await writeFile(
    output + "motion-checks.json",
    JSON.stringify({ checks, destinations, errors }, null, 2),
  );
  console.log(`${checks.length} technical motion checks passed`);
} finally {
  await browser.close();
}
