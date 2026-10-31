import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { type Patchnote, getLatestPatchnote } from "@readyon/shared";

/**
 * Generates a promotional banner image for a patchnote combining:
 * 1. Title, version badge and key highlights
 * 2. Real screenshot of the new feature in a sleek device frame
 * 3. Discord Slate aesthetic matching the app design
 */
export async function generatePatchnoteBanner(
  patch: Patchnote = getLatestPatchnote(),
  screenshotSourcePath?: string
): Promise<{ serverBannerPath: string; webBannerPath: string; relativeUrl: string }> {
  const serverDir = path.resolve(process.cwd(), "apps/server/assets/banners");
  const webDir = path.resolve(process.cwd(), "apps/web/public/banners");

  fs.mkdirSync(serverDir, { recursive: true });
  fs.mkdirSync(webDir, { recursive: true });

  const fileName = `${patch.id}.png`;
  const serverBannerPath = path.join(serverDir, fileName);
  const webBannerPath = path.join(webDir, fileName);

  // If a screenshot is provided or exists in artifacts, read it as base64
  let screenshotBase64 = "";
  const candidatePaths = [
    screenshotSourcePath,
    "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/player-card-expanded.png",
    "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/bell-unread-badge.png",
  ].filter(Boolean) as string[];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      const buffer = fs.readFileSync(p);
      screenshotBase64 = `data:image/png;base64,${buffer.toString("base64")}`;
      break;
    }
  }

  const highlightPills = patch.changes
    .slice(0, 4)
    .map((c) => {
      const emoji = c.type === "new" ? "✨" : c.type === "improved" ? "⚡️" : "🛠";
      return `
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 8px 14px; border-radius: 12px;">
          <span style="font-size: 16px;">${emoji}</span>
          <span style="color: #F2F3F5; font-size: 14px; font-weight: 700;">${c.title}</span>
        </div>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: 1200px;
            height: 675px;
            background: #131416;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #FFFFFF;
            overflow: hidden;
            display: flex;
            position: relative;
          }
          .bg-glow-1 {
            position: absolute;
            top: -150px;
            left: -100px;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(63, 95, 150, 0.25) 0%, rgba(19, 20, 22, 0) 70%);
            pointer-events: none;
          }
          .bg-glow-2 {
            position: absolute;
            bottom: -100px;
            right: 200px;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(35, 165, 90, 0.2) 0%, rgba(19, 20, 22, 0) 70%);
            pointer-events: none;
          }
          .content-left {
            flex: 1.25;
            padding: 56px 40px 56px 60px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            z-index: 2;
          }
          .brand-row {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .logo-badge {
            background: #2B2D31;
            border: 1px solid rgba(255, 255, 255, 0.1);
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
          }
          .app-title {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: -0.5px;
          }
          .app-title span { color: #8BA4CC; }
          .version-pill {
            background: #23A55A;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .main-title {
            font-size: 38px;
            font-weight: 900;
            line-height: 1.15;
            color: #FFFFFF;
            letter-spacing: -0.8px;
            margin-top: 18px;
          }
          .summary-text {
            font-size: 16px;
            color: #949BA4;
            line-height: 1.5;
            margin-top: 14px;
            max-width: 560px;
          }
          .highlights-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 24px;
          }
          .footer-note {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #8BA4CC;
            font-weight: 600;
          }
          .content-right {
            flex: 0.95;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 60px 40px 10px;
            z-index: 2;
          }
          .phone-frame {
            width: 290px;
            height: 560px;
            background: #1E1F22;
            border: 5px solid #2B2D31;
            border-radius: 36px;
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(63, 95, 150, 0.25);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .phone-notch {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 16px;
            background: #131416;
            border-radius: 10px;
            z-index: 10;
          }
          .phone-screenshot {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top center;
          }
        </style>
      </head>
      <body>
        <div class="bg-glow-1"></div>
        <div class="bg-glow-2"></div>

        <div class="content-left">
          <div>
            <div class="brand-row">
              <div class="logo-badge">🎯</div>
              <div>
                <div class="app-title">ready<span>On</span></div>
              </div>
              <div class="version-pill">${patch.version} ${patch.badge || "UPDATE"}</div>
              <div style="font-size: 12px; color: #949BA4; font-weight: 600;">${patch.date}</div>
            </div>

            <h1 class="main-title">${patch.title}</h1>
            <p class="summary-text">${patch.summary}</p>

            <div class="highlights-grid">
              ${highlightPills}
            </div>
          </div>

          <div class="footer-note">
            <span>🔔</span>
            <span>Для подписки на будущие обновления отправьте в боте: /newson</span>
          </div>
        </div>

        <div class="content-right">
          <div class="phone-frame">
            <div class="phone-notch"></div>
            ${
              screenshotBase64
                ? `<img class="phone-screenshot" src="${screenshotBase64}" alt="App Preview" />`
                : `<div style="padding: 20px; color: #8BA4CC; text-align: center; font-size: 13px;">readyOn App</div>`
            }
          </div>
        </div>
      </body>
    </html>
  `;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 675 },
      deviceScaleFactor: 2, // Retina quality
    });
    await page.setContent(html);
    await page.waitForTimeout(100);

    // Save banner to server assets and web public
    await page.screenshot({ path: serverBannerPath });
    fs.copyFileSync(serverBannerPath, webBannerPath);

    return {
      serverBannerPath,
      webBannerPath,
      relativeUrl: `/banners/${fileName}`,
    };
  } finally {
    await browser.close();
  }
}
