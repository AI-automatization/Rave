const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = 'C:\\Users\\USer\\AppData\\Local\\Temp\\claude\\C--Users-USer-tg-bot\\ea617ee9-44e1-4d5e-b4a4-4e291a6d3c61\\scratchpad\\shots';
fs.mkdirSync(OUT, { recursive: true });

const targets = [
  { url: 'http://localhost:3000/uz', file: 'home-desktop.png', viewport: { width: 1440, height: 900 } },
  { url: 'http://localhost:3000/uz', file: 'home-mobile.png', viewport: { width: 430, height: 932 } },
  { url: 'http://localhost:3000/uz/how-it-works', file: 'how-it-works-desktop.png', viewport: { width: 1440, height: 900 } },
];

(async () => {
  const browser = await chromium.launch();
  for (const t of targets) {
    const page = await browser.newPage({ viewport: t.viewport });
    try {
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, t.file), fullPage: false });
      console.log('OK', t.file);
    } catch (e) {
      console.log('FAIL', t.file, e.message);
    }
    await page.close();
  }
  await browser.close();
})();
