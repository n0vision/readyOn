import { test, expect } from "@playwright/test";

test.describe("Telegram Mini App UI", () => {
  test("Dashboard loads real user group and members", async ({ page }) => {
    // Open Mini App with user ID query
    await page.goto("/?userId=619219842");

    // Check title
    await expect(page.locator("h1")).toContainText("readyOn");

    // Wait for group header selector to load
    await expect(page.locator("select").first()).toBeVisible({ timeout: 10000 });

    // Check members list
    await expect(page.locator("text=Ivan")).toBeVisible();

    // Check ready counter badge
    await expect(page.locator("text=/.*готовы.*/i").first()).toBeVisible();

    // Save dashboard screenshot
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/faceit-dashboard.png",
    });
  });

  test("User can switch status in Mini App", async ({ page }) => {
    await page.goto("/?userId=619219842");

    // Click "Возможно"
    const maybeBtn = page.getByRole("button", { name: "Возможно", exact: true });
    await expect(maybeBtn).toBeVisible();
    await maybeBtn.click();

    // Time picker carousel should NOT be visible when status is "Возможно"
    await expect(page.locator("text=Время старта:")).not.toBeVisible();

    // Click "Готов"
    const readyBtn = page.getByRole("button", { name: "Готов", exact: true });
    await readyBtn.click();

    // Time carousel should now appear
    await expect(page.locator("text=Время старта:")).toBeVisible();

    // Click "19:00" in carousel
    await page.getByRole("button", { name: "19:00", exact: true }).click();

    // Status summary reflects 19:00
    await expect(page.locator("text=/.*19:00.*/").first()).toBeVisible();

    // Save updated screenshot
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/faceit-dashboard.png",
    });
  });

  test("Navigation across tabs works properly", async ({ page }) => {
    await page.goto("/?userId=619219842");

    // Navigate to Group tab
    await page.getByRole("link", { name: /Группа/i }).click();
    await expect(page.getByRole("heading", { name: "Группы", exact: true })).toBeVisible();
    await expect(page.locator("text=CS Пацаны")).toBeVisible();
    await expect(page.getByRole("button", { name: /Инвайт/i }).first()).toBeVisible();

    // Save groups screenshot
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/groups-dashboard.png",
    });

    // Navigate to Profile tab
    await page.getByRole("link", { name: /Профиль/i }).click();
    await expect(page.locator("text=Игровые привязки")).toBeVisible();
    await expect(page.locator("text=Steam")).toBeVisible();
    await expect(page.locator("text=FACEIT")).toBeVisible();

    // Save profile screenshot
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/profile-tab.png",
    });

    // Navigate back to Dashboard
    await page.getByRole("link", { name: /Сквад/i }).click();
    await expect(page.locator("h1")).toContainText("readyOn");
  });

  test("Viewer is placed at the top of squad roster with 'Вы' badge", async ({ page }) => {
    // 1. As Ivan (726420734)
    await page.goto("/?userId=726420734");
    await expect(page.locator("text=Состав команды")).toBeVisible({ timeout: 10000 });

    // The first member card must be Ivan
    const firstCardIvan = page.locator("section div.space-y-2 > div").first();
    await expect(firstCardIvan).toContainText("Ivan");
    await expect(firstCardIvan).toContainText("Вы");

    // Save screenshot of Ivan on top
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/ivan-on-top.png",
    });

    // 2. As Nikita (619219842)
    await page.goto("/?userId=619219842");
    await expect(page.locator("text=Состав команды")).toBeVisible({ timeout: 10000 });

    // The first member card must be wytom
    const firstCardNikita = page.locator("section div.space-y-2 > div").first();
    await expect(firstCardNikita).toContainText("wytom");
    await expect(firstCardNikita).toContainText("Вы");

    // Save screenshot of wytom on top
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/wytom-on-top.png",
    });
  });
});
