import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const origin = process.env.PROTOTYPE_ORIGIN ?? "http://127.0.0.1:5173";
const evidence = fileURLToPath(new URL("../../../.context/round-two/", import.meta.url));
const names = ["Folio", "Orbit", "Assembly"];
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const errors = [];
const results = [];
let checks = 0;

async function fits(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  assert.ok(
    dimensions.content <= dimensions.viewport,
    `${label}: horizontal overflow ${dimensions.content}/${dimensions.viewport}`,
  );
  const collision = await page.evaluate(() => {
    const picker = document.querySelector(".proto-picker").getBoundingClientRect();
    return [
      ...document.querySelectorAll(".r2-tabs button, .r2-brand, .r2 header button, .r2 header a"),
    ]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.width &&
          box.right > picker.left &&
          box.left < picker.right &&
          box.bottom > picker.top &&
          box.top < picker.bottom
        );
      })
      .map((element) => element.textContent);
  });
  assert.deepEqual(collision, [], `${label}: picker overlaps product controls`);
  checks += 2;
}
async function capture(page, name) {
  await page.locator("body").click({ position: { x: 3, y: 3 } });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${evidence}${name}.png`, fullPage: true, animations: "disabled" });
}

try {
  for (let variant = 1; variant <= 3; variant++) {
    const name = names[variant - 1];
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "no-preference",
    });
    page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`${name}: ${message.text()}`);
    });
    await page.goto(`${origin}/prototypes/round-two/?v=${variant}`);
    await expect(page.locator(".r2")).toHaveAttribute("data-design", name.toLowerCase());
    await expect(page.locator("h1").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const navigation = page.getByRole("navigation", { name: "Explore the project" });
    await expect(navigation.getByRole("button")).toHaveCount(3);
    await expect(
      page.getByRole("button", { name: "Pause animation", exact: true }).first(),
    ).toBeVisible();
    await fits(page, `${name} overview`);
    await capture(page, `${name.toLowerCase()}-problem`);
    const basePath = new URL(page.url()).pathname;

    await navigation.getByRole("button", { name: "Workflow", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Pause workflow animation", exact: true }),
    ).toBeVisible();
    const stages = page.locator("[data-workflow-step]");
    await expect(stages).toHaveCount(4);
    for (let index = 0; index < 4; index++) {
      await stages.nth(index).click();
      await expect(stages.nth(index)).toHaveAttribute("aria-pressed", "true");
      await fits(page, `${name} workflow ${index}`);
    }
    await stages.nth(1).click();
    await capture(page, `${name.toLowerCase()}-workflow`);
    await stages.nth(0).click();
    await page.clock.install();
    await page.getByRole("button", { name: "Play workflow animation", exact: true }).click();
    await page.clock.fastForward(3700);
    await expect(stages.nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Pause workflow animation", exact: true }).click();
    await page.clock.fastForward(8000);
    await expect(stages.nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Replay workflow animation", exact: true }).click();
    await expect(stages.nth(0)).toHaveAttribute("aria-pressed", "true");
    await page.clock.fastForward(3000);
    await page.getByRole("button", { name: "Replay workflow animation", exact: true }).click();
    await page.clock.fastForward(1000);
    await expect(stages.nth(0)).toHaveAttribute("aria-pressed", "true");
    checks += 7;

    await navigation.getByRole("button", { name: "Results", exact: true }).click();
    await expect(page.locator("tr[data-candidate-id]")).toHaveCount(5);
    await fits(page, `${name} results`);
    const search = page.getByRole("searchbox", { name: "Find a drug or protein" });
    await search.fill("not-a-drug-000");
    await expect(page.getByRole("heading", { name: "No matching candidates" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export CSV", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Clear search" }).click();
    await page.getByRole("button", { name: "Show all 15", exact: true }).click();
    await expect(page.locator("tr[data-candidate-id]")).toHaveCount(15);
    await expect(
      page.locator("tr[data-candidate-id]").filter({ hasText: "Remdesivir" }),
    ).toContainText("Unavailable");
    await search.fill("JAK1");
    assert.ok((await page.locator("tr[data-candidate-id]").count()) >= 3);
    await search.fill("");
    await page.getByLabel("Sort candidates").selectOption("name");
    await expect(page.locator("tr[data-candidate-id]").first()).toContainText("Anifrolumab");
    await page.getByLabel("Sort candidates").selectOption("shortlist");
    await page
      .locator("tr[data-candidate-id] .r2-candidate-pick")
      .filter({ hasText: "Ruxolitinib" })
      .click();
    await expect(page.getByRole("region", { name: "Details for Ruxolitinib" })).toBeVisible();
    await page.getByRole("button", { name: "AI review", exact: true }).click();
    await expect(page.locator(".r2-model-reviews > article")).toHaveCount(3);
    await page
      .locator("tr[data-candidate-id] .r2-candidate-pick")
      .filter({ hasText: "Baricitinib" })
      .click();
    await page.getByRole("button", { name: "Molecule", exact: true }).click();
    const slider = page.getByRole("slider", { name: "Rotate molecular structure" });
    await expect(slider).toBeVisible();
    assert.ok((await page.locator(".molecule-bond").count()) > 15);
    await slider.focus();
    await slider.press("ArrowRight");
    await expect(slider).toHaveValue("26");
    assert.ok(page.url().endsWith(`v=${variant}`));
    await page.getByRole("button", { name: "Evidence", exact: true }).click();
    await expect(page.locator(".r2-evidence-list a").first()).toHaveAttribute(
      "href",
      /^https:\/\//,
    );
    const comparison = page.getByRole("region", { name: "Compare candidates", exact: true });
    const second = comparison.getByLabel("Second candidate to compare");
    await expect(second.locator("option")).toHaveCount(14);
    await second.selectOption({ label: "Remdesivir" });
    await expect(comparison).toContainText("Unavailable");
    for (const label of [
      /^(Legacy )?proximity rank$/i,
      /^(Direct )?evidence rank$/i,
      /^AI review rank$/,
      /^Protein targets$/,
      /^Safety$/,
    ]) {
      await expect(comparison.getByRole("rowheader", { name: label, exact: true })).toBeVisible();
    }
    await second.selectOption({ label: "Ruxolitinib" });
    await page
      .locator("tr[data-candidate-id] .r2-candidate-pick")
      .filter({ hasText: "Ruxolitinib" })
      .click();
    await expect(second.locator("option").filter({ hasText: /^Ruxolitinib$/ })).toHaveCount(0);
    await page
      .locator("tr[data-candidate-id] .r2-candidate-pick")
      .filter({ hasText: "Baricitinib" })
      .click();
    await second.selectOption({ label: "Ruxolitinib" });
    assert.ok(
      (await page
        .locator(".r2-demo-label")
        .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))) >= 12,
      `${name}: fixture notice must be readable`,
    );
    assert.ok(
      (await page
        .locator(".r2-evidence-list p")
        .first()
        .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))) >= 13,
      `${name}: evidence must be readable`,
    );
    checks += 10;
    await page.getByRole("button", { name: "Show top five", exact: true }).click();
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    const download = await downloadEvent;
    const csvPath = `${evidence}${name.toLowerCase()}-export.csv`;
    await download.saveAs(csvPath);
    const csv = await readFile(csvPath, "utf8");
    assert.ok(csv.includes("fictional ranks and scores") && csv.includes("Baricitinib"));
    await capture(page, `${name.toLowerCase()}-results`);
    checks += 17;

    for (const size of [
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1600, height: 1000 },
    ]) {
      await page.setViewportSize(size);
      for (const tab of ["Problem & solution", "Workflow", "Results"]) {
        await navigation.getByRole("button", { name: tab, exact: true }).click();
        assert.equal(new URL(page.url()).pathname, basePath, "All three tabs remain in one page");
        await fits(page, `${name} ${size.width}px ${tab}`);
        if (tab === "Results") {
          const box = await page.locator("tr[data-candidate-id]").first().boundingBox();
          assert.ok(
            box && box.y + box.height <= size.height,
            `${name}: show the complete first candidate row in the first laptop viewport (${String(box?.y)} + ${String(box?.height)}/${String(size.height)})`,
          );
        }
        if (size.width !== 1440) {
          const suffix = tab === "Problem & solution" ? "problem" : tab.toLowerCase();
          await capture(page, `${name.toLowerCase()}-${suffix}-${String(size.width)}`);
        }
        checks += 2;
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await navigation.getByRole("button", { name: "Problem & solution", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Reduced motion", exact: true }).first(),
    ).toBeDisabled();
    assert.equal(
      await page
        .locator("main")
        .evaluate(
          (main) =>
            main
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running").length,
        ),
      0,
    );
    await navigation.getByRole("button", { name: "Workflow", exact: true }).click();
    await page.getByRole("button", { name: "Next workflow stage" }).click();
    await expect(stages.nth(1)).toHaveAttribute("aria-pressed", "true");
    checks += 3;
    results.push({ design: name, checks: "passed" });
    await page.close();
  }
  const picker = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await picker.goto(`${origin}/prototypes/round-two/?v=99`);
  await expect(picker.locator(".proto-picker-item[data-active]")).toHaveText("Folio");
  await picker.keyboard.press("2");
  await expect(picker.locator(".proto-picker-item[data-active]")).toHaveText("Orbit");
  await picker.reload();
  await expect(picker.locator(".proto-picker-item[data-active]")).toHaveText("Orbit");
  await picker.keyboard.press("ArrowRight");
  await expect(picker.locator(".proto-picker-item[data-active]")).toHaveText("Assembly");
  await picker.keyboard.press("r");
  await expect(picker.locator(".r2")).toHaveAttribute("data-active-tab", "why");
  await picker.close();
  checks += 5;
  assert.deepEqual(errors, [], "No browser runtime or console errors");
  await writeFile(
    `${evidence}verification.json`,
    JSON.stringify({ checks, results, viewports: [1280, 1440, 1600], errors }, null, 2),
  );
  console.log(
    `Passed ${checks} browser checks for Folio, Orbit and Assembly; laptop layouts, one-page tabs and reduced motion. No runtime/console errors.`,
  );
  console.log(`Evidence: ${evidence}`);
} finally {
  await browser.close();
}
