import { chromium } from "@playwright/test";

async function main() {
  console.log("Launching browser to capture expanded player card...");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 420, height: 950 },
      deviceScaleFactor: 2,
    });
    await page.goto("http://localhost:5173/");
    await page.waitForTimeout(1000);

    // Click on wytom card to expand it
    const wytomCard = page.locator("text=wytom").first();
    await wytomCard.click();
    await page.waitForTimeout(500);

    // Locate the expanded player card wrapper
    // In Dashboard.tsx, the card is the div with border containing wytom
    const cardContainer = page.locator("div.rounded-2xl.border:has-text('wytom')").first();

    const outPath =
      "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/player-card-cropped.png";
    await cardContainer.screenshot({ path: outPath });
    console.log("Card cropped screenshot saved to:", outPath);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
