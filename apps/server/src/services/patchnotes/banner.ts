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
  let rootDir = process.cwd();
  if (rootDir.endsWith("apps\\server") || rootDir.endsWith("apps/server")) {
    rootDir = path.resolve(rootDir, "../..");
  }
  const serverDir = path.resolve(rootDir, "apps/server/assets/banners");
  const webDir = path.resolve(rootDir, "apps/web/public/banners");

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

  const highlightCards = patch.changes
    .slice(0, 4)
    .map((c) => {
      const emoji =
        c.shortTitle?.includes("FACEIT") || c.title.includes("FACEIT")
          ? "🟠"
          : c.shortTitle?.includes("ETA") || c.title.includes("ETA")
          ? "🚗"
          : c.shortTitle?.includes("Онбординг") || c.title.includes("Onboarding")
          ? "🔔"
          : "📊";

      const title = c.shortTitle || c.title;
      const subtitle = c.highlight || c.title;

      return `
        <div class="highlight-card">
          <div class="card-icon">${emoji}</div>
          <div class="card-texts">
            <div class="card-title">${title}</div>
            <div class="card-sub">${subtitle}</div>
          </div>
        </div>
      `;
    })
    .join("");

  const displayTitle =
    patch.id === "v1.3.0"
      ? `CS2 СТАТИСТИКА,<br /><span class="highlight-text">РЕЙТИНГ & LIVE ETA</span>`
      : `${patch.title}`;

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
            background: #111214;
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
            width: 650px;
            height: 650px;
            background: radial-gradient(circle, rgba(63, 95, 150, 0.32) 0%, rgba(17, 18, 20, 0) 70%);
            pointer-events: none;
          }
          .bg-glow-2 {
            position: absolute;
            bottom: -120px;
            right: 250px;
            width: 550px;
            height: 550px;
            background: radial-gradient(circle, rgba(35, 165, 90, 0.25) 0%, rgba(17, 18, 20, 0) 70%);
            pointer-events: none;
          }
          .content-left {
            flex: 1.25;
            padding: 50px 30px 50px 60px;
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
            border: 1px solid rgba(255, 255, 255, 0.12);
            width: 48px;
            height: 48px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          }
          .app-title {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.5px;
          }
          .app-title span { color: #8BA4CC; }
          .version-pill {
            background: #23A55A;
            color: #FFFFFF;
            font-size: 13px;
            font-weight: 800;
            padding: 5px 12px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 10px rgba(35, 165, 90, 0.4);
          }
          .release-date {
            font-size: 14px;
            color: #949BA4;
            font-weight: 600;
          }
          .main-title {
            font-size: 50px;
            font-weight: 900;
            line-height: 1.08;
            color: #FFFFFF;
            letter-spacing: -1.2px;
            margin-top: 18px;
            text-transform: uppercase;
          }
          .main-title .highlight-text {
            color: #8BA4CC;
            display: inline-block;
          }
          .summary-text {
            font-size: 17px;
            color: #949BA4;
            font-weight: 500;
            line-height: 1.4;
            margin-top: 10px;
            max-width: 580px;
          }
          .highlights-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 24px;
          }
          .highlight-card {
            display: flex;
            align-items: center;
            gap: 14px;
            background: rgba(43, 45, 49, 0.75);
            border: 1.5px solid rgba(255, 255, 255, 0.1);
            padding: 14px 18px;
            border-radius: 16px;
            backdrop-filter: blur(10px);
          }
          .card-icon {
            font-size: 30px;
            line-height: 1;
            flex-shrink: 0;
          }
          .card-texts {
            display: flex;
            flex-direction: column;
            gap: 3px;
            overflow: hidden;
          }
          .card-title {
            color: #FFFFFF;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .card-sub {
            color: #8BA4CC;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .footer-note {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 15px;
            color: #DBDEE1;
            font-weight: 600;
          }
          .bot-badge {
            background: #2B2D31;
            border: 1px solid #3F5F96;
            color: #8BA4CC;
            font-weight: 800;
            font-size: 13px;
            padding: 4px 10px;
            border-radius: 8px;
          }
          .content-right {
            flex: 0.95;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 30px 50px 30px 10px;
            z-index: 2;
          }
          .phone-frame {
            width: 300px;
            height: 575px;
            background: #1E1F22;
            border: 6px solid #2B2D31;
            border-radius: 40px;
            box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.9), 0 0 50px rgba(63, 95, 150, 0.3);
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
            width: 85px;
            height: 18px;
            background: #111214;
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
              <div class="release-date">${patch.date}</div>
            </div>

            <h1 class="main-title">${displayTitle}</h1>
            <p class="summary-text">${patch.summary}</p>

            <div class="highlights-grid">
              ${highlightCards}
            </div>
          </div>

          <div class="footer-note">
            <div class="bot-badge">💬 /newson</div>
            <span>Подробности обновления описаны в посте</span>
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
