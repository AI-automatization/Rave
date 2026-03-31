/**
 * CineSync — Icon & Splash Generator
 * Design: dark bg + violet circle + white play button
 * Run: node scripts/generate-icons.mjs
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { Jimp, rgbaToInt, intToRGBA } = require('jimp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'assets');

// ─── Colors ───────────────────────────────────────────────────────────────────
const BG        = 0x0A0A0FFF;  // #0A0A0F — dark base
const VIOLET    = 0x7C3AEDFF;  // #7C3AED — primary
const VIOLET_DK = 0x5B21B6FF;  // #5B21B6 — darker violet
const WHITE     = 0xFFFFFFFF;
const TRANSP    = 0x00000000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function hexToRgba(hex) {
  return {
    r: (hex >> 24) & 0xff,
    g: (hex >> 16) & 0xff,
    b: (hex >>  8) & 0xff,
    a: (hex       ) & 0xff,
  };
}

/** Fill a circle with flat color */
function fillCircle(img, cx, cy, r, color) {
  const rgba = hexToRgba(color);
  const rSq = r * r;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= rSq) {
        img.setPixelColor(rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a), x, y);
      }
    }
  }
}

/** Fill circle with radial gradient (center → edge: colorA → colorB) */
function fillCircleGradient(img, cx, cy, r, colorA, colorB) {
  const a = hexToRgba(colorA);
  const b = hexToRgba(colorB);
  const rSq = r * r;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx, dy = y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq <= rSq) {
        const t = Math.sqrt(distSq) / r;
        const rr = lerp(a.r, b.r, t);
        const gg = lerp(a.g, b.g, t);
        const bb = lerp(a.b, b.b, t);
        img.setPixelColor(rgbaToInt(rr, gg, bb, 255), x, y);
      }
    }
  }
}

/** Fill a rounded rectangle */
function fillRoundRect(img, x0, y0, w, h, radius, color) {
  const rgba = hexToRgba(color);
  const x1 = x0 + w, y1 = y0 + h;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      // Check corner rounding
      let inside = true;
      if (x < x0 + radius && y < y0 + radius) {
        const dx = x - (x0 + radius), dy = y - (y0 + radius);
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (x >= x1 - radius && y < y0 + radius) {
        const dx = x - (x1 - radius), dy = y - (y0 + radius);
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (x < x0 + radius && y >= y1 - radius) {
        const dx = x - (x0 + radius), dy = y - (y1 - radius);
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (x >= x1 - radius && y >= y1 - radius) {
        const dx = x - (x1 - radius), dy = y - (y1 - radius);
        inside = dx * dx + dy * dy <= radius * radius;
      }
      if (inside) {
        img.setPixelColor(rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a), x, y);
      }
    }
  }
}

/** Fill play triangle (pointing right) centered at cx, cy with given half-size */
function fillPlayTriangle(img, cx, cy, size, color) {
  const rgba = hexToRgba(color);
  // Triangle vertices: left-top, left-bottom, right-middle
  const x0 = cx - Math.round(size * 0.45);
  const x1 = cx + Math.round(size * 0.55);
  const yTop = cy - Math.round(size * 0.58);
  const yBot = cy + Math.round(size * 0.58);

  for (let y = yTop; y <= yBot; y++) {
    const t = (y - yTop) / (yBot - yTop); // 0..1
    // Left edge is always x0
    // Right edge goes from x0→x1 (top half) and x1→x0 (bottom half)
    let xRight;
    if (t <= 0.5) {
      xRight = Math.round(x0 + (x1 - x0) * (t * 2));
    } else {
      xRight = Math.round(x1 - (x1 - x0) * ((t - 0.5) * 2));
    }
    for (let x = x0; x <= xRight; x++) {
      img.setPixelColor(rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a), x, y);
    }
  }
}

/** Soft shadow ring (glow effect) */
function drawGlow(img, cx, cy, r, glowR, color) {
  const rgba = hexToRgba(color);
  for (let y = cy - r - glowR; y <= cy + r + glowR; y++) {
    for (let x = cx - r - glowR; x <= cx + r + glowR; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r && dist <= r + glowR) {
        const alpha = Math.round(rgba.a * (1 - (dist - r) / glowR) * 0.4);
        if (alpha > 0) {
          const existing = intToRGBA(img.getPixelColor(x, y));
          const blended = rgbaToInt(
            lerp(existing.r, rgba.r, alpha / 255),
            lerp(existing.g, rgba.g, alpha / 255),
            lerp(existing.b, rgba.b, alpha / 255),
            Math.min(255, existing.a + alpha),
          );
          img.setPixelColor(blended, x, y);
        }
      }
    }
  }
}

// ─── App Icon (1024×1024) ──────────────────────────────────────────────────────
async function generateAppIcon() {
  const SIZE = 1024;
  const img = new Jimp({ width: SIZE, height: SIZE, color: BG });

  const cx = SIZE / 2, cy = SIZE / 2;

  // Outer glow ring
  drawGlow(img, cx, cy, 360, 60, 0x7C3AED80);

  // Violet circle background (gradient: violet center → dark violet edge)
  fillCircleGradient(img, cx, cy, 360, VIOLET, VIOLET_DK);

  // Inner darker ring hint
  fillCircle(img, cx, cy, 240, 0x6D28D9FF);

  // White play button
  fillPlayTriangle(img, cx + 20, cy, 300, WHITE);

  // Small inner glow on play button area
  drawGlow(img, cx + 20, cy, 140, 40, 0xFFFFFF40);

  await img.write(path.join(ASSETS, 'icon.png'));
  console.log('✓ icon.png (1024×1024)');
}

// ─── Android Foreground (1024×1024, transparent bg) ──────────────────────────
async function generateAndroidForeground() {
  const SIZE = 1024;
  const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSP });

  const cx = SIZE / 2, cy = SIZE / 2;

  // Violet circle (smaller — Android adds padding)
  fillCircleGradient(img, cx, cy, 310, VIOLET, VIOLET_DK);

  // Play button
  fillPlayTriangle(img, cx + 18, cy, 260, WHITE);

  await img.write(path.join(ASSETS, 'android-icon-foreground.png'));
  console.log('✓ android-icon-foreground.png');
}

// ─── Android Background (1024×1024) ──────────────────────────────────────────
async function generateAndroidBackground() {
  const SIZE = 1024;
  const img = new Jimp({ width: SIZE, height: SIZE, color: BG });
  await img.write(path.join(ASSETS, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png');
}

// ─── Android Monochrome (1024×1024, white on transparent) ────────────────────
async function generateAndroidMonochrome() {
  const SIZE = 1024;
  const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSP });
  const cx = SIZE / 2, cy = SIZE / 2;
  fillPlayTriangle(img, cx + 18, cy, 340, WHITE);
  await img.write(path.join(ASSETS, 'android-icon-monochrome.png'));
  console.log('✓ android-icon-monochrome.png');
}

// ─── Splash Icon (1024×1024, transparent bg, centered logo) ──────────────────
async function generateSplashIcon() {
  const SIZE = 1024;
  const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSP });
  const cx = SIZE / 2, cy = SIZE / 2;

  // Glow
  drawGlow(img, cx, cy, 240, 80, 0x7C3AED60);

  // Circle
  fillCircleGradient(img, cx, cy, 240, VIOLET, VIOLET_DK);

  // Play button
  fillPlayTriangle(img, cx + 14, cy, 200, WHITE);

  await img.write(path.join(ASSETS, 'splash-icon.png'));
  console.log('✓ splash-icon.png (1024×1024)');
}

// ─── Notification Icon (96×96, white on transparent) ────────────────────────
async function generateNotificationIcon() {
  const SIZE = 96;
  const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSP });
  const cx = SIZE / 2, cy = SIZE / 2;
  fillPlayTriangle(img, cx + 2, cy, 52, WHITE);
  await img.write(path.join(ASSETS, 'notification-icon.png'));
  console.log('✓ notification-icon.png (96×96)');
}

// ─── Favicon (48×48) ─────────────────────────────────────────────────────────
async function generateFavicon() {
  const SIZE = 48;
  const img = new Jimp({ width: SIZE, height: SIZE, color: BG });
  const cx = SIZE / 2, cy = SIZE / 2;
  fillCircle(img, cx, cy, 20, VIOLET);
  fillPlayTriangle(img, cx + 2, cy, 18, WHITE);
  await img.write(path.join(ASSETS, 'favicon.png'));
  console.log('✓ favicon.png (48×48)');
}

// ─── Run ──────────────────────────────────────────────────────────────────────
console.log('Generating CineSync icons...\n');
Promise.all([
  generateAppIcon(),
  generateAndroidForeground(),
  generateAndroidBackground(),
  generateAndroidMonochrome(),
  generateSplashIcon(),
  generateNotificationIcon(),
  generateFavicon(),
]).then(() => {
  console.log('\nDone! All icons generated.');
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
