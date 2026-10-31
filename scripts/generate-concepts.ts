import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const screenshotPath =
  "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24/player-card-expanded.png";
const screenshotBase64 = `data:image/png;base64,${fs.readFileSync(screenshotPath).toString("base64")}`;

const outDir =
  "C:/Users/navla/.gemini/antigravity/brain/69960ee4-3a58-4838-bdb3-608906391c24";

// Shared base styles
const baseStyle = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 675px;
    background: #0E0F11;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #FFFFFF;
    overflow: hidden;
    display: flex;
    position: relative;
  }
  .bg-glow-blue {
    position: absolute;
    top: -160px;
    left: -120px;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(63, 95, 150, 0.4) 0%, rgba(14, 15, 17, 0) 70%);
    pointer-events: none;
  }
  .bg-glow-green {
    position: absolute;
    bottom: -150px;
    right: 200px;
    width: 650px;
    height: 650px;
    background: radial-gradient(circle, rgba(35, 165, 90, 0.3) 0%, rgba(14, 15, 17, 0) 70%);
    pointer-events: none;
  }
  .phone-frame {
    width: 310px;
    height: 590px;
    background: #1E1F22;
    border: 7px solid #2B2D31;
    border-radius: 44px;
    box-shadow: 0 35px 80px -15px rgba(0, 0, 0, 0.95), 0 0 60px rgba(63, 95, 150, 0.35);
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }
  .phone-notch {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 90px;
    height: 18px;
    background: #0E0F11;
    border-radius: 10px;
    z-index: 10;
  }
  .phone-screenshot {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
`;

// CONCEPT 1: 9 words total
// 1:readyOn 2:v1.3 3:CS2 4:АНАЛИТИКА 5:И 6:ETA 7:КАРТОЧКА 8:ИГРОКА 9:FACEIT
const concept1Html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${baseStyle}
    .left-col {
      flex: 1.25;
      padding: 60px 40px 60px 70px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 2;
    }
    .brand-tag {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: rgba(43, 45, 49, 0.85);
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 20px;
      font-weight: 900;
      width: fit-content;
      backdrop-filter: blur(10px);
    }
    .brand-tag span.ver {
      background: #23A55A;
      color: #FFF;
      font-size: 13px;
      padding: 3px 10px;
      border-radius: 12px;
      letter-spacing: 0.5px;
    }
    .hero-title {
      font-size: 64px;
      font-weight: 950;
      line-height: 1.05;
      letter-spacing: -1.8px;
      text-transform: uppercase;
      margin-top: 20px;
    }
    .hero-title .accent {
      color: #8BA4CC;
      display: block;
    }
    .cards-row {
      display: flex;
      gap: 16px;
      margin-top: 36px;
    }
    .big-card {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(30, 31, 34, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 20px 22px;
      backdrop-filter: blur(12px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .big-card .icon {
      font-size: 38px;
      line-height: 1;
    }
    .big-card .text {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .right-col {
      flex: 0.95;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px 60px 30px 10px;
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="bg-glow-blue"></div>
  <div class="bg-glow-green"></div>

  <div class="left-col">
    <div>
      <div class="brand-tag">
        <span>🎯 readyOn</span>
        <span class="ver">v1.3</span>
      </div>

      <h1 class="hero-title">
        CS2 АНАЛИТИКА
        <span class="accent">И ETA</span>
      </h1>

      <div class="cards-row">
        <div class="big-card">
          <div class="icon">📊</div>
          <div class="text">КАРТОЧКА ИГРОКА</div>
        </div>
        <div class="big-card" style="border-color: rgba(240, 120, 30, 0.35);">
          <div class="icon">🟠</div>
          <div class="text" style="color: #FF9E54;">FACEIT</div>
        </div>
      </div>
    </div>
  </div>

  <div class="right-col">
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <img class="phone-screenshot" src="${screenshotBase64}" />
    </div>
  </div>
</body>
</html>
`;

// CONCEPT 2: 6 words total
// 1:readyOn 2:v1.3 3:СТАТИСТИКА 4:CS2 5:LIVE 6:ETA
const concept2Html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${baseStyle}
    .left-col {
      flex: 1.25;
      padding: 70px 30px 70px 70px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      z-index: 2;
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 26px;
      font-weight: 950;
      color: #8BA4CC;
      letter-spacing: -0.5px;
      margin-bottom: 24px;
    }
    .badge-pill .pill {
      background: #23A55A;
      color: #FFF;
      font-size: 14px;
      padding: 4px 12px;
      border-radius: 14px;
      font-weight: 800;
    }
    .giant-title {
      font-size: 78px;
      font-weight: 950;
      line-height: 0.98;
      letter-spacing: -2.5px;
      text-transform: uppercase;
      color: #FFFFFF;
    }
    .giant-sub {
      font-size: 64px;
      font-weight: 950;
      line-height: 1.05;
      letter-spacing: -2px;
      text-transform: uppercase;
      color: #3F5F96;
      margin-top: 14px;
      text-shadow: 0 0 30px rgba(63, 95, 150, 0.4);
    }
    .right-col {
      flex: 0.95;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px 60px 30px 10px;
      z-index: 2;
    }
    .phone-frame-styled {
      width: 320px;
      height: 600px;
      background: #1E1F22;
      border: 7px solid #2B2D31;
      border-radius: 46px;
      box-shadow: 0 40px 90px -10px rgba(0, 0, 0, 0.95), 0 0 60px rgba(63, 95, 150, 0.4);
      overflow: hidden;
      position: relative;
    }
  </style>
</head>
<body>
  <div class="bg-glow-blue" style="width: 800px; height: 800px; top: -200px;"></div>
  <div class="bg-glow-green"></div>

  <div class="left-col">
    <div class="badge-pill">
      <span>🎯 readyOn</span>
      <span class="pill">v1.3</span>
    </div>

    <h1 class="giant-title">СТАТИСТИКА CS2</h1>
    <div class="giant-sub">LIVE ETA</div>
  </div>

  <div class="right-col">
    <div class="phone-frame-styled">
      <div class="phone-notch"></div>
      <img class="phone-screenshot" src="${screenshotBase64}" />
    </div>
  </div>
</body>
</html>
`;

// CONCEPT 3: 8 words total
// 1:readyOn 2:v1.3 3:ОБНОВЛЕНИЕ 4:АНАЛИТИКА 5:CS2 6:И 7:LIVE 8:ETA
const concept3Html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${baseStyle}
    .left-col {
      flex: 1.3;
      padding: 65px 30px 65px 70px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 2;
    }
    .brand-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-title {
      font-size: 30px;
      font-weight: 950;
      letter-spacing: -0.5px;
    }
    .brand-ver {
      background: #23A55A;
      color: #FFF;
      font-size: 14px;
      font-weight: 850;
      padding: 5px 14px;
      border-radius: 14px;
    }
    .update-chip {
      background: rgba(63, 95, 150, 0.25);
      border: 1.5px solid rgba(139, 164, 204, 0.4);
      color: #8BA4CC;
      font-size: 15px;
      font-weight: 900;
      padding: 6px 16px;
      border-radius: 20px;
      width: fit-content;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 26px;
    }
    .main-text {
      font-size: 70px;
      font-weight: 950;
      line-height: 1.02;
      letter-spacing: -2px;
      text-transform: uppercase;
      margin-top: 14px;
    }
    .bottom-pills {
      display: flex;
      gap: 14px;
      margin-top: 32px;
    }
    .feature-pill {
      background: rgba(43, 45, 49, 0.85);
      border: 2px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 18px 26px;
      font-size: 24px;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    }
    .right-col {
      flex: 0.9;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px 60px 30px 10px;
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="bg-glow-blue"></div>
  <div class="bg-glow-green"></div>

  <div class="left-col">
    <div>
      <div class="brand-top">
        <span class="brand-title">🎯 readyOn</span>
        <span class="brand-ver">v1.3</span>
      </div>

      <div class="update-chip">ОБНОВЛЕНИЕ</div>

      <h1 class="main-text">АНАЛИТИКА CS2</h1>

      <div class="bottom-pills">
        <div class="feature-pill">
          <span>🚗</span>
          <span>И LIVE ETA</span>
        </div>
      </div>
    </div>
  </div>

  <div class="right-col">
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <img class="phone-screenshot" src="${screenshotBase64}" />
    </div>
  </div>
</body>
</html>
`;

// CONCEPT 4: 7 words total (Centered phone, bold poster look)
// 1:readyOn 2:1.3 3:CS2 4:РЕЙТИНГ 5:И 6:LIVE 7:ETA
const concept4Html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${baseStyle}
    body {
      justify-content: space-between;
      align-items: center;
      padding: 0 70px;
    }
    .side-left {
      width: 440px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      z-index: 2;
    }
    .side-right {
      width: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    .logo-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-title {
      font-size: 32px;
      font-weight: 950;
      letter-spacing: -0.5px;
    }
    .logo-ver {
      background: #23A55A;
      color: #FFF;
      font-size: 15px;
      font-weight: 900;
      padding: 4px 12px;
      border-radius: 12px;
    }
    .huge-headline {
      font-size: 68px;
      font-weight: 950;
      line-height: 1.02;
      letter-spacing: -2px;
      text-transform: uppercase;
      color: #FFFFFF;
    }
    .glow-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, rgba(63, 95, 150, 0.4) 0%, rgba(35, 165, 90, 0.3) 100%);
      border: 2px solid rgba(139, 164, 204, 0.35);
      border-radius: 20px;
      padding: 16px 24px;
      font-size: 26px;
      font-weight: 900;
      width: fit-content;
      text-transform: uppercase;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div class="bg-glow-blue" style="left: 100px; width: 600px; height: 600px;"></div>
  <div class="bg-glow-green" style="right: 50px;"></div>

  <div class="side-left">
    <div class="logo-row">
      <span class="logo-title">🎯 readyOn</span>
      <span class="logo-ver">1.3</span>
    </div>

    <h1 class="huge-headline">CS2 РЕЙТИНГ</h1>

    <div class="glow-badge">
      <span>🚗</span>
      <span>И LIVE ETA</span>
    </div>
  </div>

  <div class="side-right">
    <div class="phone-frame" style="transform: rotate(-1.5deg);">
      <div class="phone-notch"></div>
      <img class="phone-screenshot" src="${screenshotBase64}" />
    </div>
  </div>
</body>
</html>
`;

// CONCEPT 5: 8 words total (3 sleek badge tags)
// 1:readyOn 2:v1.3 3:CS2 4:СТАТИСТИКА 5:КАРТОЧКА 6:FACEIT 7:LIVE 8:ETA
const concept5Html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${baseStyle}
    .left-col {
      flex: 1.25;
      padding: 60px 40px 60px 70px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 2;
    }
    .brand-tag {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      font-size: 28px;
      font-weight: 950;
      letter-spacing: -0.5px;
    }
    .brand-tag span.ver {
      background: #23A55A;
      color: #FFF;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 900;
    }
    .hero-title {
      font-size: 72px;
      font-weight: 950;
      line-height: 1.0;
      letter-spacing: -2.5px;
      text-transform: uppercase;
      margin-top: 14px;
      color: #FFFFFF;
    }
    .tags-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 30px;
    }
    .tag-row {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      background: rgba(30, 31, 34, 0.85);
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 14px 22px;
      width: fit-content;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.3px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .right-col {
      flex: 0.95;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px 60px 30px 10px;
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="bg-glow-blue"></div>
  <div class="bg-glow-green"></div>

  <div class="left-col">
    <div>
      <div class="brand-tag">
        <span>🎯 readyOn</span>
        <span class="ver">v1.3</span>
      </div>

      <h1 class="hero-title">CS2 СТАТИСТИКА</h1>

      <div class="tags-list">
        <div class="tag-row">
          <span style="font-size: 28px;">📊</span>
          <span>КАРТОЧКА</span>
        </div>
        <div class="tag-row" style="border-color: rgba(240, 120, 30, 0.4); color: #FF9E54;">
          <span style="font-size: 28px;">🟠</span>
          <span>FACEIT</span>
        </div>
        <div class="tag-row">
          <span style="font-size: 28px;">🚗</span>
          <span style="color: #8BA4CC;">LIVE ETA</span>
        </div>
      </div>
    </div>
  </div>

  <div class="right-col">
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <img class="phone-screenshot" src="${screenshotBase64}" />
    </div>
  </div>
</body>
</html>
`;

// CONCEPT 6: 7 words total (Cinematic Glow Banner)
// 1:readyOn 2:v1.3 3:ОБНОВЛЕНИЕ 4:CS2 5:АНАЛИТИКА 6:И 7:ETA
const concept6Html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${baseStyle}
    .left-col {
      flex: 1.25;
      padding: 70px 40px 70px 70px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      z-index: 2;
    }
    .top-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
    }
    .top-badge .brand {
      font-size: 26px;
      font-weight: 950;
      color: #FFF;
    }
    .top-badge .upd {
      background: rgba(35, 165, 90, 0.2);
      border: 1.5px solid #23A55A;
      color: #23A55A;
      font-size: 13px;
      font-weight: 900;
      padding: 4px 12px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }
    .hero-big {
      font-size: 76px;
      font-weight: 950;
      line-height: 0.98;
      letter-spacing: -2.8px;
      text-transform: uppercase;
      color: #FFFFFF;
    }
    .hero-accent {
      font-size: 60px;
      font-weight: 950;
      line-height: 1.05;
      letter-spacing: -2px;
      text-transform: uppercase;
      background: linear-gradient(135deg, #8BA4CC 0%, #3F5F96 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-top: 16px;
    }
    .right-col {
      flex: 0.95;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px 60px 30px 10px;
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="bg-glow-blue" style="width: 800px; height: 800px; top: -150px;"></div>
  <div class="bg-glow-green" style="width: 600px; height: 600px;"></div>

  <div class="left-col">
    <div class="top-badge">
      <span class="brand">🎯 readyOn v1.3</span>
      <span class="upd">ОБНОВЛЕНИЕ</span>
    </div>

    <h1 class="hero-big">CS2 АНАЛИТИКА</h1>
    <div class="hero-accent">И ETA</div>
  </div>

  <div class="right-col">
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <img class="phone-screenshot" src="${screenshotBase64}" />
    </div>
  </div>
</body>
</html>
`;

async function run() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 675 },
      deviceScaleFactor: 2,
    });

    const concepts = [
      { id: "banner-concept-1.png", html: concept1Html, title: "Концепт 1: Esports Focus (9 слов)" },
      { id: "banner-concept-2.png", html: concept2Html, title: "Концепт 2: Ultra Minimal Giant (6 слов)" },
      { id: "banner-concept-3.png", html: concept3Html, title: "Концепт 3: Badge Showcase (8 слов)" },
      { id: "banner-concept-4.png", html: concept4Html, title: "Концепт 4: Dynamic Angle Poster (7 слов)" },
      { id: "banner-concept-5.png", html: concept5Html, title: "Концепт 5: Clean Badges (8 слов)" },
      { id: "banner-concept-6.png", html: concept6Html, title: "Концепт 6: Cinematic Glow (7 слов)" },
    ];

    for (const c of concepts) {
      console.log(`Generating ${c.id}...`);
      await page.setContent(c.html);
      await page.waitForTimeout(100);
      const outPath = path.join(outDir, c.id);
      await page.screenshot({ path: outPath });
      console.log(`Saved: ${outPath}`);
    }
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
