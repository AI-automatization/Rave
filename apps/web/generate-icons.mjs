/**
 * CineSync PWA ikonkalari generatori (pure Node.js, bog'liqlik yo'q)
 * Ishlatish: node apps/web/generate-icons.mjs
 */
import { createWriteStream, mkdirSync } from 'fs';
import { deflateSync, crc32 } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, 'public', 'icons');
mkdirSync(ICONS_DIR, { recursive: true });

// ─── CRC32 helper ────────────────────────────────────────────────────────────
function crc(type, data) {
  const buf = Buffer.alloc(type.length + data.length);
  Buffer.from(type).copy(buf);
  data.copy(buf, type.length);
  return crc32(buf);
}

// ─── PNG chunk ────────────────────────────────────────────────────────────────
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc(type, data) >>> 0);
  return Buffer.concat([len, Buffer.from(type), data, crcVal]);
}

// ─── PNG generator ────────────────────────────────────────────────────────────
function createPNG(size, r, g, b) {
  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR: width, height, bitDepth=8, colorType=2(RGB), compression=0, filter=0, interlace=0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);   // bit depth
  ihdr.writeUInt8(2, 9);   // color type: RGB
  ihdr.writeUInt8(0, 10);  // compression
  ihdr.writeUInt8(0, 11);  // filter
  ihdr.writeUInt8(0, 12);  // interlace

  // Image data: each row starts with filter byte 0, then RGB pixels
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0; // filter none
    // Background: dark #0A0A0F, "C" letter in center with red #E50914
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 3;
      const cx = x - size / 2;
      const cy = y - size / 2;
      const radius = size * 0.42;
      const innerR = size * 0.32;
      const dist = Math.sqrt(cx * cx + cy * cy);

      if (dist <= radius) {
        // Inner circle area — red fill
        raw[px]     = r;
        raw[px + 1] = g;
        raw[px + 2] = b;

        // Draw "C" letter shape (dark)
        const letterScale = size / 512;
        const lx = cx / letterScale;
        const ly = cy / letterScale;
        const lr = Math.sqrt(lx * lx + ly * ly);
        if (lr < 150 && lr > 80 && !(lx > 60 && Math.abs(ly) < 70)) {
          raw[px]     = 10;
          raw[px + 1] = 10;
          raw[px + 2] = 15;
        }
      } else {
        // Outside circle — dark background
        raw[px]     = 10;
        raw[px + 1] = 10;
        raw[px + 2] = 15;
      }
    }
  }

  const compressed = deflateSync(raw, { level: 9 });
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

// ─── Ikonkalarni yaratish ─────────────────────────────────────────────────────
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const RED = { r: 229, g: 9, b: 20 };  // #E50914

let created = 0;
for (const size of SIZES) {
  const filename = `icon-${size}x${size}.png`;
  const filepath = join(ICONS_DIR, filename);
  const png = createPNG(size, RED.r, RED.g, RED.b);
  const ws = createWriteStream(filepath);
  ws.write(png);
  ws.end();
  created++;
  console.log(`  ✓  ${filename} (${size}x${size})`);
}

console.log(`\n✅  ${created} ta ikonka yaratildi → public/icons/`);
