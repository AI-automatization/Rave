// Lokal video/rasm faylni Cloudinary'ga yuklab, ochiq (public) URL qaytaradi.
// Graph API video_url/image_url parametri shu URL'ni kutadi.
//
// Ishlatilishi:
//   node cloudinary-upload.mjs --file "./out/day-01.mp4" --type video
//   node cloudinary-upload.mjs --file "./out/day-02.png" --type image
//
// Kerakli env o'zgaruvchilari (.env yoki muhitda — hech qachon shu faylga yozilmasin):
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      out[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

function sign(params, apiSecret) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export async function uploadToCloudinary({ filePath, resourceType = "video", cloudName, apiKey, apiSecret }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { timestamp };
  const signature = sign(paramsToSign, apiSecret);

  const fileBuffer = await readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([fileBuffer]), path.basename(filePath));
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const res = await fetch(url, { method: "POST", body: form });
  const json = await res.json();
  if (json.error) {
    throw new Error(`Cloudinary xato: ${json.error.message}`);
  }
  return json.secure_url;
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
  if (!args.file) {
    console.error("XATO: --file <lokal-yol> ko'rsatilishi shart.");
    process.exit(1);
  }

  const resourceType = args.type === "image" ? "image" : "video";
  const secureUrl = await uploadToCloudinary({
    filePath: args.file,
    resourceType,
    cloudName,
    apiKey,
    apiSecret,
  });
  console.log(secureUrl);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
  });
}
