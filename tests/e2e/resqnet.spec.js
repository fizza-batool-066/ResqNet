// @ts-check
// ResQNet Playwright golden-path test
// Verifies the full UI flow a judge would walk through:
//   1. Landing renders with hero + CTAs
//   2. Login as demo admin
//   3. Dashboard renders with hospitals + emergency button
//   4. Start Emergency → type symptoms → AI pipeline → Emergency Plan Ready
//   5. Open Live Tracking modal
//
// Run with: npx playwright test tests/e2e/resqnet.spec.js
// Requires the dev server running on http://localhost:3000.

const { test, expect } = require("@playwright/test");

const BASE = "http://localhost:3000";

test.describe("ResQNet golden path", () => {
  test("landing → login → dashboard → emergency → plan ready", async ({ page }) => {
    // 1. Landing
    await page.goto(BASE);
    await expect(page).toHaveTitle(/ResQNet/i);
    await expect(page.getByRole("heading", { name: /When Every Second Counts/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start Emergency/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /How It Works/i })).toBeVisible();

    // 2. Get Started → Auth screen
    await page.getByRole("button", { name: /Get Started/i }).click();
    await expect(page.getByRole("heading", { name: /Welcome to ResQNet/i })).toBeVisible();

    // 3. Login as demo admin
    await page.getByLabel(/Email/i).fill("admin@resqnet.io");
    await page.getByLabel(/Password/i).fill("admin123");
    await page.getByRole("button", { name: /^Sign In$/ }).click();
    await expect(page.getByRole("heading", { name: /Admin Panel/i })).toBeVisible();

    // 4. Go to dashboard via user menu
    await page.getByRole("button", { name: /ResQNet/i }).first().click();
    await page.getByRole("menuitem", { name: /Dashboard/i }).click();
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Quick Emergency/i })).toBeVisible();

    // 5. Start emergency
    await page.getByRole("button", { name: /Quick Emergency/i }).click();
    await expect(page.getByRole("heading", { name: /Describe your emergency/i })).toBeVisible();

    // 6. Pick a symptom chip + start analysis
    await page.getByRole("button", { name: /Severe chest pain and shortness of breath/i }).click();
    await page.getByRole("button", { name: /Start AI Analysis/i }).click();

    // 7. Wait for Emergency Plan (allow up to 30s for AI pipeline)
    await expect(page.getByRole("heading", { name: /Emergency Plan Ready/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /Confirm & Dispatch/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Share/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download PDF/i })).toBeVisible();

    // 8. Open live tracking modal
    await page.getByRole("button", { name: /Track live/i }).click();
    await expect(page.getByRole("heading", { name: /Live Ambulance Tracking/i })).toBeVisible({ timeout: 10000 });
  });
});
