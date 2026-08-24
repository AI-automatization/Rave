# WeWatch — Instagram 30 kunlik kontent-reja

> Akkaunt: `@wewatch.tezcode` · Manba vazifa: `docs/Tasks.md` → T-S200
> Tayyorlangan: 2026-08-24 · Muallif: Claude (Telegram sessiyasi, Jasur so'rovi bo'yicha)
> Nashr avtomatikasi: `wewatch-reels/publish-instagram.mjs` (token kutilmoqda — pastga qarang)

---

## 0. Qisqacha

WeWatch — do'stlar bilan istalgan joydan sinxron kino/video tomosha qilish ilovasi
(YouTube, VK, Rutube, Twitch, Vimeo, TikTok va h.k. — 10+ manba), jonli chat va
reaksiyalar, bepul, 4K, web + Android + iOS. Auditoriya: 18–30 yosh, uzoqdagi
do'stlar/juftliklar, kechqurun/hafta oxiri "birga tomosha qilish" ehtiyoji.

**Asosiy xabar:** "Masofa muammo emas — WeWatch bilan hammaviz bir joyda, bir vaqtda."

---

## 1. Kontent ustunlari (pillar'lar)

| # | Pillar | Format | Nima uchun |
|---|---|---|---|
| P1 | **"3 savol + WeWatch javobi"** | Reels | Saidazimning aniq ko'rsatmasi (T-S200) — haftalik majburiy format |
| P2 | Feature-highlight (sinxron tomosha, YouTube/VK/Rutube, chat, 4K, bepul) | Reels | Mahsulot qobiliyatini tez ko'rsatish |
| P3 | Hissiy hikoya ("5 do'st · 5 shahar · 1 film" uslubi, mavjud skript asosida) | Reels | Eng yuqori ulashish salohiyati |
| P4 | UGC/ijtimoiy dalil (skrinshot, sharh, "odamlar nima deydi") | Post/Karusel | Ishonch quradi |
| P5 | Qo'llanma/onboarding ("3 qadamda xona oching") | Post/Karusel | Yangi foydalanuvchini o'ргatadi, saqlanish (save) oshiradi |
| P6 | Trend/format-jacking (kunlik trend audio/format, WeWatch og'rig'iga bog'lab) | Reels | Algoritm bo'yicha reach |
| P7 | Sahna orqasi / Tezcode jamoasi | Post | Brendni insonlashtiradi (kam-kam, oyiga 2 marta) |
| P8 | To'g'ridan-to'g'ri CTA/promo ("bugun sinab ko'r") | Reels | Konversiyaga yo'naltirilgan yakun |

---

## 2. Vaqt strategiyasi

Auditoriya Toshkent vaqti (UTC+5), "kechqurun birga tomosha" mavzusi bilan mos:

- **Reels — 20:00** (kechki dam olish, asosiy faollik cho'qqisi)
- **Post/Karusel — 12:30** (tushlik pauzasi, ikkinchi faollik cho'qqisi)
- **Juma/Shanba kechqurun (20:00–21:00)** — haftaning eng kuchli oynasi (hafta oxiri kino kechasi kayfiyati) → shu kunlarga P3/P6 (eng katta reach potensiali) qo'yiladi

Haftalik shablon (7/7 kun, dam kuni yo'q — avtomatlashtirilgan skript buni ko'taradi):

| Kun | Format | Vaqt | Pillar |
|---|---|---|---|
| Dushanba | Reels | 20:00 | P2 — Feature |
| Seshanba | Post | 12:30 | P5 — Qo'llanma |
| Chorshanba | Reels | 20:00 | **P1 — 3 savol + javob** |
| Payshanba | Post | 12:30 | P4 — UGC/dalil |
| Juma | Reels | 20:00 | P3 — Hissiy hikoya |
| Shanba | Reels | 20:00 | P6 — Trend |
| Yakshanba | Post | 12:30 | P7 / P8 (almashinuvchan) |

---

## 3. 30 kunlik jadval

> 1-kun = token/ruxsat tayyor bo'lgan birinchi dushanba deb olinadi. Sana emas,
> hafta kuni asosiy — avtomatik skript ishga tushirilganda haqiqiy sanaga moslanadi.

| Kun | Hafta kuni | Format | Vaqt | Pillar | G'oya / hook |
|---|---|---|---|---|---|
| 1 | Dush | Reels | 20:00 | P2 | "YouTube, VK, Rutube — birida jamlangan." Ekranda 3 platforma logotipi bitta room'ga kirib ketadi |
| 2 | Sesh | Post (karusel) | 12:30 | P5 | "3 qadamda xona ochish": 1) link tashla 2) do'stni chaqir 3) play bos |
| 3 | Chor | Reels | 20:00 | **P1** | Savol: "Kim boshlaydi filmni? / Sen necha daqiqadasan? / Kamera ochiladimi?" → Javob: "Bitta link. Bitta tugma. Hammaga bir xil frame." |
| 4 | Pay | Post | 12:30 | P4 | Real foydalanuvchi sharhi skrinshoti + "Nega ular WeWatch tanladi" qisqa matn |
| 5 | Juma | Reels | 20:00 | P3 | "Pytnitsa. 5 do'st. 5 shahar. 1 film." — mavjud skript asosida qayta kesilgan versiya |
| 6 | Shan | Reels | 20:00 | P6 | Haftaning trend audiosi + "uzoqdagi do'stlar bilan tomosha" pain-point |
| 7 | Yak | Post | 12:30 | P8 | To'g'ridan CTA: "Bugun kechqurun kim bilan tomosha qilasan?" + link bio |
| 8 | Dush | Reels | 20:00 | P2 | Jonli chat + reaksiyalar demo (ekran yozuvi, real chat oqimi) |
| 9 | Sesh | Post | 12:30 | P5 | "4K va bepul — qanday ishlaydi" qisqa tushuntirish karuseli |
| 10 | Chor | Reels | 20:00 | **P1** | "Sen play bosdingmi? / U hali yuklayaptimi? / Kim orqada qoldi?" → "WeWatch — hammaga bitta frame" |
| 11 | Pay | Post | 12:30 | P4 | 2-3 ta sharh/DM skrinshoti kolaji |
| 12 | Juma | Reels | 20:00 | P3 | Uzoq masofadagi juftlik — "har kuni bir xil vaqt, boshqa shahar" hikoyasi |
| 13 | Shan | Reels | 20:00 | P6 | Trend format: "POV: do'stlaring bilan kino kechasi, lekin har biri boshqa shaharda" |
| 14 | Yak | Post | 12:30 | P7 | Tezcode jamoasi qisqa tanishuvi — "Buni kim qurayapti" |
| 15 | Dush | Reels | 20:00 | P2 | TikTok/Twitch sinxron demo — "faqat kino emas, striming ham" |
| 16 | Sesh | Post | 12:30 | P5 | "Mobil vs Web — qaysi birida qanday ishlaydi" qo'llanma |
| 17 | Chor | Reels | 20:00 | **P1** | "Ovoz kech keladimi? / Video buferlanadimi? / Sinxron buziladimi?" → "Heartbeat sinxronizatsiya — hammasi bir vaqtda" |
| 18 | Pay | Post | 12:30 | P4 | Foydalanuvchi statistikasi/raqam (masalan, jami xonalar soni) — ijtimoiy dalil sifatida |
| 19 | Juma | Reels | 20:00 | P3 | "Ish kuni tugadi, lekin do'stlar boshqa shaharda" — kechki relaks hikoyasi |
| 20 | Shan | Reels | 20:00 | P6 | Trend audio + "kim kino tanlaydi" hazil-mutoyiba formati |
| 21 | Yak | Post | 12:30 | P8 | CTA: "Hafta oxiri rejangda kino bormi? Xona och" |
| 22 | Dush | Reels | 20:00 | P2 | Do'stlar/ijtimoiy grafik — "kim onlayn, kim band" demo |
| 23 | Sesh | Post | 12:30 | P5 | "Xavfsizlik va akkaunt: Google/Telegram bilan kirish" qisqa tushuntirish |
| 24 | Chor | Reels | 20:00 | **P1** | "Kim linkni yubordi-yu, o'zi kirmadi? / Kim 10 daqiqa kutdi? / Kim umuman kelmadi?" → "Do'stlaringni real vaqtda ko'rasan — kelganini bilasan" |
| 25 | Pay | Post | 12:30 | P4 | Before/after: "Avval — alohida ekranlar. Endi — bitta xona" vizual qiyoslash |
| 26 | Juma | Reels | 20:00 | P3 | Yakuniy "5 do'st 5 shahar" seriyasining davomi — yangi personajlar/hikoya |
| 27 | Shan | Reels | 20:00 | P6 | Trend format + "kino kechasi fail'lari" (hazil, keyin yechim sifatida WeWatch) |
| 28 | Yak | Post | 12:30 | P7 | "Bu oyda nima o'zgardi" — mahsulot yangiliklari qisqacha |
| 29 | Dush | Reels | 20:00 | P2 | Umumiy qamrov demo: "10+ manba, 1 ilova" tezkor montaj |
| 30 | Sesh | Post + Reels | 12:30 / 20:00 | P8 + P1 | Oy yakuni: kichik statistika/rekap Post (12:30) + kuchli CTA Reels "Endi navbat sizda" (20:00) — ikki kunlik format bitta kunda, oyni yopish uchun |

**Jami:** 30 kun ichida **19 Reels + 11 Post/Karusel** (30-kun ikkita post bilan yakunlanadi).
P1 ("3 savol + javob") — har hafta chorshanba, jami **4 marta** takrorlanadi, har safar
boshqa og'riq nuqtasi bilan (yuqoridagi jadvalda 4 ta variant yozilgan).

---

## 4. Caption va hashtag qoidasi

- Har captionda: hook (1-qator) → qisqa tavsif (1-2 qator) → CTA ("link bio'da" / "wewatch.uz")
- Til: o'zbekcha asosiy, kerak bo'lsa ruscha VO (mavjud reels'lardagi kabi)
- Hashtag: 3–5 ta aniq (`#wewatch #birgatomosha #kinokechasi #uzbekistan #do'stlar`),
  generic spam-hashtag ishlatilmaydi (reach'ga salbiy ta'sir qiladi)
- Har Reels oxirida bitta og'zaki CTA: "Xonani hoziroq och — wewatch.uz"

---

## 5. Ochiq xavflar / bloklovchi omillar

1. **IG_ACCESS_TOKEN va IG_USER_ID yo'q** — avtomatik nashr ishlamaydi
   (`wewatch-reels/README-INSTAGRAM-API.md`ga qarang). Saidazimdan kutilmoqda.
2. **Video uchun ochiq (public) URL** kerak — Graph API lokal faylni qabul qilmaydi;
   `wewatch.uz/media/` yoki Cloudflare R2 kerak bo'ladi.
3. **Brend rangi hal qilinmagan** — marketing qo'llanma binafsha (#7C3AED),
   logo ko'k (#1D4FFF). 30 kunlik kontent boshlanishidan oldin bitta rangga
   qat'iylashtirish kerak, aks holda vizual nomuvofiqlik bo'ladi.
4. Bu reja **shablon/skelet** — har kun uchun aniq video/rasm ishlab chiqarish
   (Remotion render, VO, montaj) alohida ish hajmi talab qiladi; jadval shu
   ishni rejalashtirish uchun.

---

## 6. Keyingi qadam

`docs/Tasks.md` T-S200 dagi ochiq bandni yangilash: 30 kunlik reja fayl
sifatida tayyor (`marketing/instagram-30day-content-plan.md`) — Saidazimga
yuborish uchun tayyor holatga o'tkazish mumkin.
