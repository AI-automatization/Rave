// WeWatch — Privacy Policy content (uz/ru/en)
// App Store compliant + GDPR + CCPA + Uzbekistan Personal Data Law (29.07.2019 №ЎРҚ-547)
// Version: 2.0 (key: wewatch_privacy_v2)
// Effective: 2026-06-11
//
// Infrastructure note: MongoDB, Redis, Elasticsearch are self-hosted on Railway.
// MongoDB Inc. (Atlas) is NOT used — do not list it as a data recipient.

export const PRIVACY_POLICY_VERSION = 'v2';
export const PRIVACY_POLICY_STORAGE_KEY = `wewatch_privacy_${PRIVACY_POLICY_VERSION}`;

export const PRIVACY_POLICY: Record<'uz' | 'ru' | 'en', string> = {

  // ─── UZBEKCHA ───────────────────────────────────────────────────────────────
  uz: `WeWatch — Maxfiylik Siyosati
Oxirgi yangilanish: 11-iyun 2026-yil
Versiya: 2.0

WeWatch ("biz", "bizning") sizning maxfiyligingizni hurmat qiladi. Ushbu Maxfiylik Siyosati WeWatch mobil ilovasi va veb-saytidan (https://wewatch.uz) foydalanganda qanday shaxsiy ma'lumotlar to'planishini, ulardan qanday foydalanilishini va sizning huquqlaringizni tavsiflaydi. Xizmatdan foydalanib, siz ushbu Siyosat shartlarini qabul qilasiz.

📋  1. Biz to'playdigan ma'lumotlar

Siz to'g'ridan-to'g'ri taqdim etasiz:
• Foydalanuvchi nomi va elektron pochta manzili
• Parol (bcrypt-xesh shaklida saqlanadi — biz ochiq matnni hech qachon ko'rmaymiz)
• Profil rasmi (ixtiyoriy)
• Watch Party xonalaridagi chat xabarlari va reaksiyalar

Avtomatik to'planadi:
• Ko'rish tarixi, Watch Party sessiyalari va xona a'zoligi
• Push-bildirishnoma tokeni (FCM/APNs) — siz obuna bo'lgan bildirishnomalar uchun
• Qurilma turi va operatsion tizim versiyasi
• IP-manzil — faqat server kirish jurnallarida, xavfsizlik va brute-force himoyasi uchun (90 kun saqlanadi)
• Anonim xato hisobotlari (90 kun saqlanadi)
• Ball, daraja, yutuqlar va o'yin faolligi
• Ichki brauzer orqali tashrif buyurilgan saytlarning domen nomlari (masalan, youtube.com) — faqat suiiste'molni aniqlash uchun; to'liq URL yoki sahifa mazmuni saqlanmaydi

Biz HECH QACHON TO'PLAMAYMIZ:
• Aniq joylashuv (GPS)
• Telefon kitobi kontaktlari
• Biometrik ma'lumotlar
• Bank karta raqamlari yoki moliyaviy ma'lumotlar
• Apple Advertising Identifier (IDFA) yoki reklama identifikatorlari

Google / Apple orqali kirish:
Biz faqat provider identifikatori, email va ko'rsatish nomini olamiz. OAuth tokenlarini saqlamaymiz.

🎯  2. Ma'lumotlardan foydalanish maqsadlari

• Akkaunt yaratish, autentifikatsiya va sessiya xavfsizligi
• Watch Party'da sinxron tomosha
• Siz obuna bo'lgan push-bildirishnomalar
• Geymifikatsiya — ball, daraja, yutuqlar
• Ijtimoiy funksiyalar — do'stlar, qidiruv, ommaviy profillar
• Kontent moderatsiyasi va Foydalanish shartlariga rioya
• Qo'llab-quvvatlash so'rovlarini ko'rib chiqish
• Qonun talablariga rioya
• Xizmatni yaxshilash (faqat umumlashtirilgan, identifikatsiyalanmagan tahlil)

Biz sizning ma'lumotlaringizdan reklama maqsadida FOYDALANMAYMIZ va uchinchi shaxslarga SOTMAYMIZ.

📱  3. Video kontent va ichki brauzer

WeWatch — ichki brauzer (WebView) bilan jihozlangan Watch Party platformasi.
• WeWatch proxy-server emas. Video to'g'ridan-to'g'ri manba serverdan qurilmangizga uzatiladi. Bizning serverlarimiz video kontentni qabul qilmaydi va saqlamaydi.
• Aniqlash mijoz tomonida amalga oshiriladi. Ilova brauzer tomonidan allaqachon yuklangan media stream URL-larini faqat qurilmangizda aniqlaydi.
• DRM chetlab o'tilmaydi. Widevine, FairPlay yoki PlayReady chetlab o'tilmaydi. Faqat ochiq oqimlar aniqlanadi.
• Yuklab olish yo'q. Ilova video fayllarni yuklab olish funksiyasini ta'minlamaydi.
• Watch Party xonalarida ulashilgan URL-lar xona holatini saqlash uchun saqlanadi va xona yopilganidan 30 kun o'tgach avtomatik o'chiriladi.

🤝  4. Ma'lumotlarni uchinchi shaxslarga uzatish

| Provayder | Maqsad |
• Railway (railway.app) — barcha ilova serverlari va ma'lumotlar bazalari (MongoDB, Redis, Elasticsearch — Railway infratuzilmasida self-hosted)
• Google Firebase (FCM) — push-bildirishnomalarni yetkazish — faqat qurilma tokeni
• Sentry.io — anonim xato monitoringi — shaxsiy identifikatorlarsiz
• Google Sign-In — autentifikatsiya — faqat siz ushbu usulni tanlasangiz
• Apple Sign In — autentifikatsiya — faqat siz ushbu usulni tanlasangiz

Biz ma'lumotlarni SOTMAYMIZ. Reklama tarmoqlari yoki AI-xizmatlarga UZATMAYMIZ.

⏳  5. Ma'lumotlarni saqlash muddatlari

• Akkaunt ma'lumotlari — akkaunt o'chirilguncha
• O'chirilgan akkauntlar — shaxsiy ma'lumotlar 30 kun ichida o'chiriladi
• Kirish jurnallari — 90 kun
• Watch Party xona ma'lumotlari — xona yopilganidan 30 kun o'tgach
• Chat xabarlari — xona bilan birga o'chiriladi
• Qo'llab-quvvatlash tiketlari — 2 yilgacha

Akkauntni o'chirish: Sozlamalar → Akkaunt → Akkauntni o'chirish
Yoki ilovasiz: https://wewatch.uz/delete-account

✅  6. Sizning huquqlaringiz

• Kirish — ma'lumotlaringizning nusxasini olish
• To'g'irlash — noto'g'ri ma'lumotlarni tuzatish
• O'chirish — akkaunt va barcha shaxsiy ma'lumotlarni o'chirish
• Ko'chirish — ma'lumotlarni mashinacha o'qiladigan formatda olish
• Cheklash — qayta ishlashni vaqtincha to'xtatish
• E'tiroz — qonuniy manfaat asosidagi qayta ishlashga e'tiroz bildirish
• Rozilikni qaytarish — istalgan vaqtda push-bildirishnomalardan voz kechish

Murojaat uchun: support@wewatch.uz
Javob muddati: 30 kun (GDPR) / 45 kun (CCPA)

GDPR (EU/UK): Huquqiy asoslar — shartnomani bajarish (6(1)(b)), qonuniy manfaat (6(1)(f)), rozilik (6(1)(a)).
CCPA (Kaliforniya): Biz shaxsiy ma'lumotlarni o'zaro xulq-atvorli reklama uchun sotmaymiz yoki ulashmaymiz.
O'zbekiston: Foydalanuvchilar "Shaxsiy ma'lumotlar to'g'risida"gi Qonun (29.07.2019, №ЎРҚ-547) bilan himoyalangan.

👶  7. Yosh talablari

WeWatch 17 yoshdan katta foydalanuvchilar uchun mo'ljallangan (17+ reyting). Biz 13 yoshdan kichik bolalarning ma'lumotlarini atayin to'plamaymiz. Agar voyaga etmagan shaxs ro'yxatdan o'tgan deb hisoblasangiz — darhol support@wewatch.uz manziliga murojaat qiling.

🔐  8. Xavfsizlik

• Parollar: bcrypt (12 raund)
• Barcha ulanishlar: TLS 1.2+
• Kirish tokenlari: RS256 JWT, amal qilish muddati 15 daqiqa
• Yangilash tokenlari: har 30 kunda rotatsiya
• Brute-force himoyasi: 5 urinish → 15 daqiqa blokirovka
• Qurilmada saqlash: expo-secure-store (shifrlangan)

📡  9. Kuzatuv va reklama

• Ilovalar o'rtasida kuzatuv yo'q
• IDFA va reklama identifikatorlari yo'q
• App Tracking Transparency (ATT) so'rovi yo'q — biz kuzatmaymiz
• Reklama va analitika cookie fayllari yo'q

🌍  10. Xalqaro ma'lumot uzatish

Bizning serverlarimiz Railway.app platformasida joylashgan. Agar siz EU yoki UK'da bo'lsangiz, ma'lumotlaringiz standart shartnoma shartlari asosida AQShga uzatiladi.

🔄  11. Siyosatga o'zgartirishlar

Muhim o'zgarishlar haqida in-app bildirishnoma yoki email orqali kuchga kirishidan kamida 7 kun oldin xabardor qilamiz.

📬  12. Bog'lanish ma'lumotlari

WeWatch — MCHJ "TEZ KOD" mahsuloti (shaxsiy ma'lumotlar operatori)
Toshkent sh., O'zbekiston Respublikasida ro'yxatdan o'tgan
Email: support@wewatch.uz
Veb-sayt: https://wewatch.uz`,


  // ─── РУССКИЙ ────────────────────────────────────────────────────────────────
  ru: `WeWatch — Политика конфиденциальности
Последнее обновление: 11 июня 2026 г.
Версия: 2.0

WeWatch («мы», «наш», «нас») уважает вашу конфиденциальность. Настоящая Политика описывает, какие персональные данные мы собираем при использовании приложения WeWatch и сайта (https://wewatch.uz), как мы их используем и каковы ваши права. Используя Сервис, вы принимаете условия настоящей Политики.

📋  1. Данные, которые мы собираем

Вы предоставляете напрямую:
• Имя пользователя и адрес электронной почты
• Пароль (хранится в виде bcrypt-хэша — в открытом виде мы его никогда не видим)
• Фотография профиля (по желанию)
• Сообщения в чате и реакции в комнатах Watch Party

Собираются автоматически:
• История просмотров, сессии Watch Party и членство в комнатах
• Токен push-уведомлений (FCM/APNs) — для уведомлений, на которые вы подписались
• Тип устройства и версия операционной системы
• IP-адрес — только в журналах доступа сервера, для безопасности и защиты от перебора (хранится 90 дней)
• Анонимные отчёты об ошибках и сбоях (хранятся 90 дней)
• Очки, ранги, достижения и игровая активность
• Доменные имена сайтов, посещённых через встроенный браузер (например, youtube.com) — только для обнаружения злоупотреблений; полный URL и содержимое страниц не сохраняются

Мы НИКОГДА не собираем:
• Точное местоположение (GPS)
• Контакты телефонной книги
• Биометрические данные
• Данные банковских карт или иную финансовую информацию
• Apple Advertising Identifier (IDFA) и любые рекламные идентификаторы

Вход через Google / Apple:
Мы получаем идентификатор провайдера, email и отображаемое имя. OAuth-токены мы не храним.

🎯  2. Как мы используем ваши данные

• Создание аккаунта, аутентификация и безопасность сессий
• Синхронизированный просмотр в Watch Party
• Push-уведомления, на которые вы подписались
• Геймификация — очки, ранги, достижения
• Социальные функции — друзья, поиск, публичные профили
• Модерация контента и соблюдение Условий использования
• Обработка запросов в поддержку
• Исполнение требований законодательства
• Улучшение сервиса (только агрегированная, неидентифицирующая аналитика)

Мы НЕ используем ваши данные для рекламы и НЕ продаём их третьим лицам.

📱  3. Видеоконтент и встроенный браузер

WeWatch — платформа для совместного просмотра со встроенным браузером (WebView).
• WeWatch не является прокси-сервером. Видео передаётся напрямую с сервера источника на ваше устройство. Наши серверы не принимают и не хранят видеоконтент.
• Обнаружение происходит на стороне клиента. Приложение определяет URL медиапотоков, уже загруженных браузером — только на вашем устройстве.
• Нет обхода DRM. Мы не обходим Widevine, FairPlay или PlayReady. Обнаруживаются только общедоступные потоки.
• Нет загрузки. Приложение не предоставляет функций загрузки или сохранения видеофайлов.
• URL-адреса, которыми делятся в комнатах Watch Party, хранятся для поддержания состояния комнаты и автоматически удаляются через 30 дней после закрытия комнаты.

🤝  4. Передача данных третьим лицам

• Railway (railway.app) — все серверы приложения и базы данных (MongoDB, Redis, Elasticsearch — self-hosted на инфраструктуре Railway)
• Google Firebase (FCM) — доставка push-уведомлений — только токен устройства
• Sentry.io — анонимный мониторинг ошибок — без личных идентификаторов
• Google Sign-In — аутентификация — только если вы выбрали этот метод
• Apple Sign In — аутентификация — только если вы выбрали этот метод

Мы НЕ продаём данные. Мы НЕ передаём данные рекламным сетям или AI-сервисам.

⏳  5. Сроки хранения данных

• Данные аккаунта — до удаления аккаунта
• Удалённые аккаунты — персональные данные удаляются в течение 30 дней
• Журналы доступа — 90 дней
• Данные комнат Watch Party — 30 дней после закрытия комнаты
• Сообщения чата — удаляются вместе с комнатой
• Тикеты поддержки — до 2 лет

Удаление аккаунта: Настройки → Аккаунт → Удалить аккаунт
Или без приложения: https://wewatch.uz/delete-account

✅  6. Ваши права

• Доступ — получить копию своих данных
• Исправление — скорректировать неточные данные
• Удаление — удалить аккаунт и все персональные данные
• Перенос — получить данные в машиночитаемом формате
• Ограничение — временно приостановить обработку
• Возражение — возразить против обработки на основании законного интереса
• Отзыв согласия — отписаться от push-уведомлений в любой момент

Контакт: support@wewatch.uz
Срок ответа: 30 дней (GDPR) / 45 дней (CCPA)

GDPR (ЕС/Великобритания): Правовые основания — исполнение договора (6(1)(b)), законный интерес (6(1)(f)), согласие (6(1)(a)).
CCPA (Калифорния): Мы не продаём и не передаём персональные данные для перекрёстной поведенческой рекламы.
Узбекистан: Пользователи защищены Законом «О персональных данных» (29.07.2019, №ЎРҚ-547).

👶  7. Возрастные требования

WeWatch предназначен для пользователей 17 лет и старше (рейтинг 17+). Мы сознательно не собираем данные лиц до 13 лет. Если вы считаете, что несовершеннолетний прошёл регистрацию — немедленно напишите нам: support@wewatch.uz.

🔐  8. Безопасность

• Пароли: bcrypt (12 раундов)
• Все соединения: TLS 1.2+
• Токены доступа: RS256 JWT, срок действия 15 минут
• Токены обновления: ротация каждые 30 дней
• Защита от перебора: 5 попыток → блокировка на 15 минут
• Хранение на устройстве: expo-secure-store (зашифровано)

📡  9. Отслеживание и реклама

• Нет отслеживания между приложениями
• Нет IDFA и рекламных идентификаторов
• Нет запроса App Tracking Transparency (ATT) — мы не отслеживаем
• Нет рекламных и аналитических куки

🌍  10. Международная передача данных

Наши серверы размещены на платформе Railway.app. Если вы находитесь в ЕС или Великобритании, ваши данные передаются в США на основании стандартных договорных условий или эквивалентных гарантий.

🔄  11. Изменения политики

О существенных изменениях мы уведомим вас через in-app уведомление или email не менее чем за 7 дней до вступления в силу.

📬  12. Контактная информация

WeWatch — продукт MCHJ "TEZ KOD" (оператор / контролёр персональных данных)
Зарегистрировано в г. Ташкент, Республика Узбекистан
Email: support@wewatch.uz
Сайт: https://wewatch.uz`,


  // ─── ENGLISH ────────────────────────────────────────────────────────────────
  en: `WeWatch — Privacy Policy
Last updated: June 11, 2026
Version: 2.0

WeWatch ("we", "our", "us") respects your privacy. This Privacy Policy describes what personal data we collect when you use the WeWatch mobile application and website (https://wewatch.uz), how we use it, and your rights. By using the Service, you agree to the practices described here.

📋  1. Information We Collect

You provide directly:
• Username and email address
• Password (stored as bcrypt hash — we never see your plaintext password)
• Profile photo (optional)
• Chat messages and reactions in Watch Party rooms

Collected automatically:
• Watch history, Watch Party sessions and room membership
• Push notification token (FCM/APNs) — for notifications you opt into
• Device type and operating system version
• IP address — in server access logs only, for security and rate limiting (retained 90 days)
• Anonymous crash and error reports (retained 90 days)
• Points, ranks, achievements, and gamification activity
• Domain names of websites visited via the in-app browser (e.g., youtube.com) — for abuse detection only; not the full URL or page content

We NEVER collect:
• Precise location (GPS)
• Phone book contacts
• Biometric data
• Payment card or financial data
• Apple Advertising Identifier (IDFA) or any advertising identifier

Third-party sign-in (Google / Apple):
We receive your provider ID, email, and display name. We do NOT store OAuth tokens.

🎯  2. How We Use Your Data

• Account creation, authentication, and session security
• Synchronized Watch Party playback
• Push notifications you have opted into
• Gamification — points, ranks, achievements
• Social features — friends, search, public profiles
• Content moderation and Terms of Service enforcement
• Support request handling
• Legal compliance
• Service improvement (aggregated, non-identifiable analytics only)

We do NOT use your data for advertising or sell it to any third party.

📱  3. Video Content & In-App Browser

WeWatch is a social watch party platform with an integrated browser (WebView).
• WeWatch is not a video proxy. Video travels directly from source servers to your device. Our servers never receive or store video content.
• Client-side detection. The app detects media stream URLs already loaded by your browser — locally on your device only.
• No DRM circumvention. We do not bypass Widevine, FairPlay, or PlayReady. Only publicly playable streams are detectable.
• No downloading. The app provides no functionality to download or save video files.
• URLs shared in Watch Party rooms are stored to maintain room state and auto-deleted 30 days after the room closes.

🤝  4. Data Sharing

We share data only with:
• Railway (railway.app) — all application servers and databases (MongoDB, Redis, Elasticsearch — self-hosted on Railway infrastructure)
• Google Firebase (FCM) — push notification delivery — only your device token
• Sentry.io — anonymous error monitoring — no personal identifiers
• Google Sign-In — authentication — only if you choose this method
• Apple Sign In — authentication — only if you choose this method

We do NOT sell data. We do NOT share data with advertising networks or AI services.

⏳  5. Data Retention

• Account data — until account deletion
• Deleted accounts — personal data removed within 30 days
• Access logs — 90 days
• Watch Party room data — 30 days after room closes
• Chat messages — deleted with the room
• Support tickets — up to 2 years

Account deletion: Settings → Account → Delete Account
Or without the app: https://wewatch.uz/delete-account

✅  6. Your Rights

• Access — request a copy of your data
• Correction — fix inaccurate data
• Deletion — delete your account and all personal data
• Portability — receive data in machine-readable format
• Restriction — temporarily suspend processing
• Objection — object to legitimate-interest processing
• Withdraw consent — turn off push notifications anytime

Contact: support@wewatch.uz
Response time: 30 days (GDPR) / 45 days (CCPA)

GDPR (EEA/UK): Legal bases — performance of contract (6(1)(b)), legitimate interests (6(1)(f)), consent (6(1)(a)). You may lodge a complaint with your local supervisory authority.
CCPA (California): We do not sell or share personal information for cross-context behavioral advertising.
Uzbekistan: Users are protected by the Law on Personal Data (29.07.2019, №ЎРҚ-547).

👶  7. Age Requirements

WeWatch is intended for users 17 and older (17+ rating) due to user-generated content and the possibility of mature video content in Watch Party rooms. We do not knowingly collect data from anyone under 13. If you believe a minor has registered, contact us at support@wewatch.uz immediately.

🔐  8. Security

• Passwords: bcrypt (12 rounds)
• All connections: TLS 1.2+
• Access tokens: RS256 JWT, 15-minute expiry
• Refresh tokens: 30-day rotation
• Rate limiting: 5 failed attempts → 15-minute lockout
• On-device storage: expo-secure-store (encrypted)

📡  9. Tracking & Advertising

• No cross-app tracking
• No IDFA or advertising identifiers
• No App Tracking Transparency (ATT) prompt — we do not track
• No advertising or analytics cookies

🌍  10. International Data Transfers

Our servers are hosted via Railway.app. If you are located in the EEA or UK, your data is transferred to the US under standard contractual clauses or equivalent safeguards.

🔄  11. Changes

We will notify you of material changes via in-app notification or email at least 7 days before the change takes effect.

📬  12. Contact

WeWatch — a product of "TEZ KOD" LLC (data controller / operator)
Registered in Tashkent, Republic of Uzbekistan
Email: support@wewatch.uz
Website: https://wewatch.uz`,
};
