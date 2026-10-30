import { test, expect } from "@playwright/test";

test.describe("Calendar Integration API", () => {
  const telegramId = "619219842"; // wytom

  test("GET /api/calendar/:telegramId returns empty sources and calculated status", async ({ request }) => {
    const res = await request.get(`http://localhost:3000/api/calendar/${telegramId}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("sources");
    expect(body).toHaveProperty("todayEvents");
    expect(body).toHaveProperty("calculatedStatus");
  });

  test("POST /api/calendar/:telegramId/upload parses .ics and calculates status", async ({ request }) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");

    // ICS content with an event from 14:00 to 18:00 today
    const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//readyOn Test//EN
BEGIN:VEVENT
UID:readyon-test-1@example.com
DTSTAMP:${y}${m}${d}T100000Z
DTSTART:${y}${m}${d}T140000Z
DTEND:${y}${m}${d}T180000Z
SUMMARY:Работа в офисе
END:VEVENT
END:VCALENDAR`;

    const uploadRes = await request.post(`http://localhost:3000/api/calendar/${telegramId}/upload`, {
      data: {
        name: "Test Work Calendar",
        icsContent: sampleIcs,
      },
    });
    expect(uploadRes.ok()).toBeTruthy();
    const data = await uploadRes.json();
    expect(data).toHaveProperty("sourceId");
    expect(data.eventsSynced).toBeGreaterThanOrEqual(1);

    // Clean up created calendar source
    const deleteRes = await request.delete(`http://localhost:3000/api/calendar/${telegramId}/${data.sourceId}`);
    expect(deleteRes.ok()).toBeTruthy();
  });
});
