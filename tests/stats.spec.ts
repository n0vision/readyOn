import { test, expect } from "@playwright/test";

const API_BASE = "http://127.0.0.1:3000";
const TELEGRAM_ID = "619219842"; // wytom

test.describe("Player Detailed Gaming Stats API & UI", () => {
  test("GET /api/users/:identifier/gaming-stats returns 30-game stats & last 5 matches", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/users/${TELEGRAM_ID}/gaming-stats`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(body).toHaveProperty("user");
    expect(body.user.telegramId).toBe(TELEGRAM_ID);
    expect(body.user.displayName).toBe("wytom");

    // Faceit stats
    expect(body).toHaveProperty("faceit");
    expect(body.faceit).not.toBeNull();
    expect(body.faceit).toHaveProperty("stats30");
    expect(body.faceit.stats30).toHaveProperty("winrate");
    expect(body.faceit.stats30).toHaveProperty("kd");
    expect(body.faceit.stats30).toHaveProperty("hsPercent");
    expect(typeof body.faceit.stats30.winrate).toBe("number");
    expect(typeof body.faceit.stats30.kd).toBe("number");
    expect(typeof body.faceit.stats30.hsPercent).toBe("number");

    // Last 5 games (W/L)
    expect(body.faceit).toHaveProperty("last5");
    expect(Array.isArray(body.faceit.last5)).toBe(true);
    expect(body.faceit.last5.length).toBeGreaterThan(0);
    const firstMatch = body.faceit.last5[0];
    expect(["W", "L"]).toContain(firstMatch.result);
    expect(firstMatch).toHaveProperty("map");
    expect(firstMatch).toHaveProperty("score");
    expect(firstMatch).toHaveProperty("kd");
  });

  test("Telegram Mini App UI allows expanding player card to view 30-game stats", async ({ page }) => {
    // Open Mini App with mock Telegram WebApp environment
    await page.goto("http://localhost:5173/");

    // Wait for roster to load
    await expect(page.locator("text=СОСТАВ КОМАНДЫ")).toBeVisible({ timeout: 5000 });

    // Click on wytom card
    const wytomCard = page.locator("text=wytom").first();
    await wytomCard.click();

    // Verify stats appear
    await expect(page.locator("text=Винрейт")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=K/D")).toBeVisible();
    await expect(page.locator("text=% HS")).toBeVisible();
    await expect(page.locator("text=Последние 5 игр (W/L)")).toBeVisible();

    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/player-card-expanded.png",
      fullPage: true,
    });
  });
});
