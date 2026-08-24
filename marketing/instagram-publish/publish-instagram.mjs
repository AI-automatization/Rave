// Instagram Graph API orqali Reels avtomatik nashr qilish.
//
// Nega video_url kerak: Graph API lokal fayl qabul qilmaydi — video ochiq
// (public) URL'dan olib boradi. Shuning uchun render qilingan mp4 avval
// biror joyga (masalan wewatch.uz/media/ yoki S3/Cloudflare R2) yuklanishi
// kerak, keyin shu havola bu skriptga beriladi.
//
// Ishlatilishi:
//   node publish-instagram.mjs --video "https://wewatch.uz/media/2026-08-17.mp4" --caption "matn..."
//
// Kerakli env o'zgaruvchilari (.env yoki muhitda):
//   IG_USER_ID           — Instagram Business Account ID (ig-user-id)
//   IG_ACCESS_TOKEN       — uzoq muddatli Page Access Token
//     (ruxsatlar: instagram_basic, instagram_content_publish,
//      pages_show_list, pages_read_engagement)
//
// Token/ID qanday olinadi — README-INSTAGRAM-API.md ga qarang.

import { setTimeout as sleep } from "node:timers/promises";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      out[key] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

async function graphPost(path, params) {
  const url = `${GRAPH_BASE}${path}`;
  const body = new URLSearchParams(params);
  const res = await fetch(url, { method: "POST", body });
  const json = await res.json();
  if (json.error) {
    throw new Error(`Graph API xato (${path}): ${json.error.message} (code ${json.error.code})`);
  }
  return json;
}

async function graphGet(path, params) {
  const url = `${GRAPH_BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) {
    throw new Error(`Graph API xato (${path}): ${json.error.message} (code ${json.error.code})`);
  }
  return json;
}

async function waitUntilReady(creationId, token, { timeoutMs = 5 * 60 * 1000, intervalMs = 5000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await graphGet(`/${creationId}`, {
      fields: "status_code",
      access_token: token,
    });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") {
      throw new Error(`Media konteyner render xatosi bilan tugadi (creation_id=${creationId})`);
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timeout: ${timeoutMs}ms ichida media tayyor bo'lmadi (creation_id=${creationId})`);
}

async function publishReel({ igUserId, accessToken, videoUrl, caption }) {
  const created = await graphPost(`/${igUserId}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption: caption ?? "",
    access_token: accessToken,
  });

  console.log(`Konteyner yaratildi: ${created.id} — render kutilmoqda...`);
  await waitUntilReady(created.id, accessToken);

  const published = await graphPost(`/${igUserId}/media_publish`, {
    creation_id: created.id,
    access_token: accessToken,
  });

  console.log(`✅ Nashr qilindi. Media ID: ${published.id}`);
  return published;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const igUserId = process.env.IG_USER_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;

  if (!igUserId || !accessToken) {
    console.error("XATO: IG_USER_ID va IG_ACCESS_TOKEN muhit o'zgaruvchilari kerak.");
    process.exit(1);
  }
  if (!args.video) {
    console.error("XATO: --video <public-url> ko'rsatilishi shart.");
    process.exit(1);
  }

  await publishReel({
    igUserId,
    accessToken,
    videoUrl: args.video,
    caption: args.caption ?? "",
  });
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
