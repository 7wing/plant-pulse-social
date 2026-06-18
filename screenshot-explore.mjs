const { chromium } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/login");
  await page.waitForTimeout(500);
  const emailInput = page.locator("input[type=email]");
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill("alice@plantpal.test");
    await page.fill("input[type=password]", "PlantPal123!");
    await page.click("button[type=submit]");
  }
  await page.goto("http://localhost:5173/explore");
  await page.waitForTimeout(2000);
  const toggle = page.locator("[aria-label='Toggle view']");
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "explore-list.png", fullPage: true });
    await toggle.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: "explore-grid.png", fullPage: true });
  await browser.close();
})();
