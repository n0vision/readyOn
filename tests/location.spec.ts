import { test, expect } from "@playwright/test";

const API_BASE = "http://127.0.0.1:3000";
const TELEGRAM_ID = "619219842"; // wytom

test.describe("Geolocation & Home Status API", () => {
  const homeLat = 56.8389;
  const homeLon = 60.6057;

  test("Set home coordinates for user", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/users/${TELEGRAM_ID}/home`, {
      data: {
        latitude: homeLat,
        longitude: homeLon,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.hasHomeLocation).toBe(true);

    // Verify user profile reflects hasHomeLocation: true
    const userRes = await request.get(`${API_BASE}/api/users/${TELEGRAM_ID}`);
    const user = await userRes.json();
    expect(user.hasHomeLocation).toBe(true);
  });

  test("Current location within 100m of home results in status 'home'", async ({ request }) => {
    // 50 meters away
    const nearLat = homeLat + 0.0003;
    const nearLon = homeLon + 0.0003;

    const res = await request.post(`${API_BASE}/api/users/${TELEGRAM_ID}/location`, {
      data: {
        latitude: nearLat,
        longitude: nearLon,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.locationStatus).toBe("home");
    expect(body.etaMinutes).toBeNull();

    // Verify in status endpoint
    const statusRes = await request.get(`${API_BASE}/api/status/${TELEGRAM_ID}`);
    const statusBody = await statusRes.json();
    expect(statusBody.onlineStatus.locationStatus).toBe("home");
  });

  test("Current location far away in motion results in status 'transit' with ETA", async ({ request }) => {
    // ~10 km away (approx 0.09 deg latitude)
    const farLat = homeLat + 0.09;
    const farLon = homeLon;

    const res = await request.post(`${API_BASE}/api/users/${TELEGRAM_ID}/location`, {
      data: {
        latitude: farLat,
        longitude: farLon,
        speed: 8.5, // ~30 km/h in m/s
        heading: 180,
        isLive: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.locationStatus).toBe("transit");
    expect(body.etaMinutes).toBeGreaterThan(0);

    // Verify in status endpoint
    const statusRes = await request.get(`${API_BASE}/api/status/${TELEGRAM_ID}`);
    const statusBody = await statusRes.json();
    expect(statusBody.onlineStatus.locationStatus).toBe("transit");
    expect(statusBody.onlineStatus.etaMinutes).toBe(body.etaMinutes);
  });

  test("Current location far away stationary results in status 'away'", async ({ request }) => {
    const farLat = homeLat + 0.09;
    const farLon = homeLon;

    const res = await request.post(`${API_BASE}/api/users/${TELEGRAM_ID}/location`, {
      data: {
        latitude: farLat,
        longitude: farLon,
        speed: 0,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.locationStatus).toBe("away");
  });

  test("Clear home coordinates resets home location", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/users/${TELEGRAM_ID}/home`, {
      data: { clear: true },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.hasHomeLocation).toBe(false);

    const userRes = await request.get(`${API_BASE}/api/users/${TELEGRAM_ID}`);
    const user = await userRes.json();
    expect(user.hasHomeLocation).toBe(false);
  });
});
