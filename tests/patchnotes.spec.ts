import { test, expect } from "@playwright/test";

const API_BASE = "http://127.0.0.1:3000";

test.describe("Patchnotes and News Hub", () => {
  test("GET /api/patchnotes returns list of releases and latest patchnote", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/patchnotes`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty("patchnotes");
    expect(Array.isArray(data.patchnotes)).toBe(true);
    expect(data.patchnotes.length).toBeGreaterThan(0);

    expect(data).toHaveProperty("latest");
    expect(data.latest.version).toBe("v1.3.0");
    expect(data.latest.title).toContain("Большое обновление");
  });

  test("POST /api/patchnotes/broadcast executes broadcast in dryRun mode without spamming users", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/patchnotes/broadcast`, {
      data: { first: true, dryRun: true },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.dryRun).toBe(true);
    expect(data.broadcast).toHaveProperty("total");
  });

  test("Mini App displays Bell with unread badge and opens Patchnotes Modal without popups on launch", async ({
    page,
  }) => {
    // Navigate with cleared read patchnotes
    await page.goto("http://localhost:5173/");
    await page.evaluate(() => {
      localStorage.removeItem("readyon_read_patchnotes");
      localStorage.setItem("readyon_onboarding_completed", "true");
    });
    await page.reload();

    // Verify NO modal pop-ups blocking dashboard
    await expect(page.locator("text=СОСТАВ КОМАНДЫ")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Что нового в readyOn")).not.toBeVisible();
    await expect(page.locator("text=ШАГ 1 ИЗ 5")).not.toBeVisible();

    // Verify Bell icon is present in header
    const bellBtn = page.locator("button[title='Новости и обновления']");
    await expect(bellBtn).toBeVisible();

    // Verify unread badge is visible on the bell
    const badge = bellBtn.locator("span.bg-\\[\\#F23F43\\]");
    await expect(badge).toBeVisible();
    const unreadCount = await badge.innerText();
    expect(Number(unreadCount)).toBeGreaterThan(0);

    // Screenshot Dashboard showing the Bell with unread badge
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/bell-unread-badge.png",
      fullPage: true,
    });

    // Click on Bell to open Patchnotes Modal
    await bellBtn.click();

    // Assert Patchnotes Modal opened
    await expect(page.locator("text=Что нового в readyOn")).toBeVisible();
    await expect(page.locator("text=Патчноуты и история обновлений")).toBeVisible();
    await expect(page.locator("text=v1.3.0")).toBeVisible();
    await expect(page.locator("text=Детализированная карточка игрока")).toBeVisible();

    // Screenshot Patchnotes Modal
    await page.screenshot({
      path: "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/patchnotes-modal.png",
      fullPage: true,
    });

    // Close modal
    await page.locator("button:has-text('Всё понятно, закрыть')").click();
    await expect(page.locator("text=Что нового в readyOn")).not.toBeVisible();

    // Verify unread badge is now GONE
    await expect(badge).not.toBeVisible();

    // Verify localStorage has marked all as read
    const stored = await page.evaluate(() => localStorage.getItem("readyon_read_patchnotes"));
    expect(stored).toContain("v1.3.0");
  });

  test("Profile tab has news subscription toggle and opens patchnotes modal", async ({
    page,
  }) => {
    await page.goto("http://localhost:5173/profile");

    // Check news notification toggle
    await expect(page.locator("text=Рассылка обновлений и патчноутов")).toBeVisible({
      timeout: 5000,
    });

    // Check "Что нового в readyOn" card in Profile
    const patchnotesCard = page.locator("text=Что нового в readyOn").first();
    await expect(patchnotesCard).toBeVisible();
    await patchnotesCard.click();

    // Assert modal opened
    await expect(page.locator("text=Патчноуты и история обновлений")).toBeVisible();

    // Close
    await page.locator("button:has(svg.lucide-x)").first().click();
    await expect(page.locator("text=Патчноуты и история обновлений")).not.toBeVisible();
  });
});
