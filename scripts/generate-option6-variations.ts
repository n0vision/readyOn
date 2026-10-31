import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const croppedCardPath =
  "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/player-card-cropped.png";
const croppedBase64 = `data:image/png;base64,${fs.readFileSync(croppedCardPath).toString("base64")}`;

const outDir =
  "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24";

const baseHtmlHead = `
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
  </style>
`;

// 6A: Flat Clean Elevation (Card scaled up, high impact)
const html6A = `
<!DOCTYPE html>
<html>
<head>
  ${baseHtmlHead}
  <style>
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
      <span class="brand">🎯 ready<span>On</span> v1.3</span>
      <span class="upd">ОБНОВЛЕНИЕ</span>
    </div>

    <h1 class="hero-big">CS2 АНАЛИТИКА</h1>
    <div class="hero-accent">И ETA</div>
  </div>

  <div class="right-col">
    <div class="card-frame-flat">
      <img class="card-img" src="${croppedBase64}" />
    </div>
  </div>
</body>
</html>
`;

// 6B: 3D Perspective Tilt (Modern product showcase)
const html6B = `
<!DOCTYPE html>
<html>
<head>
  ${baseHtmlHead}
  <style>
    .perspective-wrapper {
      perspective: 1200px;
    }
    .card-frame-3d {
      width: 520px;
      background: #1E1F22;
      border: 3px solid rgba(139, 164, 204, 0.25);
      border-radius: 28px;
      box-shadow: 0 40px 90px rgba(0, 0, 0, 0.95), 0 0 60px rgba(63, 95, 150, 0.4);
      overflow: hidden;
      display: block;
      transform: rotateY(-8deg) rotateX(3deg) rotateZ(-0.5deg);
      transition: transform 0.3s ease;
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
      <span class="brand">🎯 ready<span>On</span> v1.3</span>
      <span class="upd">ОБНОВЛЕНИЕ</span>
    </div>

    <h1 class="hero-big">CS2 АНАЛИТИКА</h1>
    <div class="hero-accent">И ETA</div>
  </div>

  <div class="right-col">
    <div class="perspective-wrapper">
      <div class="card-frame-3d">
        <img class="card-img" src="${croppedBase64}" />
      </div>
    </div>
  </div>
</body>
</html>
`;

// 6C: Phone Close-Up (Smartphone viewport focused right on the card)
const html6C = `
<!DOCTYPE html>
<html>
<head>
  ${baseHtmlHead}
  <style>
    .phone-zoom-frame {
      width: 360px;
      height: 580px;
      background: #1E1F22;
      border: 7px solid #2B2D31;
      border-radius: 46px;
      box-shadow: 0 40px 90px rgba(0, 0, 0, 0.95), 0 0 60px rgba(63, 95, 150, 0.4);
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .notch {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 18px;
      background: #0E0F11;
      border-radius: 10px;
      z-index: 10;
    }
    .card-in-phone {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 28%;
      transform: scale(1.08);
    }
  </style>
</head>
<body>
  <div class="bg-glow-blue"></div>
  <div class="bg-glow-green"></div>

  <div class="left-col">
    <div class="top-badge">
      <span class="brand">🎯 ready<span>On</span> v1.3</span>
      <span class="upd">ОБНОВЛЕНИЕ</span>
    </div>

    <h1 class="hero-big">CS2 АНАЛИТИКА</h1>
    <div class="hero-accent">И ETA</div>
  </div>

  <div class="right-col">
    <div class="phone-zoom-frame">
      <div class="notch"></div>
      <img class="card-in-phone" src="${croppedBase64}" />
    </div>
  </div>
</body>
</html>
`;

async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 675 },
      deviceScaleFactor: 2,
    });

    const variations = [
      { id: "banner-option6-flat.png", html: html6A },
      { id: "banner-option6-3d.png", html: html6B },
      { id: "banner-option6-phone-zoom.png", html: html6C },
    ];

    for (const v of variations) {
      console.log(`Rendering ${v.id}...`);
      await page.setContent(v.html);
      await page.waitForTimeout(100);
      const outPath = path.join(outDir, v.id);
      await page.screenshot({ path: outPath });
      console.log(`Saved: ${outPath}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
