import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');
mkdirSync(iconsDir, { recursive: true });

// WeWatch W logo SVG — transparent background, purple gradient W
const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 935 611" fill="none">
  <rect x="581.327" y="79.9094" width="558.054" height="157.697" rx="78.8487"
    transform="rotate(117.182 581.327 79.9094)" fill="#6735F4"/>
  <rect x="513.195" y="11.0813" width="544.84" height="159.065" rx="78.8487"
    transform="rotate(65.0336 513.195 11.0813)" fill="#6735F4"/>
  <rect x="928.205" y="79.9094" width="558.054" height="157.697" rx="78.8487"
    transform="rotate(117.182 928.205 79.9094)" fill="#6231EF"/>
  <rect x="167.195" y="14.8703" width="544.84" height="159.065" rx="78.8487"
    transform="rotate(65.0336 167.195 14.8703)" fill="#6231EF"/>
</svg>`;

const svgBuf = Buffer.from(svgSource);

// SVG is 935x611 — we render square by adding padding
// Pad so the W is centered in a square with some margin
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function makePng(size, outPath, { padding = 0.12 } = {}) {
  const available = Math.round(size * (1 - padding * 2));
  // W aspect ratio is 935:611 — fit within available square
  const aspectW = 935, aspectH = 611;
  let wInner, hInner;
  if (available * aspectH / aspectW <= available) {
    wInner = available;
    hInner = Math.round(available * aspectH / aspectW);
  } else {
    hInner = available;
    wInner = Math.round(available * aspectW / aspectH);
  }
  // Clamp to size
  wInner = Math.min(wInner, size);
  hInner = Math.min(hInner, size);
  const offsetX = Math.round((size - wInner) / 2);
  const offsetY = Math.round((size - hInner) / 2);

  const resized = await sharp(svgBuf)
    .resize(wInner, hInner)
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, top: offsetY, left: offsetX }])
    .png()
    .toFile(outPath);

  console.log(`✓ ${outPath}`);
}

// Generate all PNG icons (transparent bg)
for (const s of sizes) {
  await makePng(s, join(iconsDir, `icon-${s}x${s}.png`));
}

// Generate favicon.ico — 32x32 (standard favicon size)
const ico32 = await sharp(svgBuf)
  .resize(26, 17)   // keep W proportions inside 32x32
  .png()
  .toBuffer();

const faviconPng = await sharp({
  create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: ico32, top: 8, left: 3 }])
  .png()
  .toBuffer();

// Write as PNG named favicon-32.png (Next.js will use SVG as primary)
writeFileSync(join(publicDir, 'favicon-32.png'), faviconPng);
console.log('✓ favicon-32.png');

// apple-touch-icon — 180x180 with subtle purple bg for Apple devices
const appleInner = Math.round(180 * 0.65);
const appleW = Math.round(appleInner * 935 / 611);
const appleResized = await sharp(svgBuf)
  .resize(appleW, appleInner)
  .png()
  .toBuffer();

await sharp({
  create: { width: 180, height: 180, channels: 4, background: { r: 13, g: 10, b: 25, alpha: 255 } },
})
  .composite([{ input: appleResized, top: Math.round((180 - appleInner) / 2), left: Math.round((180 - appleW) / 2) }])
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'));
console.log('✓ apple-touch-icon.png');

console.log('\nAll icons generated!');
