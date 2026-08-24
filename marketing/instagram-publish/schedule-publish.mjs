// 30 kunlik rejani (schedule.json) o'qib, navbatdagi kunni Instagram'ga avtomatik
// nashr qiladi. publish-instagram.mjs bitta faylni qo'lda yuborish uchun edi — bu
// skript butun kalendarni boshqaradi: qaysi kun, qaysi vaqt, allaqachon yuborilganmi.
//
// Ishlatilishi (Windows Task Scheduler orqali har 15 daqiqada ishga tushiriladi,
// pastga qarang "O'RNATISH"):
//   node schedule-publish.mjs
//
// Kerakli env o'zgaruvchilari:
//   IG_USER_ID, IG_ACCESS_TOKEN     — Saidazimdan (README-INSTAGRAM-API.md)
//   SCHEDULE_START_DATE              — ixtiyoriy, "YYYY-MM-DD" (1-kun shu sana bo'ladi).
//                                      Berilmasa schedule.json ichidagi "startDate" ishlatiladi.
//
// schedule.json'dagi har bir kun uchun "mediaUrl" (yoki karusel uchun "mediaUrls")
// TO'LDIRILGAN bo'lishi shart — Graph API faqat ochiq (public) URL qabul qiladi,
// lokal fayl emas. Video/rasm ishlab chiqarish va joylashtirish alohida jarayon.
// mediaUrl bo'sh kun — jimgina o'tkazib yuboriladi (xato emas), log'da ko'rinadi.

import { readFile, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEDULE_FILE = path.join(__dirname, "schedule.json");
const LOG_FILE = path.join(__dirname, "posted-log.json");
const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const WINDOW_MINUTES = 15; // shu skript necha daqiqada bir marta ishga tushirilsa, shuncha

async function graphPost(path_, params) {
  const res = await fetch(`${GRAPH_BASE}${path_}`, { method: "POST", body: new URLSearchParams(params) });
  const json = await res.json();
  if (json.error) throw new Error(`Graph API xato (${path_}): ${json.error.message} (code ${json.error.code})`);
  return json;
}

async function graphGet(path_, params) {
  const res = await fetch(`${GRAPH_BASE}${path_}?${new URLSearchParams(params)}`);
  const json = await res.json();
  if (json.error) throw new Error(`Graph API xato (${path_}): ${json.error.message} (code ${json.error.code})`);
  return json;
}

async function waitUntilReady(creationId, token, { timeoutMs = 5 * 60 * 1000, intervalMs = 5000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await graphGet(`/${creationId}`, { fields: "status_code", access_token: token });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") throw new Error(`Media render xatosi (creation_id=${creationId})`);
    await sleep(intervalMs);
  }
  throw new Error(`Timeout: media ${timeoutMs}ms ichida tayyor bo'lmadi (creation_id=${creationId})`);
}

async function publishReel({ igUserId, accessToken, videoUrl, caption }) {
  const created = await graphPost(`/${igUserId}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption: caption ?? "",
    access_token: accessToken,
  });
  await waitUntilReady(created.id, accessToken);
  return graphPost(`/${igUserId}/media_publish`, { creation_id: created.id, access_token: accessToken });
}

async function publishImage({ igUserId, accessToken, imageUrl, caption }) {
  const created = await graphPost(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption: caption ?? "",
    access_token: accessToken,
  });
  return graphPost(`/${igUserId}/media_publish`, { creation_id: created.id, access_token: accessToken });
}

async function publishCarousel({ igUserId, accessToken, imageUrls, caption }) {
  const childIds = [];
  for (const url of imageUrls) {
    const child = await graphPost(`/${igUserId}/media`, {
      image_url: url,
      is_carousel_item: "true",
      access_token: accessToken,
    });
    childIds.push(child.id);
  }
  const created = await graphPost(`/${igUserId}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption: caption ?? "",
    access_token: accessToken,
  });
  await waitUntilReady(created.id, accessToken);
  return graphPost(`/${igUserId}/media_publish`, { creation_id: created.id, access_token: accessToken });
}

async function loadJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

function dayIndexFor(startDate, now) {
  const start = new Date(`${startDate}T00:00:00`);
  const diffDays = Math.floor((now - start) / 86_400_000);
  return diffDays + 1; // 1-kun = startDate
}

function withinWindow(entryTime, now) {
  const [h, m] = entryTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diffMin = Math.abs(now - target) / 60_000;
  return diffMin <= WINDOW_MINUTES;
}

async function main() {
  const igUserId = process.env.IG_USER_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    console.error("XATO: IG_USER_ID va IG_ACCESS_TOKEN muhit o'zgaruvchilari kerak.");
    process.exit(1);
  }

  const schedule = await loadJson(SCHEDULE_FILE, null);
  if (!schedule) {
    console.error(`XATO: ${SCHEDULE_FILE} topilmadi.`);
    process.exit(1);
  }

  const startDate = process.env.SCHEDULE_START_DATE || schedule.startDate;
  if (!startDate) {
    console.error("XATO: SCHEDULE_START_DATE yoki schedule.json'da startDate kerak.");
    process.exit(1);
  }

  const postedLog = await loadJson(LOG_FILE, { posted: [] });
  const now = new Date();
  const day = dayIndexFor(startDate, now);
  // Odatda bitta kunga bitta yozuv, lekin 30-kun kabi ikki chiqarilishli kunlar bo'lishi mumkin —
  // shuning uchun barcha mos yozuvlar bo'ylab yuriladi, key = "kun-vaqt".
  const entries = schedule.days.filter((d) => d.day === day);

  if (entries.length === 0) {
    console.log(`[${now.toISOString()}] ${day}-kun uchun reja yo'q (30 kunlik reja tugagan yoki hali boshlanmagan).`);
    return;
  }

  for (const entry of entries) {
    const key = `${entry.day}-${entry.time}`;

    if (postedLog.posted.includes(key)) {
      console.log(`[${now.toISOString()}] ${key} allaqachon nashr qilingan, o'tkazib yuborilyapti.`);
      continue;
    }
    if (!withinWindow(entry.time, now)) {
      console.log(`[${now.toISOString()}] ${key} rejalashtirilgan vaqt emas (${entry.time} kutilmoqda).`);
      continue;
    }
    if (entry.format === "reels" && !entry.mediaUrl) {
      console.warn(`[${now.toISOString()}] ${key} Reels uchun mediaUrl hali qo'yilmagan — o'tkazib yuborilyapti.`);
      continue;
    }
    if (entry.format === "post" && !entry.mediaUrl && !entry.mediaUrls) {
      console.warn(`[${now.toISOString()}] ${key} Post uchun mediaUrl/mediaUrls hali qo'yilmagan — o'tkazib yuborilyapti.`);
      continue;
    }

    console.log(`[${now.toISOString()}] ${key} (${entry.pillar}, ${entry.format}) nashr qilinyapti...`);

    try {
      let result;
      if (entry.format === "reels") {
        result = await publishReel({ igUserId, accessToken, videoUrl: entry.mediaUrl, caption: entry.caption });
      } else if (entry.mediaUrls?.length > 1) {
        result = await publishCarousel({ igUserId, accessToken, imageUrls: entry.mediaUrls, caption: entry.caption });
      } else {
        result = await publishImage({
          igUserId,
          accessToken,
          imageUrl: entry.mediaUrl ?? entry.mediaUrls[0],
          caption: entry.caption,
        });
      }
      console.log(`✅ ${key} nashr qilindi. Media ID: ${result.id}`);
      postedLog.posted.push(key);
      await writeFile(LOG_FILE, JSON.stringify(postedLog, null, 2), "utf8");
    } catch (err) {
      console.error(`❌ ${key} nashri muvaffaqiyatsiz: ${err.message}`);
    }
  }
}

main();
