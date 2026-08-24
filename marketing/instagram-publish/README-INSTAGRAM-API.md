---
# WeWatch — Instagram avtomatik nashr (Meta Graph API)

`publish-instagram.mjs` shu yerda. Ishlashi uchun 3 narsa kerak: token, ID, va videoni
turadigan **ochiq URL** (Graph API lokal faylni qabul qilmaydi).

## 1. Facebook App yaratish
1. https://developers.facebook.com/apps → **Create App** → turi: *Business*
2. App'ga **Instagram Graph API** mahsulotini qo'sh (Add Product)
3. App Dashboard → Settings → Basic: **App ID** va **App Secret** shu yerda

## 2. Instagram akkauntni ulash
- `@wewatch.tezcode` **Instagram Business/Professional** akkaunt bo'lishi shart
  (allaqachon shunday bo'lsa yaxshi — profil sozlamalaridan tekshiring)
- U bitta **Facebook Page**'ga ulangan bo'lishi kerak (agar Page yo'q bo'lsa — yangi
  Page yaratib, Instagram sozlamalaridan "Ulash"ni bosing)
- Meta App Dashboard → Roles → **Instagram Testers** ga shu Instagram akkauntni qo'shing,
  keyin Instagram ilovasida (Settings → Apps and Websites → Tester Invites) taklifni qabul qiling
  *(bu qadam App Review'siz ishlashga imkon beradi — faqat shu bitta akkaunt uchun)*

## 3. Access Token olish (Graph API Explorer orqali eng tez yo'l)
1. https://developers.facebook.com/tools/explorer → yuqorida o'z App'ingizni tanlang
2. **User or Page** → sizning Facebook foydalanuvchingiz bilan login
3. **Permissions** ro'yxatiga qo'shing:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
4. **Generate Access Token** — qisqa muddatli User Token chiqadi
5. Uni **Page Access Token**'ga almashtiring: `GET /me/accounts?access_token=<user_token>`
   — javobda WeWatch Page'ga tegishli `access_token` maydoni bor, o'shani oling
6. Shu Page tokenini **uzoq muddatliga** almashtiring (60 kunlik, keyin yangilanadi):
   ```
   GET /oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id=<APP_ID>
     &client_secret=<APP_SECRET>
     &fb_exchange_token=<PAGE_TOKEN>
   ```

## 4. Instagram Business Account ID (IG_USER_ID)
```
GET /me/accounts?access_token=<page_token>
→ page_id ni oling
GET /<page_id>?fields=instagram_business_account&access_token=<page_token>
→ instagram_business_account.id — bu IG_USER_ID
```

## 5. Videoni ochiq URL qilish — ⚠️ eng ko'p unutiladigan qadam
Graph API `video_url` parametri **internetdan ochiq o'qiladigan** havola talab qiladi
(lokal `out/*.mp4` ishlamaydi). Variantlar:
- Render qilingan mp4'ni `wewatch.uz` serverga (masalan `/media/reels/`) yuklash
- Yoki Cloudflare R2 / S3 bucket (public-read) ishlatish

## 6. Ishga tushirish
```bash
export IG_USER_ID="..."
export IG_ACCESS_TOKEN="..."
node publish-instagram.mjs --video "https://wewatch.uz/media/2026-08-17.mp4" --caption "matn + #hashtag"
```

## Nima kerak — Saidazimdan so'raladigan qisqa ro'yxat
1. Facebook Page (WeWatch nomiga) — agar hali yo'q bo'lsa
2. `@wewatch.tezcode`'ni shu Page'ga Instagram sozlamalaridan ulash
3. Meta Developer akkaunt (App yaratish uchun — Saidazimning yoki jamoaning FB akkaunti bilan)
4. Video fayllarni joylash uchun joy: wewatch.uz serveriga yozish huquqi YOKI bitta
   bepul/arzon object-storage (Cloudflare R2 — 10GB gacha bepul) — shu ikkisidan biri

---

## 7. 30 kunlik avtomatik jadval (`schedule-publish.mjs`)

To'liq reja: `../instagram-30day-content-plan.md`. `schedule.json` shu
rejaning mashinada o'qiladigan versiyasi — har kun uchun format, vaqt, caption tayyor,
faqat `mediaUrl` (video/rasm ochiq URL'i) qo'shilishi kerak.

**Ishlatish tartibi:**
1. `schedule.json` → `startDate`ni to'ldiring (1-kun sanasi, `"YYYY-MM-DD"`)
2. Har kun uchun tayyor bo'lgan video/rasmni joylab, `mediaUrl` (yoki karusel uchun
   `mediaUrls`) maydonini to'ldiring — bo'sh qolgan kun avtomatik o'tkazib yuboriladi
3. Env: `IG_USER_ID`, `IG_ACCESS_TOKEN` (yuqoridagi qadamlar bilan olinadi)
4. Skript o'zi hech narsani rejalashtirmaydi — har chaqirilganda faqat "hozir vaqti
   kelgan va hali yuborilmagan kunmi" tekshiradi. Uni davriy ishga tushiruvchi vosita
   (Windows Task Scheduler, taxminan har 15 daqiqada bir marta) kerak bo'ladi — buni
   alohida, terminalda, admin tomonidan sozlash tavsiya etiladi (token'ni komandaga
   yozmasdan, muhit o'zgaruvchisi sifatida berib)
5. `posted-log.json` avtomatik yaratiladi — allaqachon yuborilgan kunlarni belgilaydi,
   ikki marta nashr qilinmaydi

## 8. To'liq avtomatik zanjir (Cloudinary bilan)

Endi bandi 5 (video/rasmni ochiq URL'ga yuklash) ham avtomatlashtirilgan — Cloudinary orqali.

**Bir martalik sozlash:**
1. `.env.example`'dan nusxa oling: `.env` nomida, shu papkada.
2. `.env` ichiga haqiqiy qiymatlarni kiriting: `IG_USER_ID`, `IG_ACCESS_TOKEN`,
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   (`.env` — `.gitignore`'da, hech qachon commit qilinmaydi.)
3. `schedule.json`'da `startDate`ni to'ldiring.

**Har kun uchun (video render qilingandan keyin):**
```bash
node set-day-media.mjs --day 1 --file "./out/day-01.mp4"
```
Bu faylni Cloudinary'ga yuklaydi va qaytgan ochiq URL'ni avtomatik `schedule.json`dagi
1-kunning `mediaUrl`siga yozadi. Karusel (bir necha rasm) bo'lsa `--carousel` bilan
bir necha marta chaqiring.

**Avtomatik nashrni yoqish:**
```powershell
powershell -ExecutionPolicy Bypass -File .\register-task.ps1
```
Bu Windows Task Scheduler'ga har 15 daqiqada `run-schedule.ps1`ni ishga tushiradigan
vazifa qo'shadi (u `.env`ni o'qib `schedule-publish.mjs`ni chaqiradi). ⚠️ **Shu qadamdan
keyin tizim HAQIQIY avtomatik ravishda Instagram'ga post qila boshlaydi** — faqat
`.env` to'liq to'ldirilgan va reja tayyor bo'lgandan keyin, ongli ravishda ishga
tushiring.

To'xtatish: `Unregister-ScheduledTask -TaskName 'WeWatchInstagramPublish' -Confirm:$false`
