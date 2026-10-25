import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const label = process.env.MOTION_LABEL ?? "latest";
const evidence = new URL("../../.context/chapter-motion/", import.meta.url).pathname;
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: "no-preference",
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("http://127.0.0.1:5174/prototypes/?v=1", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Replay animation", exact: true }).click();
  if (process.env.MOTION_ISOLATE === "camera")
    await page.addStyleTag({
      content: ".problem-story [data-motion-target] { animation: none !important; }",
    });
  await page.waitForTimeout(4500);
  await cdp.send("Tracing.start", {
    categories:
      "devtools.timeline,disabled-by-default-devtools.timeline,cc,disabled-by-default-cc.debug",
    transferMode: "ReturnAsStream",
  });
  const frames = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const times = [];
        const start = performance.now();
        function sample(now) {
          times.push(now);
          if (now - start < 2500) requestAnimationFrame(sample);
          else resolve(times);
        }
        requestAnimationFrame(sample);
      }),
  );
  const completed = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
  await cdp.send("Tracing.end");
  const { stream } = await completed;
  let raw = "";
  while (true) {
    const part = await cdp.send("IO.read", { handle: stream });
    raw += part.data;
    if (part.eof) break;
  }
  await cdp.send("IO.close", { handle: stream });
  await writeFile(`${evidence}${label}-trace.json`, raw);
  const trace = JSON.parse(raw).traceEvents;
  const spans = (name) => trace.filter((event) => event.name === name && event.ph === "X");
  const summary = {
    label,
    viewport: "1440x900 @2x",
    cpuThrottle: 4,
    rafSamples: frames.length,
    frameGapsOver25ms: frames.slice(1).filter((time, index) => time - frames[index] > 25).length,
    events: Object.fromEntries(
      ["Paint", "PrePaint", "Layout", "UpdateLayoutTree", "RasterTask"].map((name) => {
        const events = spans(name);
        return [
          name,
          {
            count: events.length,
            totalMs: Number(
              (events.reduce((sum, event) => sum + (event.dur ?? 0), 0) / 1000).toFixed(2),
            ),
            maxMs: Number(
              (Math.max(0, ...events.map((event) => event.dur ?? 0)) / 1000).toFixed(2),
            ),
          },
        ];
      }),
    ),
  };
  await writeFile(`${evidence}${label}-performance.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
} finally {
  await browser.close();
}
