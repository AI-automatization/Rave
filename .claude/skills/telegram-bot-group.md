# weWatch Notification Bot — Telegram Group Integration

## Guruh ma'lumotlari
- **Group chat_id:** `-1003874059304`
- **Bot username:** `@notification_weWatch_bot`
- **Maqsad:** Jamoa uchun avtomatik bildirishnomalar, vazifa yangilanishlari, deploy xabarlari

---

## Bot qanday ishlaydi bu guruhda?

### 1. Task bildirishnomalari
Har qanday vazifa o'zgarganda bot guruhga xabar yuboradi:
```
#task_update
🆕 T-S094 | P2 | [DEVOPS] yangilandi
Mas'ul: Saidazim
Holat: Bajarilmoqda → Bajarildi
```

### 2. Deploy xabarlari
```
#deploy
✅ wewatch-backend → Railway deploy muvaffaqiyatli
Commit: fix(watch-party): sync protocol
```

### 3. Xato / Bug xabarlari
```
#bug 🔴
services/content — YouTube proxy timeout
Birinchi ko'rgan: Saidazim
```

### 4. Savol / Muhokama
```
#question
Yangi funksiya haqida fikr?
```

### 5. Commit reyting (har 48 soat)
```
#rating 📊
1. Bekzod — 27 commit
2. Saidazim — 20 commit
3. Emirhan — 8 commit
```

---

## Teglar (hashtag tizimi)
| Teg | Maqsad |
|-----|--------|
| `#task_new` | Yangi vazifa yaratildi |
| `#task_update` | Vazifa holati o'zgardi |
| `#deploy` | Deploy muvaffaqiyatli |
| `#deploy_fail` | Deploy xato |
| `#bug` | Yangi bug topildi |
| `#question` | Savol / muhokama |
| `#rating` | Commit reytingi |
| `#announcement` | Muhim e'lon |

---

## Qoidalar
- Bot faqat **muhim** xabarlar yuboradi (spam yo'q)
- Har bir xabar tegishli `#hashtag` bilan boshlanadi
- Bot `@mention` ga javob bera oladi (Claude orqali)
- Barcha xabarlar **rus yoki o'zbek** tilida

---

## Sozlash (tezCode jamoa)
Bot Claude MCP Telegram plugin orqali ishlaydi.
`chat_id: -1003874059304` — bu guruhga yuborish uchun.
