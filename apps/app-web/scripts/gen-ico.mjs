// Generate a proper .ico file containing 16x16 and 32x32 PNG images
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, '..', 'src', 'app');
const publicDir = join(__dirname, '..', 'public');

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

async function makeSquarePng(size, padding = 0.15) {
  const available = Math.round(size * (1 - padding * 2));
  const wInner = available;  // fit width
  const hInner = Math.round(available * 611 / 935);
  const offsetX = Math.round((size - wInner) / 2);
  const offsetY = Math.round((size - hInner) / 2);

  const resized = await sharp(svgBuf).resize(wInner, hInner).png().toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, top: offsetY, left: offsetX }])
    .png()
    .toBuffer();
}

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + count * dirEntrySize;

  // ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // reserved
  header.writeUInt16LE(1, 2);     // type: ICO
  header.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  let offset = dirSize;

  for (let i = 0; i < pngBuffers.length; i++) {
    const buf = pngBuffers[i];
    // Read dimensions from PNG header (bytes 16-23)
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    const entry = Buffer.alloc(16);
    entry.writeUInt8(w >= 256 ? 0 : w, 0);   // width (0 = 256)
    entry.writeUInt8(h >= 256 ? 0 : h, 1);   // height
    entry.writeUInt8(0, 2);   // color count
    entry.writeUInt8(0, 3);   // reserved
    entry.writeUInt16LE(1, 4);  // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(buf.length, 8);   // size
    entry.writeUInt32LE(offset, 12);      // offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

const [png16, png32] = await Promise.all([
  makeSquarePng(16),
  makeSquarePng(32),
]);

const ico = buildIco([png16, png32]);
writeFileSync(join(appDir, 'favicon.ico'), ico);
console.log(`✓ favicon.ico (${ico.length} bytes)`);

// Also write 48x48 for Windows taskbar
const png48 = await makeSquarePng(48);
writeFileSync(join(publicDir, 'favicon-48.png'), png48);
console.log('✓ favicon-48.png');
