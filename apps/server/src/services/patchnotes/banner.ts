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
    "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/player-card-cropped.png",
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

  // Approved Layout: Variant 6-A (Flat Card Elevation)
  // Max 6 words: "readyOn v1.3 ОБНОВЛЕНИЕ • CS2 АНАЛИТИКА И ETA"
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
            background: #0E0F11;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #FFFFFF;
            overflow: hidden;
            display: flex;
            align-items: center;
            position: relative;
          }
          .bg-glow-blue {
            position: absolute;
            top: -150px;
            left: -120px;
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, rgba(63, 95, 150, 0.45) 0%, rgba(14, 15, 17, 0) 70%);
            pointer-events: none;
          }
          .bg-glow-green {
            position: absolute;
            bottom: -150px;
            right: 150px;
            width: 650px;
            height: 650px;
            background: radial-gradient(circle, rgba(35, 165, 90, 0.3) 0%, rgba(14, 15, 17, 0) 70%);
            pointer-events: none;
          }
          .left-col {
            flex: 1.05;
            padding-left: 70px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            z-index: 2;
          }
          .top-badge {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
          }
          .top-badge .brand {
            font-size: 28px;
            font-weight: 950;
            color: #FFF;
            letter-spacing: -0.5px;
          }
          .top-badge .brand span {
            color: #8BA4CC;
          }
          .top-badge .upd {
            background: rgba(35, 165, 90, 0.2);
            border: 1.5px solid #23A55A;
            color: #23A55A;
            font-size: 13px;
            font-weight: 900;
            padding: 5px 14px;
            border-radius: 20px;
            letter-spacing: 0.5px;
          }
          .hero-big {
            font-size: 78px;
            font-weight: 950;
            line-height: 0.98;
            letter-spacing: -2.8px;
            text-transform: uppercase;
            color: #FFFFFF;
          }
          .hero-accent {
            font-size: 62px;
            font-weight: 950;
            line-height: 1.05;
            letter-spacing: -2px;
            text-transform: uppercase;
            background: linear-gradient(135deg, #8BA4CC 0%, #3F5F96 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-top: 14px;
          }
          .right-col {
            flex: 1.25;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 30px 60px 30px 20px;
            z-index: 2;
          }
          .card-frame-flat {
            width: 530px;
            background: #1E1F22;
            border: 3px solid rgba(255, 255, 255, 0.12);
            border-radius: 28px;
            box-shadow: 0 35px 80px rgba(0, 0, 0, 0.95), 0 0 50px rgba(63, 95, 150, 0.35);
            overflow: hidden;
            display: block;
          }
          .card-img {
            width: 100%;
            height: auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="bg-glow-blue"></div>
        <div class="bg-glow-green"></div>

        <div class="left-col">
          <div class="top-badge">
            <span class="brand">🎯 ready<span>On</span> ${patch.version}</span>
            <span class="upd">ОБНОВЛЕНИЕ</span>
          </div>

          <h1 class="hero-big">CS2 АНАЛИТИКА</h1>
          <div class="hero-accent">И ETA</div>
        </div>

        <div class="right-col">
          <div class="card-frame-flat">
            ${
              screenshotBase64
                ? `<img class="card-img" src="${screenshotBase64}" alt="Feature Preview" />`
                : `<div style="padding: 40px; color: #8BA4CC; text-align: center; font-size: 16px;">readyOn App</div>`
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
