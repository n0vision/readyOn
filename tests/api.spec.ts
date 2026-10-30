import { test, expect } from "@playwright/test";

const API_BASE = "http://127.0.0.1:3000";
const TELEGRAM_ID = "619219842"; // Никита

test.describe("Backend REST API", () => {
  test("GET /health returns status ok", async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });

  test("GET /api/users/:telegramId returns user profile", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/users/${TELEGRAM_ID}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.telegramId).toBe(TELEGRAM_ID);
    expect(body.username).toBe("n0vision");
  });

  test("GET /api/groups/:telegramId returns user's groups", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/groups/${TELEGRAM_ID}`);
    expect(response.status()).toBe(200);
    const groups = await response.json();
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].name).toContain("CS");
    expect(groups[0].inviteCode).toBeDefined();
  });

  test("GET /api/status/group/:groupId returns all members and statuses", async ({ request }) => {
    // Group 1
    const response = await request.get(`${API_BASE}/api/status/group/1`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.group.id).toBe(1);
    expect(body.members.length).toBe(3); // Никита, Ivan, Равиль

    const names = body.members.map((m: any) => m.displayName);
    expect(names.some((n: string) => n.includes("Никита") || n.includes("Ivan"))).toBe(true);
  });

  test("PUT /api/status updates ready status", async ({ request }) => {
    const updateRes = await request.put(`${API_BASE}/api/status`, {
      data: {
        telegramId: TELEGRAM_ID,
        status: "READY",
        availableFrom: "20:00",
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.status).toBe("READY");
    expect(updated.availableFrom).toBe("20:00");

    // Verify GET reflects the change
    const getRes = await request.get(`${API_BASE}/api/status/${TELEGRAM_ID}`);
    const getBody = await getRes.json();
    expect(getBody.dailyStatus.status).toBe("READY");
    expect(getBody.dailyStatus.availableFrom).toBe("20:00");
  });
});
