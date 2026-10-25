import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const origin = process.env.PROTOTYPE_ORIGIN ?? "http://127.0.0.1:5174";
const evidence = new URL("../../.context/chapter-motion/", import.meta.url).pathname;
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await page.goto(`${origin}/prototypes/?v=1`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".chapter-nav button").nth(1).click();
  const frames = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const samples = [];
        const started = performance.now();
        function frame(now) {
          const matrix = new DOMMatrix(
            getComputedStyle(document.querySelector(".lab-camera-world")).transform,
          );
          samples.push({ time: now - started, scale: matrix.a, x: matrix.e });
          if (now - started < 1800) requestAnimationFrame(frame);
          else resolve(samples);
        }
        requestAnimationFrame(frame);
      }),
  );
  await writeFile(
    `${evidence}${process.env.MOTION_LABEL ?? "latest"}-click.json`,
    JSON.stringify(frames, null, 2),
  );
  const intermediate = frames.filter((frame) => frame.scale > 1.01 && frame.scale < 1.74);
  console.log(
    JSON.stringify({
      frames: frames.length,
      intermediate: intermediate.length,
      first: frames[0],
      last: frames.at(-1),
    }),
  );
  assert.ok(
    intermediate.length > 4,
    "Clicking Years of testing must animate through intermediate camera frames instead of snapping",
  );
  assert.equal(
    await page.locator(".animated-lab").getAttribute("data-camera-moving"),
    null,
    "Camera arrival resumes the illustration",
  );
  assert.equal(
    await page
      .locator(".lab-pipetting-arm")
      .evaluate((node) => getComputedStyle(node).animationPlayState),
    "running",
  );
  console.log("Manual chapter camera transition passed");
  const sample = () =>
    page.locator(".lab-camera-world").evaluate((node) => {
      const matrix = new DOMMatrix(getComputedStyle(node).transform);
      return { scale: matrix.a, x: matrix.e };
    });
  const settled = await sample();
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  await page.waitForTimeout(80);
  await page.getByRole("button", { name: "Play animation", exact: true }).click();
  await page.waitForTimeout(120);
  assert.deepEqual(
    await sample(),
    settled,
    "Resuming details must not replay a completed camera move",
  );
  await page.locator(".chapter-nav button").nth(0).click();
  await page.waitForTimeout(1000);
  await page.locator(".chapter-nav button").nth(1).click();
  await page.waitForTimeout(120);
  const interrupted = await sample();
  assert.equal(
    await page.locator(".animated-lab").getAttribute("data-camera-moving"),
    "true",
    "Internal loops hold during camera travel",
  );
  const retargetFrame = page.evaluate(
    () =>
      new Promise((resolve) => {
        const camera = document.querySelector(".lab-camera-world");
        const read = () => {
          const matrix = new DOMMatrix(getComputedStyle(camera).transform);
          return { scale: matrix.a, x: matrix.e };
        };
        const onClick = (event) => {
          if (
            !(event.target instanceof Element) ||
            event.target.closest(".chapter-nav button") !==
              document.querySelector(".chapter-nav button")
          )
            return;
          document.removeEventListener("click", onClick, true);
          const before = read();
          requestAnimationFrame(() => resolve({ before, after: read() }));
        };
        document.addEventListener("click", onClick, true);
      }),
  );
  await page.locator(".chapter-nav button").nth(0).click();
  const redirected = await retargetFrame;
  assert.ok(
    redirected.after.scale <= redirected.before.scale + 0.04,
    "Rapid retargeting must start at the visible frame, not the old destination",
  );
  await page.waitForTimeout(1000);
  assert.ok(Math.abs((await sample()).scale - 1) < 0.001);
  await page.locator(".chapter-nav button").nth(1).click();
  await page.waitForTimeout(180);
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  await page.waitForTimeout(80);
  const stopped = await sample();
  await page.waitForTimeout(350);
  assert.deepEqual(await sample(), stopped, "Pause freezes an interactive camera move");
  await page.getByRole("button", { name: "Play animation", exact: true }).click();
  await page.waitForTimeout(200);
  assert.notDeepEqual(await sample(), stopped, "Play resumes the interrupted camera");
  await page.waitForTimeout(850);
  await page.locator(".chapter-nav button").nth(2).click();
  await page.waitForTimeout(150);
  const compounds = await sample();
  assert.ok(
    compounds.scale > 1.75 && compounds.scale < 1.9,
    "The compound chapter smoothly refocuses the camera",
  );
  await page.waitForTimeout(850);
  await page.locator(".chapter-nav button").nth(3).focus();
  await page.keyboard.press("Enter");
  assert.ok(Math.abs((await sample()).scale - 1.4) < 0.001, "Keyboard selection stays immediate");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (let chapter = 0; chapter < 4; chapter++) {
    await page.locator(".chapter-nav button").nth(chapter).click();
    assert.equal(
      await page
        .locator(".problem-story")
        .evaluate(
          (node) =>
            node
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running").length,
        ),
      0,
      "Reduced motion must not start a camera tween",
    );
  }
  await writeFile(
    `${evidence}interaction-results.json`,
    JSON.stringify(
      { intermediate: intermediate.length, interrupted, redirected, stopped, compounds },
      null,
      2,
    ),
  );
  console.log(
    "Rapid retargeting, pause/resume, compound refocus, keyboard and reduced motion passed",
  );
} finally {
  await browser.close();
}
