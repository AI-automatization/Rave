// WeWatch — Privacy Policy content (uz/ru/en)
// App Store compliant + GDPR + Uzbekistan Personal Data Law (29.07.2019 №ЎРҚ-547)
// Version: 1 (key: wewatch_privacy_v1)
// Effective: 2025-01-01
//
// Infrastructure note: MongoDB, Redis, Elasticsearch are self-hosted on Railway.
// MongoDB Inc. (Atlas) is NOT used — do not list it as a data recipient.

export const PRIVACY_POLICY_VERSION = 'v1';
export const PRIVACY_POLICY_STORAGE_KEY = `wewatch_privacy_${PRIVACY_POLICY_VERSION}`;

export const PRIVACY_POLICY: Record<'uz' | 'ru' | 'en', string> = {

  // ─── UZBEKCHA ───────────────────────────────────────────────────────────────
  uz: `WeWatch — Maxfiylik Siyosati
Kuchga kirish sanasi: 1-yanvar 2025-yil

👋  1. Kirish

WeWatch ("biz", "bizning") sizning maxfiyligingizni hurmat qiladi. Ushbu Maxfiylik Siyosati WeWatch mobil ilovasidan ("Ilova") foydalanishda biz qanday shaxsiy ma'lumotlarni to'plashimiz, ulardan qanday foydalanishimiz, qancha muddat saqlashimiz va qanday himoya qilishimizni tushuntiradi.

Ilovadan foydalanib, siz ushbu Siyosat shartlarini qabul qilasiz.

📋  2. Biz to'playdigan ma'lumotlar

2.1. Siz to'g'ridan-to'g'ri taqdim etadigan ma'lumotlar:
• Foydalanuvchi nomi (taxallus)
• Elektron pochta manzili
• Parol (shifrlangan holda saqlanadi — biz hech qachon ochiq matndagi parolni ko'rmaymiz)
• Profil rasmi (ixtiyoriy)
• Watch Party tarixi: xonalar va pleylistlar

2.2. Ilova tomonidan avtomatik to'planadigan ma'lumotlar:
• Push-bildirishnoma tokeni — taklif va voqealar haqida xabar berish uchun
• Qurilma operatsion tizimi turi va versiyasi — texnik diagnostika uchun
• Anonim xato va nosozlik hisobotlari
• Oxirgi faollik sanasi va vaqti

2.3. Biz hech qachon to'PLAMAYDIGAN ma'lumotlar:
• Aniq joylashuv (GPS yoki xuddi shunga o'xshash)
• Telefon kitobi kontaktlari
• Biometrik ma'lumotlar
• Bank karta raqamlari yoki boshqa moliyaviy ma'lumotlar

🎯  3. Ma'lumotlardan foydalanish maqsadlari

Biz ma'lumotlaringizdan faqat quyidagi maqsadlarda foydalanamiz:
• Akkaunt yaratish va boshqarish
• Watch Party va sinxron tomosha funksiyalarini ta'minlash
• Push-bildirishnomalar yuborish (taklif, qo'llab-quvvatlash javoblari, muhim yangiliklar)
• Firibgarlikni oldini olish va platformani xavfsiz saqlash
• Texnik nosozliklarni aniqlash va bartaraf etish
• Ilova funksionalligi va foydalanuvchi tajribasini yaxshilash

⚖️  4. Qayta ishlashning huquqiy asoslari (GDPR)

Yevropa Ittifoqi foydalanuvchilari uchun:
• Shartnomani bajarish (GDPR 6(1)(b)-modda) — akkaunt va Ilova xizmatlarini ta'minlash uchun zarur
• Qonuniy manfaat (GDPR 6(1)(f)-modda) — platformani xavfsiz saqlash, suiiste'molni oldini olish
• Rozilik (GDPR 6(1)(a)-modda) — push-bildirishnomalar (qurilma sozlamalaridan qaytarib olinadi)

🤝  5. Uchinchi tomon xizmatlariga ma'lumot uzatish

Biz ma'lumotlaringizni sotmaymiz va begona maqsadlarda etkazmaymiz.

Ma'lumotlar faqat Ilovaning ishlashi uchun muqarrar bo'lgan quyidagi xizmatlar bilan bo'lishiladi:

• Railway (railway.app) — barcha ilova serverlari va ma'lumotlar bazalari shu platformada joylashgan. MongoDB, Redis va qidiruv tizimimiz Railway'ning o'zida self-hosted rejimda ishlaydi, ya'ni ma'lumotlar Railway infratuzilmasida saqlanadi.
  Maxfiylik siyosati: railway.app/legal/privacy

• Firebase (Google) — push-bildirishnomalar yuborish uchun foydalaniladi. Faqat push-token uzatiladi; Ilova ma'lumotlari Firebase'da saqlanmaydi.
  Maxfiylik siyosati: firebase.google.com/support/privacy

• Sentry — anonim texnik xato hisobotlari. Shaxsni aniqlovchi ma'lumotlar yuborilmaydi.
  Maxfiylik siyosati: sentry.io/privacy

• Google (Google Sign-In) — Google orqali autentifikatsiya qilishni tanlagan foydalanuvchilar uchun.
  Maxfiylik siyosati: policies.google.com/privacy

• Apple (Apple Sign In) — Apple orqali autentifikatsiya qilishni tanlagan iOS foydalanuvchilari uchun.
  Maxfiylik siyosati: apple.com/legal/privacy

Barcha hamkor-xizmatlar GDPR talablariga muvofiqligini ta'minlagan.

⏳  6. Ma'lumotlarni saqlash muddati

• Akkaunt ma'lumotlari — akkaunt o'chirilgunga qadar saqlanadi
• Texnik loglar — 90 kundan ko'p bo'lmagan muddatda
• Push-bildirishnoma tokenlari — ilova yoki akkaunt o'chirilgunga qadar
• Watch Party xona ma'lumotlari — xona yopilganidan 60 kun o'tgach

Akkauntni o'chirish (Sozlamalar → Akkauntni o'chirish) orqali barcha ma'lumotlaringiz 30 kun ichida butunlay va qaytarib bo'lmas tarzda o'chiriladi.

✅  7. Sizning huquqlaringiz

Shaxsiy ma'lumotlaringiz bo'yicha quyidagi huquqlarga egasiz:
• Kirish huquqi — siz haqingizda saqlanadigan ma'lumotlarning nusxasini olish
• To'g'irlash huquqi — noto'g'ri yoki to'liqsiz ma'lumotlarni tuzatish
• O'chirish huquqi — ma'lumotlaringizni o'chirish ("unutilish huquqi")
• Qayta ishlashni cheklash huquqi — muayyan hollarda qayta ishlashni vaqtincha to'xtatish
• Ma'lumotlarni ko'chirish huquqi — ma'lumotlaringizni mashinacha o'qiladigan formatda olish
• E'tiroz bildirish huquqi — qonuniy manfaat asosidagi qayta ishlashga e'tiroz bildirish
• Rozilikni qaytarib olish huquqi — istalgan vaqtda bildirishnoma roziligini bekor qilish

Huquqlarni amalga oshirish uchun: support@wewatch.uz
Ilova orqali: Sozlamalar → Qo'llab-quvvatlash → Bizga yozing

O'zbekiston Respublikasida yashovchi foydalanuvchilar "Shaxsiy ma'lumotlar to'g'risida"gi Qonun (29.07.2019 yil, №ЎРҚ-547) bilan himoyalangan.

🔐  8. Ma'lumotlar xavfsizligi

Biz quyidagi texnik va tashkiliy himoya choralarini qo'llaymiz:
• Parollarni bcrypt algoritmi bilan shifrlash (12 raund)
• Barcha tarmoq ulanishlari uchun HTTPS/TLS protokoli
• Qisqa muddatli JWT-tokenlar (15 daqiqa)
• Yangilash tokenlarini rotatsiya qilish (30 kun)
• Qurilmadagi ma'lumotlarni shifrlash (expo-secure-store)

👶  9. Bolalar maxfiyligi

WeWatch 13 va undan katta yoshdagi foydalanuvchilarga mo'ljallangan. Biz 13 yoshdan kichik bolalarning shaxsiy ma'lumotlarini atayin to'plamaymiz. Agar bola ma'lumot taqdim etganini bilsangiz — darhol support@wewatch.uz manziliga murojaat qiling; bu ma'lumotlar zudlik bilan o'chiriladi.

🌍  10. Xalqaro ma'lumot uzatish

Ilovamizning infratuzilmasi Railway platformasida joylashgan bo'lib, serverlar turli mamlakatlarda bo'lishi mumkin. Ma'lumotlaringizni xalqaro uzatish GDPR talablariga (Yevropa Ittifoqining Standart Shartnoma Shartlari) va boshqa qo'llaniladigan qonunlarga muvofiq amalga oshiriladi.

🔄  11. Siyosatga o'zgartirishlar

Biz ushbu Siyosatni yangilashimiz mumkin. Muhim o'zgarishlar haqida push-bildirishnoma yoki Ilovaga keyingi kirishda xabardor qilamiz. O'zgarishlardan so'ng Ilovadan foydalanishni davom ettirishingiz yangilangan Siyosatga roziligingizni bildiradi.

📬  12. Bog'lanish ma'lumotlari

Maxfiylik bo'yicha barcha savol va so'rovlar uchun:
• Email: support@wewatch.uz
• Ilova orqali: Sozlamalar → Qo'llab-quvvatlash → Bizga yozing`,


  // ─── РУССКИЙ ────────────────────────────────────────────────────────────────
  ru: `WeWatch — Политика конфиденциальности
Дата вступления в силу: 1 января 2025 г.

👋  1. Введение

WeWatch («мы», «наш», «нас») уважает вашу конфиденциальность. Настоящая Политика конфиденциальности описывает, какие персональные данные мы собираем при использовании мобильного приложения WeWatch («Приложение»), в каких целях их используем, как долго храним и каким образом защищаем.

Используя Приложение, вы принимаете условия настоящей Политики.

📋  2. Данные, которые мы собираем

2.1. Данные, которые вы предоставляете напрямую:
• Имя пользователя (никнейм)
• Адрес электронной почты
• Пароль (хранится в зашифрованном виде — мы никогда не видим его в открытом тексте)
• Фотография профиля (по желанию)
• История Watch Party: комнаты и плейлисты

2.2. Данные, собираемые приложением автоматически:
• Токен push-уведомлений — для отправки приглашений и уведомлений о событиях
• Тип и версия операционной системы устройства — для технической диагностики
• Анонимные отчёты об ошибках и сбоях
• Дата и время последней активности

2.3. Данные, которые мы никогда не собираем:
• Точное местоположение (GPS и аналогичные технологии)
• Контакты телефонной книги
• Биометрические данные
• Данные банковских карт или иная финансовая информация

🎯  3. Цели обработки данных

Мы используем ваши данные исключительно для следующих целей:
• Создание аккаунта и управление им
• Обеспечение работы Watch Party и функции синхронного просмотра
• Отправка push-уведомлений (приглашения, ответы поддержки, важные обновления)
• Предотвращение мошенничества и обеспечение безопасности платформы
• Техническая диагностика и устранение неисправностей
• Улучшение функциональности и пользовательского опыта

⚖️  4. Правовые основания обработки (GDPR)

Для пользователей из Европейского Союза:
• Исполнение договора (ст. 6(1)(b) GDPR) — обработка необходима для предоставления услуг Приложения
• Законный интерес (ст. 6(1)(f) GDPR) — обеспечение безопасности платформы, предотвращение злоупотреблений
• Согласие (ст. 6(1)(a) GDPR) — push-уведомления (отзывается в настройках устройства)

🤝  5. Передача данных третьим лицам

Мы не продаём ваши данные и не передаём их в коммерческих целях.

Данные передаются исключительно следующим сервисам, без которых работа Приложения невозможна:

• Railway (railway.app) — платформа, на которой размещены все серверы и базы данных. Наши базы данных (MongoDB, Redis, поисковый движок) работают в режиме self-hosted на инфраструктуре Railway — данные хранятся на серверах Railway, а не у стороннего поставщика баз данных.
  Политика конфиденциальности: railway.app/legal/privacy

• Firebase (Google) — используется для доставки push-уведомлений. Передаётся только токен push-уведомлений; данные Приложения на серверах Firebase не хранятся.
  Политика конфиденциальности: firebase.google.com/support/privacy

• Sentry — анонимные технические отчёты об ошибках. Персональные идентификаторы не передаются.
  Политика конфиденциальности: sentry.io/privacy

• Google (Google Sign-In) — для пользователей, выбравших авторизацию через Google.
  Политика конфиденциальности: policies.google.com/privacy

• Apple (Apple Sign In) — для пользователей iOS, выбравших авторизацию через Apple.
  Политика конфиденциальности: apple.com/legal/privacy

Все перечисленные партнёры обеспечивают соответствие требованиям GDPR.

⏳  6. Сроки хранения данных

• Данные аккаунта — до момента удаления аккаунта
• Технические логи — не более 90 дней
• Токены push-уведомлений — до удаления приложения или аккаунта
• Данные комнат Watch Party — 60 дней после закрытия комнаты

При удалении аккаунта (Настройки → Удалить аккаунт) все ваши данные безвозвратно удаляются в течение 30 дней.

✅  7. Ваши права

Вы имеете следующие права в отношении ваших персональных данных:
• Право на доступ — получить копию хранимых данных о вас
• Право на исправление — исправить неточные или неполные данные
• Право на удаление — удалить свои данные («право на забвение»)
• Право на ограничение обработки — временно приостановить обработку в определённых случаях
• Право на перенос данных — получить данные в машиночитаемом формате
• Право на возражение — возразить против обработки на основании законного интереса
• Право отозвать согласие — в любой момент отозвать согласие на получение уведомлений

Для реализации прав: support@wewatch.uz
Через приложение: Настройки → Поддержка → Написать нам

Пользователи в Узбекистане защищены Законом «О персональных данных» (29.07.2019, №ЎРҚ-547).

🔐  8. Безопасность данных

Мы применяем следующие технические и организационные меры защиты:
• Шифрование паролей алгоритмом bcrypt (12 раундов)
• HTTPS/TLS для всех сетевых соединений
• JWT-токены с коротким сроком действия (15 минут)
• Ротация токенов обновления (30 дней)
• Шифрование данных на устройстве (expo-secure-store)

👶  9. Защита детей

Приложение WeWatch предназначено для пользователей в возрасте 13 лет и старше. Мы сознательно не собираем данные детей младше 13 лет. Если вам стало известно, что ребёнок предоставил нам личную информацию — немедленно свяжитесь с нами: support@wewatch.uz. Эти данные будут незамедлительно удалены.

🌍  10. Международная передача данных

Инфраструктура Приложения размещена на платформе Railway, серверы которой могут находиться в различных странах. Мы обеспечиваем соответствие международной передачи данных требованиям GDPR (Стандартные договорные условия ЕС) и иным применимым законам.

🔄  11. Изменения политики

Мы можем обновлять настоящую Политику. О существенных изменениях вы будете уведомлены через push-уведомление или при следующем входе в Приложение. Продолжение использования Приложения после уведомления означает принятие обновлённой Политики.

📬  12. Контактная информация

По всем вопросам конфиденциальности:
• Email: support@wewatch.uz
• Через Приложение: Настройки → Поддержка → Написать нам`,


  // ─── ENGLISH ────────────────────────────────────────────────────────────────
  en: `WeWatch — Privacy Policy
Effective Date: January 1, 2025

👋  1. Introduction

WeWatch ("we", "our", "us") respects your privacy. This Privacy Policy describes what personal data we collect when you use the WeWatch mobile application ("App"), the purposes for which we use it, how long we retain it, and how we protect it.

By using the App, you accept the terms of this Policy.

📋  2. Data We Collect

2.1. Data you provide directly:
• Username (display name)
• Email address
• Password (stored encrypted — we never see your plaintext password)
• Profile photo (optional)
• Watch Party history: rooms and playlists

2.2. Data collected automatically by the App:
• Push notification token — to send invitations and event notifications
• Device operating system type and version — for technical diagnostics
• Anonymous crash and error reports
• Date and time of last activity

2.3. Data we never collect:
• Precise location (GPS or similar technologies)
• Phone book contacts
• Biometric data
• Bank card numbers or other financial information

🎯  3. Purposes of Data Processing

We use your data solely for the following purposes:
• Creating and managing your account
• Providing Watch Party and synchronized viewing features
• Sending push notifications (invitations, support replies, important updates)
• Preventing fraud and maintaining platform security
• Technical diagnostics and troubleshooting
• Improving app functionality and user experience

⚖️  4. Legal Basis for Processing (GDPR)

For users in the European Union:
• Performance of contract (Art. 6(1)(b) GDPR) — processing is necessary to provide App services
• Legitimate interest (Art. 6(1)(f) GDPR) — platform security, abuse prevention
• Consent (Art. 6(1)(a) GDPR) — push notifications (withdraw via device settings)

🤝  5. Data Sharing with Third Parties

We do not sell your data or share it for commercial purposes.

Data is shared only with the following services that are essential for the App to function:

• Railway (railway.app) — the platform hosting all our application servers and databases. Our databases (MongoDB, Redis, search engine) run in self-hosted mode on Railway's infrastructure — data is stored on Railway servers, not with a third-party database provider.
  Privacy Policy: railway.app/legal/privacy

• Firebase (Google) — used to deliver push notifications. Only the push notification token is transmitted; App data is not stored on Firebase servers.
  Privacy Policy: firebase.google.com/support/privacy

• Sentry — anonymous technical error reports. No personal identifiers are transmitted.
  Privacy Policy: sentry.io/privacy

• Google (Google Sign-In) — for users who choose to authenticate via Google.
  Privacy Policy: policies.google.com/privacy

• Apple (Apple Sign In) — for iOS users who choose to authenticate via Apple.
  Privacy Policy: apple.com/legal/privacy

All listed partners ensure compliance with GDPR requirements.

⏳  6. Data Retention

• Account data — until account deletion
• Technical logs — no more than 90 days
• Push notification tokens — until app or account deletion
• Watch Party room data — 60 days after room closure

Upon account deletion (Settings → Delete Account), all your data is permanently and irreversibly deleted within 30 days.

✅  7. Your Rights

You have the following rights regarding your personal data:
• Right of access — receive a copy of data stored about you
• Right of rectification — correct inaccurate or incomplete data
• Right of erasure — delete your data ("right to be forgotten")
• Right to restriction of processing — temporarily suspend processing in certain circumstances
• Right to data portability — receive data in a machine-readable format
• Right to object — object to processing based on legitimate interest
• Right to withdraw consent — withdraw notification consent at any time

To exercise your rights: support@wewatch.uz
Via the App: Settings → Support → Contact Us

Users in Uzbekistan are protected by the Law on Personal Data (29.07.2019, №ЎРҚ-547).

🔐  8. Data Security

We implement the following technical and organisational security measures:
• Password encryption using bcrypt (12 rounds)
• HTTPS/TLS for all network connections
• Short-lived JWT tokens (15 minutes)
• Refresh token rotation (30 days)
• On-device data encryption (expo-secure-store)

👶  9. Children's Privacy

WeWatch is intended for users aged 13 and older. We do not knowingly collect data from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately at support@wewatch.uz — such data will be deleted without delay.

🌍  10. International Data Transfers

The App's infrastructure is hosted on the Railway platform, whose servers may be located in various countries. We ensure that any international transfer of data complies with GDPR requirements (EU Standard Contractual Clauses) and other applicable laws.

🔄  11. Changes to This Policy

We may update this Policy. You will be notified of significant changes via push notification or upon next login to the App. Continued use of the App after notification constitutes acceptance of the updated Policy.

📬  12. Contact Information

For all privacy-related questions and requests:
• Email: support@wewatch.uz
• Via the App: Settings → Support → Contact Us`,
};
