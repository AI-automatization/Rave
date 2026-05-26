// WeWatch — Privacy Policy content (uz/ru/en)
// App Store compliant + GDPR + Uzbekistan Personal Data Law (29.07.2019 №ЎРҚ-547)
// Version: 1 (key: wewatch_privacy_v1)
// Effective: 2025-01-01

export const PRIVACY_POLICY_VERSION = 'v1';
export const PRIVACY_POLICY_STORAGE_KEY = `wewatch_privacy_${PRIVACY_POLICY_VERSION}`;

export const PRIVACY_POLICY: Record<'uz' | 'ru' | 'en', string> = {

  uz: `WeWatch — Maxfiylik Siyosati
Kuchga kirish sanasi: 1-yanvar 2025-yil

👋  1. Kirish

WeWatch ("biz", "bizning") sizning maxfiyligingizni chuqur hurmat qiladi. Ushbu Maxfiylik Siyosati WeWatch mobil ilovasidan ("Ilova") foydalanishda biz qanday shaxsiy ma'lumotlarni to'plashimiz, ulardan qanday foydalanishimiz, saqlashimiz va himoya qilishimizni tushuntiradi.

Ilovadan foydalanib, siz ushbu Siyosat shartlariga rozilik bildirasiz.

📋  2. Biz to'playdigan ma'lumotlar

2.1. Siz bizga taqdim etadigan ma'lumotlar:
• Foydalanuvchi nomi (taxallus)
• Elektron pochta manzili
• Parol (shifrlangan holda saqlanadi; biz hech qachon parolingizni ko'rmaymiz)
• Profil rasmi (agar yuklab qo'ysangiz)
• Watch Party tarixi va pleylistlar

2.2. Avtomatik to'planadigan ma'lumotlar:
• Push-bildirishnoma tokeni — taklif va voqealar haqida xabar berish uchun
• Qurilma operatsion tizimi turi va versiyasi
• Anonim xato hisobotlari (texnik nosozliklar)
• Oxirgi faollik sanasi va vaqti

2.3. Biz to'PLAMAYDIGAN ma'lumotlar:
• Aniq joylashuv (GPS)
• Telefon kitobi kontaktlari
• Biometrik ma'lumotlar
• Moliyaviy ma'lumotlar yoki bank karta raqamlari

🎯  3. Ma'lumotlardan foydalanish maqsadlari

Biz ma'lumotlaringizdan quyidagi maqsadlarda foydalanamiz:
• Akkaunt yaratish va boshqarish
• Watch Party va sinxron tomosha funksiyalarini ta'minlash
• Watch Party takliflari va qo'llab-quvvatlash javoblari haqida push-bildirishnomalar yuborish
• Firibgarlikni oldini olish va platforma xavfsizligini ta'minlash
• Texnik diagnostika va nosozliklarni bartaraf etish
• Ilovaning funksionalligi va foydalanuvchi tajribasini yaxshilash

🤝  4. Uchinchi tomon xizmatlariga ma'lumot uzatish

Biz ma'lumotlaringizni sotmaymiz va begona maqsadlarda bermaymiz. Faqat ilovaning ishlashi uchun zarur bo'lgan quyidagi ishonchli xizmatlarga ma'lumot uzatiladi:

• MongoDB Atlas — bulutli ma'lumotlar bazasida saqlash
  (mongodb.com/legal/privacy-policy)
• Railway — ilova serverlarini joylash
  (railway.app/legal/privacy)
• Firebase (Google) — push-bildirishnomalar
  (firebase.google.com/support/privacy)
• Sentry — xato hisobotlari (anonim)
  (sentry.io/privacy)
• Google Sign-In — Google orqali autentifikatsiya
  (policies.google.com/privacy)
• Apple Sign In — Apple orqali autentifikatsiya (iOS)
  (apple.com/legal/privacy)

Barcha hamkor-xizmatlar GDPR talablariga muvofiq tekshirilgan.

⏳  5. Ma'lumotlarni saqlash muddati

• Akkaunt ma'lumotlari — akkaunt o'chirilgunga qadar saqlanadi
• Texnik loglar — 90 kundan ko'p bo'lmagan muddatda
• Push-bildirishnoma tokenlari — ilova yoki akkaunt o'chirilgunga qadar
• Watch Party xona ma'lumotlari — xona yopilganidan 60 kun o'tgach

Akkauntni o'chirish (Sozlamalar → Akkauntni o'chirish) orqali barcha ma'lumotlaringiz 30 kun ichida qaytarib bo'lmas tarzda o'chiriladi.

✅  6. Sizning huquqlaringiz

Shaxsiy ma'lumotlaringiz bo'yicha quyidagi huquqlarga egasiz:
• Kirish huquqi — siz haqingizda saqlanadigan ma'lumotlarning nusxasini olish
• To'g'irlash huquqi — noto'g'ri ma'lumotlarni tuzatish
• O'chirish huquqi — ma'lumotlaringizni o'chirish ("unutilish huquqi")
• Qayta ishlashni cheklash huquqi — vaqtincha cheklash
• Ma'lumotlarni ko'chirish huquqi — mashinacha o'qiladigan formatda olish
• E'tiroz bildirish huquqi — qonuniy manfaat asosidagi qayta ishlashga e'tiroz
• Rozilikni qaytarib olish huquqi — istalgan vaqtda bildirishnomalardan voz kechish

Huquqlarni amalga oshirish uchun: support@wewatch.uz
Ilova orqali: Sozlamalar → Qo'llab-quvvatlash → Bizga yozing

O'zbekiston Respublikasida yashovchi foydalanuvchilar "Shaxsiy ma'lumotlar to'g'risida"gi Qonun (29.07.2019 yil, №ЎРҚ-547) bilan himoyalangan.

🔐  7. Ma'lumotlar xavfsizligi

Biz quyidagi himoya choralarini qo'llaymiz:
• Parollarni shifrlash (bcrypt, 12 raund)
• Barcha ulanishlar uchun HTTPS/TLS
• Qisqa muddatli JWT-tokenlar (15 daqiqa)
• Yangilash tokenlari rotatsiyasi (30 kun)
• Qurilmadagi ma'lumotlarni shifrlash (expo-secure-store)

👶  8. Bolalar maxfiyligi

WeWatch 13 va undan katta yoshdagi foydalanuvchilarga mo'ljallangan. Biz 13 yoshdan kichik bolalarning ma'lumotlarini atayin to'plamaymiz. Agar bola shaxsiy ma'lumot taqdim etganini bilsangiz — darhol support@wewatch.uz manziliga murojaat qiling.

🌍  9. Xalqaro ma'lumot uzatish

Sizning ma'lumotlaringiz turli mamlakatlardagi serverlarda qayta ishlanishi mumkin. Biz xalqaro ma'lumot uzatishning GDPR talablariga (Yevropa Ittifoqining Standart Shartnoma Shartlari) va boshqa qo'llaniladigan qonunlarga muvofiqligini ta'minlaymiz.

🔄  10. Siyosatga o'zgartirishlar

Biz ushbu Siyosatni yangilashimiz mumkin. Muhim o'zgarishlar haqida push-bildirishnoma yoki Ilovaga kirishda xabardor qilamiz. O'zgarishlardan so'ng Ilovadan foydalanishni davom ettirishingiz yangilangan Siyosatga roziligingizni bildiradi.

📬  11. Bog'lanish ma'lumotlari

Maxfiylik bo'yicha barcha savollar uchun:
• Email: support@wewatch.uz
• Ilova orqali: Sozlamalar → Qo'llab-quvvatlash → Bizga yozing`,


  ru: `WeWatch — Политика конфиденциальности
Дата вступления в силу: 1 января 2025 г.

👋  1. Введение

WeWatch («мы», «наш», «нас») уважает вашу конфиденциальность. Настоящая Политика конфиденциальности описывает, как мы собираем, используем, храним и защищаем ваши персональные данные при использовании мобильного приложения WeWatch («Приложение»).

Используя Приложение, вы принимаете условия настоящей Политики.

📋  2. Данные, которые мы собираем

2.1. Данные, которые вы предоставляете нам:
• Имя пользователя (никнейм)
• Адрес электронной почты
• Пароль (хранится в зашифрованном виде; мы никогда не видим ваш пароль)
• Фотография профиля (если вы её загружаете)
• История Watch Party: комнаты и плейлисты

2.2. Данные, которые мы собираем автоматически:
• Токен push-уведомлений — для отправки уведомлений о приглашениях и событиях
• Тип и версия операционной системы устройства
• Анонимные отчёты об ошибках (технические сбои)
• Дата и время последней активности

2.3. Данные, которые мы не собираем:
• Точное местоположение (GPS)
• Контакты телефонной книги
• Биометрические данные
• Финансовые данные или данные банковских карт

🎯  3. Цели обработки данных

Мы используем ваши данные для:
• Создания и управления вашим аккаунтом
• Обеспечения работы Watch Party и синхронного просмотра
• Отправки push-уведомлений о приглашениях, обновлениях и ответах поддержки
• Предотвращения мошенничества и обеспечения безопасности платформы
• Технической диагностики и устранения неисправностей
• Улучшения функциональности и пользовательского опыта

⚖️  4. Правовые основания обработки (GDPR)

Для пользователей из Европейского Союза:
• Исполнение договора (ст. 6(1)(b) GDPR) — обработка необходима для предоставления услуг Приложения
• Законный интерес (ст. 6(1)(f) GDPR) — безопасность платформы, предотвращение злоупотреблений
• Согласие (ст. 6(1)(a) GDPR) — push-уведомления (отзывается в настройках устройства)

🤝  5. Передача данных третьим лицам

Мы не продаём ваши данные. Они передаются только следующим проверенным сервисам, без которых работа Приложения невозможна:

• MongoDB Atlas — хранение данных в облачной базе данных
  (mongodb.com/legal/privacy-policy)
• Railway — хостинг серверов приложения
  (railway.app/legal/privacy)
• Firebase (Google) — push-уведомления
  (firebase.google.com/support/privacy)
• Sentry — отчёты об ошибках (анонимно)
  (sentry.io/privacy)
• Google Sign-In — авторизация через Google
  (policies.google.com/privacy)
• Apple Sign In — авторизация через Apple (iOS)
  (apple.com/legal/privacy)

Все указанные партнёры прошли проверку на соответствие требованиям GDPR.

⏳  6. Хранение данных

• Данные аккаунта — до момента удаления аккаунта
• Технические логи — не более 90 дней
• Токены push-уведомлений — до удаления приложения или аккаунта
• Данные комнат Watch Party — 60 дней после закрытия комнаты

При удалении аккаунта (Настройки → Удалить аккаунт) все ваши данные безвозвратно удаляются в течение 30 дней.

✅  7. Ваши права

Вы имеете следующие права в отношении ваших персональных данных:
• Право на доступ — получить копию хранимых данных о вас
• Право на исправление — исправить неточные данные
• Право на удаление — удалить свои данные («право на забвение»)
• Право на ограничение обработки — временно ограничить обработку
• Право на перенос данных — получить данные в машиночитаемом формате
• Право на возражение — возразить против обработки на основании законного интереса
• Право отозвать согласие — в любой момент отозвать согласие на уведомления

Для реализации прав: support@wewatch.uz
Через приложение: Настройки → Поддержка → Написать нам

Пользователи в Узбекистане защищены Законом «О персональных данных» (29.07.2019, №ЎРҚ-547).

🔐  8. Безопасность данных

Мы применяем следующие меры защиты:
• Шифрование паролей (bcrypt, 12 раундов)
• HTTPS/TLS для всех соединений
• JWT-токены с коротким сроком действия (15 минут)
• Ротация токенов обновления (30 дней)
• Шифрование данных на устройстве (expo-secure-store)

👶  9. Защита детей

Приложение WeWatch предназначено для пользователей в возрасте 13 лет и старше. Мы сознательно не собираем данные детей младше 13 лет. Если вам известно, что ребёнок предоставил нам личную информацию — немедленно свяжитесь с нами: support@wewatch.uz

🌍  10. Международная передача данных

Ваши данные могут обрабатываться на серверах в разных странах. Мы обеспечиваем соответствие международной передачи данных требованиям GDPR (Стандартные договорные условия ЕС) и иным применимым законам.

🔄  11. Изменения политики

Мы можем обновлять настоящую Политику. О существенных изменениях вы будете уведомлены через push-уведомление или при следующем входе в Приложение. Продолжение использования Приложения после уведомления означает принятие обновлённой Политики.

📬  12. Контактная информация

По всем вопросам конфиденциальности:
• Email: support@wewatch.uz
• Через Приложение: Настройки → Поддержка → Написать нам`,


  en: `WeWatch — Privacy Policy
Effective Date: January 1, 2025

👋  1. Introduction

WeWatch ("we", "our", "us") respects your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use the WeWatch mobile application ("App").

By using the App, you accept the terms of this Policy.

📋  2. Data We Collect

2.1. Data you provide to us:
• Username (display name)
• Email address
• Password (stored encrypted — we never see your plaintext password)
• Profile photo (if you upload one)
• Watch Party history: rooms and playlists

2.2. Data we collect automatically:
• Push notification token — to send invitations and event notifications
• Device operating system type and version
• Anonymous crash reports (technical errors only)
• Date and time of last activity

2.3. Data we do not collect:
• Precise location (GPS)
• Phone book contacts
• Biometric data
• Financial data or payment card numbers

🎯  3. Purposes of Data Processing

We use your data to:
• Create and manage your account
• Provide Watch Party and synchronized viewing features
• Send push notifications about invitations, updates, and support replies
• Prevent fraud and ensure platform security
• Perform technical diagnostics and troubleshooting
• Improve app functionality and user experience

⚖️  4. Legal Basis for Processing (GDPR)

For users in the European Union:
• Performance of contract (Art. 6(1)(b) GDPR) — processing is necessary to provide App services
• Legitimate interest (Art. 6(1)(f) GDPR) — platform security, abuse prevention
• Consent (Art. 6(1)(a) GDPR) — push notifications (withdraw via device settings)

🤝  5. Data Sharing with Third Parties

We do not sell your data. It is shared only with the following verified services, without which the App cannot function:

• MongoDB Atlas — cloud database storage
  (mongodb.com/legal/privacy-policy)
• Railway — application server hosting
  (railway.app/legal/privacy)
• Firebase (Google) — push notifications
  (firebase.google.com/support/privacy)
• Sentry — error reporting (anonymous)
  (sentry.io/privacy)
• Google Sign-In — authentication via Google
  (policies.google.com/privacy)
• Apple Sign In — authentication via Apple (iOS)
  (apple.com/legal/privacy)

All listed partners have been verified for GDPR compliance.

⏳  6. Data Retention

• Account data — until account deletion
• Technical logs — no more than 90 days
• Push notification tokens — until app or account deletion
• Watch Party room data — 60 days after room closure

Upon account deletion (Settings → Delete Account), all your data is permanently removed within 30 days.

✅  7. Your Rights

You have the following rights regarding your personal data:
• Right of access — receive a copy of data stored about you
• Right of rectification — correct inaccurate data
• Right of erasure — delete your data ("right to be forgotten")
• Right to restriction of processing — temporarily limit processing
• Right to data portability — receive data in machine-readable format
• Right to object — object to processing based on legitimate interest
• Right to withdraw consent — withdraw notification consent at any time

To exercise your rights: support@wewatch.uz
Via the app: Settings → Support → Contact Us

Users in Uzbekistan are protected by the Law on Personal Data (29.07.2019, №ЎРҚ-547).

🔐  8. Data Security

We implement the following security measures:
• Password encryption (bcrypt, 12 rounds)
• HTTPS/TLS for all connections
• Short-lived JWT tokens (15 minutes)
• Refresh token rotation (30 days)
• On-device data encryption (expo-secure-store)

👶  9. Children's Privacy

WeWatch is intended for users aged 13 and older. We do not knowingly collect data from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately: support@wewatch.uz

🌍  10. International Data Transfers

Your data may be processed on servers located in various countries. We ensure that any international data transfer complies with GDPR requirements (EU Standard Contractual Clauses) and other applicable laws.

🔄  11. Changes to This Policy

We may update this Policy. You will be notified of significant changes via push notification or upon next login to the App. Continuing to use the App after notification constitutes acceptance of the updated Policy.

📬  12. Contact Information

For all privacy-related questions:
• Email: support@wewatch.uz
• Via the App: Settings → Support → Contact Us`,
};
