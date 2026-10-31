import { test, expect } from "@playwright/test";

test.describe("Interactive Onboarding Tour", () => {
  test("Dashboard allows launching onboarding tour via news center and stepping through all 5 steps", async ({
    page,
  }) => {
    // Navigate to Dashboard
    await page.goto("http://localhost:5173/");

    // Open Patchnotes & Help center via Bell icon
    const bellBtn = page.locator("button[title='Новости и обновления']");
    await expect(bellBtn).toBeVisible({ timeout: 5000 });
    await bellBtn.click();

    // Click "Запустить тур →" in the banner
    const tourBtn = page.locator("button:has-text('Гид для новичков')");
    await expect(tourBtn).toBeVisible();
    await tourBtn.click();

    // Tour is open
    await expect(page.locator("text=Твой статус и время старта")).toBeVisible({
      timeout: 6000,
    });
    await expect(page.locator("text=ШАГ 1 ИЗ 5")).toBeVisible();

    // Screenshot Step 1
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/onboarding-step-1.png",
      fullPage: true,
    });

    // Step 2
    await page.locator("button:has-text('Далее')").click();
    await expect(page.locator("text=Состав команды и Live-статусы")).toBeVisible();
    await expect(page.locator("text=ШАГ 2 ИЗ 5")).toBeVisible();

    // Step 3
    await page.locator("button:has-text('Далее')").click();
    await expect(page.locator("text=Детальная статистика игрока")).toBeVisible();
    await expect(page.locator("text=ШАГ 3 ИЗ 5")).toBeVisible();

    // Screenshot Step 3 (showing details on player stats & FACEIT rating)
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/onboarding-step-3.png",
      fullPage: true,
    });

    // Step 4
    await page.locator("button:has-text('Далее')").click();
    await expect(page.locator("text=Инвайты и управление сквадом")).toBeVisible();
    await expect(page.locator("text=ШАГ 4 ИЗ 5")).toBeVisible();

    // Step 5
    await page.locator("button:has-text('Далее')").click();
    await expect(page.locator("text=Умный профиль и автоматизация")).toBeVisible();
    await expect(page.locator("text=ШАГ 5 ИЗ 5")).toBeVisible();
    await expect(page.locator("button:has-text('Погнали в бой!')")).toBeVisible();

    // Screenshot Step 5
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/onboarding-step-5.png",
      fullPage: true,
    });

    // Finish tour
    await page.locator("button:has-text('Погнали в бой!')").click();

    // Check modal closed
    await expect(page.locator("text=ШАГ 5 ИЗ 5")).not.toBeVisible();

    // Verify localStorage item was set
    const isCompleted = await page.evaluate(() =>
      localStorage.getItem("readyon_onboarding_completed")
    );
    expect(isCompleted).toBe("true");

    // Reopen the tour via Bell -> Tour button
    await bellBtn.click();
    await tourBtn.click();
    await expect(page.locator("text=ШАГ 1 ИЗ 5")).toBeVisible();

    // Close via (X) button
    await page.locator("button:has(svg.lucide-x)").click();
    await expect(page.locator("text=ШАГ 1 ИЗ 5")).not.toBeVisible();
  });

  test("Profile tab allows replaying the interactive onboarding tour", async ({
    page,
  }) => {
    await page.goto("http://localhost:5173/");

    // Mark as completed so modal doesn't pop up over navigation
    await page.evaluate(() => {
      localStorage.setItem("readyon_onboarding_completed", "true");
    });
    await page.reload();

    // Go to Profile tab
    const profileTabBtn = page.locator("a:has-text('Профиль')");
    await profileTabBtn.click();

    // Find and click "Интерактивный гид"
    const guideItem = page.locator("text=Интерактивный гид").first();
    await expect(guideItem).toBeVisible({ timeout: 5000 });
    await guideItem.click();

    // Assert modal opened
    await expect(page.locator("text=Твой статус и время старта")).toBeVisible();
    await expect(page.locator("text=ШАГ 1 ИЗ 5")).toBeVisible();

    // Close it
    await page.locator("button:has(svg.lucide-x)").click();
    await expect(page.locator("text=ШАГ 1 ИЗ 5")).not.toBeVisible();
  });
});
