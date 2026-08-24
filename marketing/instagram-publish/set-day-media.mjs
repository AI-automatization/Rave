// Render qilingan lokal video/rasmni Cloudinary'ga yuklaydi va natijaviy ochiq URL'ni
// schedule.json'dagi shu kunning mediaUrl (yoki karusel bo'lsa mediaUrls) maydoniga yozadi.
// Bu — "render qilindi" bilan "avtomatik nashrga tayyor" orasidagi qadam.
//
// Ishlatilishi:
//   node set-day-media.mjs --day 1 --file "./out/day-01.mp4"
//   node set-day-media.mjs --day 4 --file "./out/day-04-slide1.png" --carousel
//   node set-day-media.mjs --day 4 --file "./out/day-04-slide2.png" --carousel
//
// Kerakli env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { uploadToCloudinary } from "./cloudinary-upload.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEDULE_FILE = path.join(__dirname, "schedule.json");

function parseArgs(argv) {
  const out = { carousel: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--carousel") {
      out.carousel = true;
      continue;
    }
    if (argv[i].startsWith("--")) {
      out[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("XATO: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET muhit o'zgaruvchilari kerak.");
    process.exit(1);
  }
  const day = Number(args.day);
  if (!day || !args.file) {
    console.error("XATO: --day <raqam> va --file <lokal-yol> ko'rsatilishi shart.");
    process.exit(1);
  }

  const ext = path.extname(args.file).toLowerCase();
  const resourceType = [".mp4", ".mov", ".webm"].includes(ext) ? "video" : "image";

  console.log(`Yuklanmoqda: ${args.file} → Cloudinary (${resourceType})...`);
  const secureUrl = await uploadToCloudinary({ filePath: args.file, resourceType, cloudName, apiKey, apiSecret });
  console.log(`✅ Yuklandi: ${secureUrl}`);

  const schedule = JSON.parse(await readFile(SCHEDULE_FILE, "utf8"));
  const entries = schedule.days.filter((d) => d.day === day);
  if (entries.length === 0) {
    console.error(`XATO: schedule.json'da ${day}-kun topilmadi.`);
    process.exit(1);
  }

  for (const entry of entries) {
    if (args.carousel) {
      entry.mediaUrls = entry.mediaUrls ?? [];
      entry.mediaUrls.push(secureUrl);
    } else if ("mediaUrls" in entry) {
      entry.mediaUrls = [secureUrl];
    } else {
      entry.mediaUrl = secureUrl;
    }
  }

  await writeFile(SCHEDULE_FILE, JSON.stringify(schedule, null, 2), "utf8");
  console.log(`✅ schedule.json yangilandi: ${day}-kun.`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
