/**
 * WeWatch ikonkalar generatori — public/favicon.svg (binafsha "W" logo) asosida.
 * Barcha PWA ikonkalari, favicon PNG'lari va multi-resolution favicon.ico yaratadi.
 * Ishlatish: node apps/web/generate-icons.mjs
 *
 * Diqqat: manba — public/favicon.svg. Logo o'zgarsa, avval SVG'ni yangilang.
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, 'public');
const ICONS_DIR = join(PUBLIC_DIR, 'icons');
const SVG = join(PUBLIC_DIR, 'favicon.svg');

if (!existsSync(SVG)) {
  console.error(`❌  Manba topilmadi: ${SVG}`);
  process.exit(1);
}
mkdirSync(ICONS_DIR, { recursive: true });

// Ilova to'q foni — apple-touch va PWA ikonkalari shu rang ustida tekislanadi
// (shaffof burchaklar iOS'da qora, maskable PWA'da esa buzuq ko'rinadi).
const DARK_BG = { r: 10, g: 10, b: 15 }; // #0A0A0F

// SVG'ni yuqori zichlikda rasterlash (sifat yo'qolmasligi uchun).
// solid=true → to'q fon ustida tekislangan (apple/PWA), aks holda shaffof (favicon).
const render = (size, solid = false) => {
  let img = sharp(SVG, { density: 384 }).resize(size, size, {
    fit: 'contain',
    background: solid ? DARK_BG : { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (solid) img = img.flatten({ background: DARK_BG });
  return img.png().toBuffer();
};

// ─── Multi-resolution favicon.ico (PNG-embedded, zamonaviy brauzerlar + Win Vista+) ──
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const bufs = [];
  entries.forEach((e, i) => {
    const d = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, d + 0);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, d + 1);
    dir.writeUInt16LE(1, d + 4);   // color planes
    dir.writeUInt16LE(32, d + 6);  // bits per pixel
    dir.writeUInt32LE(e.buf.length, d + 8);
    dir.writeUInt32LE(offset, d + 12);
    offset += e.buf.length;
    bufs.push(e.buf);
  });
  return Buffer.concat([header, dir, ...bufs]);
}

const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const FAVICON_PNG_SIZES = [16, 32, 48];
const ICO_SIZES = [16, 32, 48];
const APPLE_SIZE = 180;

let created = 0;

// PWA ikonkalari — to'q fon ustida (shaffofsiz)
for (const size of PWA_SIZES) {
  const buf = await render(size, true);
  writeFileSync(join(ICONS_DIR, `icon-${size}x${size}.png`), buf);
  created++;
  console.log(`  ✓  icons/icon-${size}x${size}.png`);
}

// favicon PNG'lari — shaffof (brauzer o'z foni ustida ko'rsatadi)
for (const size of FAVICON_PNG_SIZES) {
  const buf = await render(size, false);
  writeFileSync(join(PUBLIC_DIR, `favicon-${size}.png`), buf);
  created++;
  console.log(`  ✓  favicon-${size}.png`);
}

// apple-touch-icon — to'q fon ustida (iOS shaffoflikni qora qiladi)
writeFileSync(join(PUBLIC_DIR, 'apple-touch-icon.png'), await render(APPLE_SIZE, true));
created++;
console.log(`  ✓  apple-touch-icon.png (${APPLE_SIZE}x${APPLE_SIZE})`);

// favicon.ico — shaffof (brauzer favicon)
const icoEntries = [];
for (const size of ICO_SIZES) icoEntries.push({ size, buf: await render(size, false) });
writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), buildIco(icoEntries));
created++;
console.log(`  ✓  favicon.ico (${ICO_SIZES.join('/')} px)`);

console.log(`\n✅  ${created} ta fayl yaratildi (manba: public/favicon.svg)`);
