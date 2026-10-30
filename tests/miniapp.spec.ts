import { test, expect } from "@playwright/test";

test.describe("Telegram Mini App UI", () => {
  test("Dashboard loads real user group and members", async ({ page }) => {
    // Open Mini App with user ID query
    await page.goto("/?userId=619219842");

    // Check title
    await expect(page.locator("h1")).toContainText("readyOn");

    // Wait for group header to load with real name
    await expect(page.locator("text=CS Пацаны")).toBeVisible({ timeout: 10000 });

    // Check members list
    await expect(page.locator("text=Ivan")).toBeVisible();

    // Check ready counter badge
    await expect(page.locator("text=/.*готовы.*/")).toBeVisible();

    // Save dashboard screenshot
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/faceit-dashboard.png",
    });
  });

  test("User can switch status in Mini App", async ({ page }) => {
    await page.goto("/?userId=619219842");

    // Click "Может быть" (🟡)
    const maybeBtn = page.getByRole("button", { name: /Может быть/i });
    await expect(maybeBtn).toBeVisible();
    await maybeBtn.click();

    // Should not show time picker
    await expect(page.locator("text=Во сколько сможешь играть?")).not.toBeVisible();

    // Click "Готов" (🟢)
    const readyBtn = page.getByRole("button", { name: /Готов/i });
    await readyBtn.click();

    // Time picker should appear
    await expect(page.locator("text=Во сколько сможешь играть?")).toBeVisible();

    // Click "19:00"
    await page.getByRole("button", { name: "19:00" }).click();

    // Time picker closes and label shows time
    await expect(page.locator("text=Готов с 19:00")).toBeVisible();
  });

  test("Navigation across tabs works properly", async ({ page }) => {
    await page.goto("/?userId=619219842");

    // Navigate to Groups tab
    await page.getByRole("link", { name: /Группы/i }).click();
    await expect(page.getByRole("heading", { name: "👥 Группы" })).toBeVisible();
    await expect(page.locator("text=CS Пацаны")).toBeVisible();
    await expect(page.getByRole("button", { name: /Инвайт/i })).toBeVisible();

    // Save groups screenshot
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/groups-dashboard.png",
    });

    // Navigate to Profile tab
    await page.getByRole("link", { name: /Профиль/i }).click();
    await expect(page.locator("text=Игровые привязки")).toBeVisible();
    await expect(page.locator("text=Steam")).toBeVisible();
    await expect(page.locator("text=FACEIT")).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole("link", { name: /Статусы/i }).click();
    await expect(page.locator("h1")).toContainText("readyOn");
  });
});
