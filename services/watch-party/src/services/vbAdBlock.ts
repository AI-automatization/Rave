// Virtual brauzer reklama bloklash (2026-10-05, Abdulaziz: "reklamalarni sozlamalarga qo'shib
// qo'y, o'chirib-yoqish mumkin bo'lsin").
//
// Nega: reklamali kino saytlarida (rezka/uzmovi/ok.ru) popup-video va banner reklamalar serverdagi
// Chromium'ni og'irlashtiradi, kadrlar oqimini kattalashtiradi va media-sniffer'ga yolg'on
// nomzod beradi (virtualBrowser.service.ts izohlari: "ads ... can pass the same heuristics real
// content does"). Bloklash CDP `Network.setBlockedURLs` orqali — Playwright route() emas, chunki
// route() Chromium keshini o'chirib qo'yadi, CDP ro'yxati esa kesh va sniffer'larga tegmaydi.
//
// Sozlama foydalanuvchi bo'yicha Redis'da: kalit yo'q = YOQIQ (default), '0' = o'chirilgan.
// Faqat sessiya BOSHLANGANDA o'qiladi — ishlab turgan sessiyaga ta'sir qilmaydi.
import type Redis from 'ioredis';
import os from 'node:os';
import path from 'node:path';
import { promises as fsp } from 'node:fs';
import { PlaywrightBlocker } from '@ghostery/adblocker-playwright';
import { logger } from '@shared/utils/logger';

// Faqat reklama tarmoqlari/popunder xizmatlari. Tahlil (analytics) ataylab kiritilmagan —
// "reklamani bloklash" deb va'da qilinadi, hamma narsani emas; sayt funksiyasini buzish xavfi past.
const AD_HOSTS = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google.com',
  'adnxs.com', 'taboola.com', 'outbrain.com', 'mgid.com', 'criteo.com', 'criteo.net',
  'rubiconproject.com', 'pubmatic.com', 'openx.net', 'casalemedia.com', 'bidswitch.net',
  'adsterra.com', 'popads.net', 'propellerads.com', 'onclickads.net', 'exoclick.com',
  'exosrv.com', 'juicyads.com', 'trafficjunky.net', 'hilltopads.net', 'adcash.com',
  'clickadu.com', 'richpush.co', 'push-sdk.com', 'yandexadexchange.net', 'an.yandex.ru',
  'awaps.yandex.net', 'adfox.ru', 'adriver.ru', 'betweendigital.com', 'ad.mail.ru',
  'adskeeper.com', 'adspyglass.com', 'a-ads.com', 'adfinity.pro', 'mradx.net', 'rs.mail.ru',
  'monetag.com', 'ad-maven.com', 'realsrv.com', 'tsyndicate.com', 'trafficstars.com', 'adtng.com',
];

// `*://*host/*` — "*" har qanday satrni qamraydi (subdomenlar ham).
export const AD_BLOCKED_URL_PATTERNS: string[] = AD_HOSTS
  .map((h) => `*://*${h}/*`);

const adBlockKey = (userId: string) => `vb:adblock:${userId}`;

export async function getAdBlockPref(redis: Redis, userId: string): Promise<boolean> {
  try {
    return (await redis.get(adBlockKey(userId))) !== '0';
  } catch {
    return true; // Redis ishlamasa — default (yoqiq)
  }
}

export async function setAdBlockPref(redis: Redis, userId: string, enabled: boolean): Promise<void> {
  if (enabled) await redis.del(adBlockKey(userId)); // default holatga qaytish
  else await redis.set(adBlockKey(userId), '0');
}

// ── Kuchli bloklash: tayyor filtr ro'yxatlari (EasyList + uBlock reklama ro'yxatlari) ──────────
// @ghostery/adblocker ro'yxatlarni CDN'dan bir marta yuklaydi va diskka keshlaydi. Lokal o'lchov
// (2026-10-05, uzmovi.com): 235 so'rov / 13.1 MB → 79 so'rov / 1.3 MB. Yuklab bo'lmasa — yuqoridagi
// qisqa host-ro'yxati (CDP) zaxira bo'lib qoladi, sessiya baribir ochiladi.
const ENGINE_CACHE_PATH = process.env.VB_ADBLOCK_CACHE_PATH ?? path.join(os.tmpdir(), 'vb-adblock-engine.bin');
const ENGINE_LOAD_TIMEOUT_MS = 8_000;

let blockerPromise: Promise<PlaywrightBlocker | null> | null = null;

function loadBlocker(): Promise<PlaywrightBlocker | null> {
  if (!blockerPromise) {
    blockerPromise = PlaywrightBlocker.fromPrebuiltAdsOnly(fetch, {
      path: ENGINE_CACHE_PATH,
      read: fsp.readFile,
      write: fsp.writeFile,
    }).then((b) => {
      logger.info('VB ad-block engine ready', { cache: ENGINE_CACHE_PATH });
      return b as PlaywrightBlocker | null;
    }).catch((e: Error) => {
      logger.warn('VB ad-block engine failed to load — falling back to static host list', { error: e.message });
      blockerPromise = null; // keyingi sessiyada qayta urinish
      return null;
    });
  }
  return blockerPromise;
}

/** Ishga tushganda chaqiriladi — birinchi VB sessiyasi ro'yxat yuklashini kutmasin. */
export function prewarmAdBlocker(): void {
  void loadBlocker();
}

/** Tayyor dvigatel yoki null (yuklanmagan / vaqt tugadi — chaqiruvchi host-ro'yxatiga o'tadi). */
export async function getAdBlocker(): Promise<PlaywrightBlocker | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ENGINE_LOAD_TIMEOUT_MS));
  return Promise.race([loadBlocker(), timeout]);
}
