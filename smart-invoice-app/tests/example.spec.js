// @ts-check
import { test, expect } from "@playwright/test";

// Test 1: Check karna ki App chalu ho rahi hai aur Dashboard dikh रहा hai
test("Dashboard Load Test", async ({ page }) => {
  // 1. Apna local frontend server url daalein (Vite by default 5173 par chalta hai)
  await page.goto("http://localhost:5173/");

  // 2. Check karein ki page par expected heading dikh raha hai (landing page shows Welcome Back)
  await expect(page.locator("h1")).toContainText(/Welcome Back/i);

  // 3. Low Stock Alert wala section check karein (optional - only if present)
  const lowStock = page.locator("text=Low Stock Alerts");
  if ((await lowStock.count()) > 0) {
    await expect(lowStock).toBeVisible();
  }
});

// Test 2: Settings me jakar Dark Mode test karna
test("Dark Mode Toggle Test", async ({ page }) => {
  // 1. Seedha settings page par jayein
  await page.goto("http://localhost:5173/settings");

  // 2. "Switch to Dark Mode" wale button par click karein
  const darkModeBtn = page.locator('button:has-text("Switch to Dark")');

  // Agar button dikh raha hai (yani light mode me hai), toh click karo
  if (await darkModeBtn.isVisible()) {
    await darkModeBtn.click();
  }

  // 3. Check karein ki dark mode apply hua ya nahi (HTML tag pe class "dark" aayi kya)
  const htmlTag = page.locator("html");
  await expect(htmlTag).toHaveClass(/dark/);
});
