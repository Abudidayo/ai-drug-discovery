import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
const origin = process.env.PROTOTYPE_ORIGIN ?? "http://127.0.0.1:5174";
const evidence = new URL("../../.context/problem-story/", import.meta.url).pathname;
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const errors = [];
const samples = [];
let checks = 0;
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  for (let variant = 1; variant <= 1; variant++) {
    await page.goto(`${origin}/prototypes/?v=${variant}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const headline = await page.locator("h1").innerText();
    const copy = await page
      .locator(
        variant === 1 ? ".keynote-copy>p" : variant === 2 ? ".folio-lede" : ".signal-statement>p",
      )
      .innerText();
    await expect(page.locator(".source-note")).toHaveCount(0);
    checks++;
    await page.getByRole("button", { name: "Replay animation", exact: true }).click();
    if (variant === 1) {
      await page.waitForTimeout(5600);
      const camera = () =>
        page
          .locator(".lab-camera-world")
          .evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).a);
      const moving = await camera();
      assert.ok(moving > 1 && moving < 2.7, "Camera must visibly push into the background monitor");
      checks++;
      await page.getByRole("button", { name: "Pause animation", exact: true }).click();
      await page.waitForTimeout(80);
      const stopped = await camera();
      await page.waitForTimeout(700);
      assert.equal(await camera(), stopped, "Pause freezes the camera mid-move");
      checks++;
      await page.getByRole("button", { name: "Play animation", exact: true }).click();
      await page.waitForTimeout(600);
      assert.notEqual(await camera(), stopped, "Play continues the interrupted camera move");
      checks++;
      samples.push({ moving, stopped, resumed: await camera() });
    }
    for (let chapter = 0; chapter < 4; chapter++) {
      await page.locator(".chapter-nav button").nth(chapter).click();
      await expect(page.locator(".problem-story")).toHaveAttribute("data-chapter", String(chapter));
      await page.waitForTimeout(950);
      checks++;
      assert.equal(
        await page.locator("h1").innerText(),
        headline,
        "The problem headline stays readable throughout",
      );
      checks++;
      assert.equal(
        await page
          .locator(
            variant === 1
              ? ".keynote-copy>p"
              : variant === 2
                ? ".folio-lede"
                : ".signal-statement>p",
          )
          .innerText(),
        copy,
        "Problem explanation never fades or changes",
      );
      checks++;
      assert.equal(await page.locator("h1").evaluate((n) => getComputedStyle(n).opacity), "1");
      checks++;
      if (chapter === 2) {
        const play = page.getByRole("button", { name: "Play animation", exact: true });
        if (await play.isVisible()) await play.click();
        await page.waitForTimeout(1400);
        const compound = () =>
          page
            .locator(".compound-pass")
            .first()
            .evaluate((n) => getComputedStyle(n).transform);
        const before = await compound();
        await page.waitForTimeout(750);
        assert.notEqual(await compound(), before, "Compounds must move through screening");
        checks++;
        await page.getByRole("button", { name: "Pause animation", exact: true }).click();
      }
      await page.screenshot({
        path: `${evidence}design-${variant}-chapter-${chapter}.png`,
        fullPage: true,
      });
    }
    const source = page.locator(".development-source");
    await expect(source).toContainText("10–15 years");
    checks++;
    await expect(source.locator('a[href*="fda.gov"]')).toHaveCount(1);
    checks++;
  }
  await page.close();
  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  for (let variant = 1; variant <= 1; variant++) {
    await reduced.goto(`${origin}/prototypes/?v=${variant}`);
    for (let chapter = 0; chapter < 4; chapter++) {
      await reduced.locator(".chapter-nav button").nth(chapter).click();
      const moving = await reduced
        .locator(".problem-story")
        .evaluate(
          (n) =>
            n
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running").length,
        );
      assert.equal(moving, 0, "Reduced motion supports every scene without animated camera travel");
      checks++;
    }
  }
  assert.deepEqual(errors, []);
  checks++;
  await writeFile(`${evidence}checks.json`, JSON.stringify({ checks, errors, samples }, null, 2));
  console.log(
    `Passed ${checks} problem-story checks, including camera interpolation, interrupted playback, persistent copy, compound screening and reduced motion.`,
  );
} finally {
  await browser.close();
}
