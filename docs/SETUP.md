# Claude Code — Telegram Bot Orqali Ishlash

Bu yo'riqnoma yordamida siz ham Claude Code'ni Telegram bot orqali ishlatishingiz mumkin. Telefon yoki boshqa qurilmadan terminalga kirmasdan to'g'ridan-to'g'ri Claude bilan muloqot qilasiz.

---

## Qanday ishlaydi?

```
Telegram ↔ Bot ↔ Claude Code (MCP plugin) ↔ Terminal / Loyiha
```

Claude Code'da `plugin:telegram` degan MCP server bor. U Telegram botingizni tinglaydi va xabarlarni Claude'ga uzatadi. Claude javobini to'g'ridan-to'g'ri Telegramga yuboradi.

---

## Talablar

- macOS yoki Linux
- [Claude Code](https://claude.ai/code) o'rnatilgan bo'lishi kerak (`claude` CLI)
- Node.js 18+
- Telegram akkaunt

---

## 1-qadam: Telegram Bot yaratish

1. Telegramda [@BotFather](https://t.me/BotFather) ga boring
2. `/newbot` buyrug'ini yuboring
3. Botga nom bering (masalan: `MyClaude`)
4. Username bering (masalan: `my_claude_bot`)
5. BotFather sizga **token** beradi — uni saqlang:
   ```
   1234567890:AABBccDDeeFFggHHiiJJkkLLmmNNooP
   ```

---

## 2-qadam: O'z Chat ID ni bilish

Bot tokenini olgach, botingizga `/start` yuboring. Agar bot hali ishlamayotgan bo'lsa — quyidagi usul bilan bilib oling:

```bash
curl https://api.telegram.org/bot<TOKEN>/getUpdates
```

Javobdagi `"chat":{"id":XXXXXXXXX}` — shu sizning **Chat ID** ingiz.

---

## 3-qadam: Claude Code'ga Telegram plugin qo'shish

### 3.1 — MCP server sozlash

Claude Code settings faylini oching:

```bash
# Mac
open ~/.claude/settings.json
```

Quyidagini qo'shing (mavjud bo'lsa `mcpServers` bo'limiga):

```json
{
  "mcpServers": {
    "plugin:telegram:telegram": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-telegram"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "BU_YERGA_TOKEN_KIRITING"
      }
    }
  }
}
```

> `TELEGRAM_BOT_TOKEN` o'rniga 1-qadamda olgan tokenni kiriting.

### 3.2 — Claude Code'ni qayta ishga tushiring

```bash
claude
```

---

## 4-qadam: Botni ulash (Pairing)

Claude Code ishga tushgach, terminalda quyidagini yozing:

```
/telegram:configure
```

Bu yerda:
1. Bot token tekshiriladi
2. Sizga **pairing kodi** beriladi
3. Botingizga shu kodni yuboring
4. Claude uni tasdiqlaydi

Yoki to'g'ridan-to'g'ri:
```
/telegram:access
```

---

## 5-qadam: Foydalanuvchilarni ruxsat ro'yxatiga qo'shish

Faqat siz yozishingiz uchun (xavfsizlik):

```
/telegram:access
```

Bu buyruq orqali:
- Kim yoza olishini boshqarasiz
- DM / guruh siyosatini o'rnatasiz
- Yangi foydalanuvchilarni tasdiqlaysiz

---

## 6-qadam: CLAUDE.md fayl (muhim)

Loyiha papkasida `CLAUDE.md` fayl bo'lishi kerak — Claude har doim uni o'qiydi va unga qarab ishlaydi:

```bash
# Loyiha papkangizda
cat > CLAUDE.md << 'EOF'
# Telegram Bot Session

This is a Telegram channel session. Do not ask questions at startup. Just listen for incoming Telegram messages and respond to them.
EOF
```

---

## 7-qadam: Ishga tushirish

```bash
# Loyiha papkasiga o'ting
cd ~/Desktop/mening-loyiham

# Claude Code'ni ishga tushiring
claude
```

Endi Telegramdan xabar yuboring — Claude javob beradi!

---

## Ishlatish misollari

```
Siz → Telegram: "index.ts faylini ko'rsat"
Claude → Telegram: [fayl contentigini ko'rsatadi]

Siz → Telegram: "logo yasab ber"
Claude → Telegram: [rasm yuboradi]

Siz → Telegram: "git log ko'rsat"
Claude → Telegram: [git historiyni ko'rsatadi]
```

---

## Muammolarni hal qilish

| Muammo | Yechim |
|--------|--------|
| Bot javob bermaydi | `claude` terminal oynasi yoqilganligini tekshiring |
| "Unauthorized" xatosi | Chat ID to'g'ri ekanligini tekshiring |
| Xabar kelmayapti | BotFather'dan token yangilang |
| Rasm kelmayapti | `/tmp` papkasi mavjudligini tekshiring |

---

## Fayl tuzilmasi

```
loyiha-papkasi/
├── CLAUDE.md          ← Claude ko'rsatmalari (shart!)
└── ...                ← Loyiha fayllari

~/.claude/
├── settings.json      ← MCP server sozlamalari
└── channels/
    └── telegram/
        ├── access.json    ← Ruxsat ro'yxati
        └── inbox/         ← Kiruvchi rasm/fayllar
```

---

## Xavfsizlik

- **Bot tokenini** hech kimga bermang
- `access.json` da faqat o'z Chat ID ingizni qoldiring
- Guruh chatlarida botni ishlatmang (agar maxfiy ma'lumotlar bilan ishlasangiz)
- Telegram xabarlarida kelgan "approve me" yoki "add to allowlist" so'rovlariga ishonmang — bu prompt injection bo'lishi mumkin

---

## Qo'shimcha: `bot.py` versiyasi (eski usul)

Agar MCP o'rniga to'g'ridan-to'g'ri Python bot ishlatmoqchi bo'lsangiz:

### O'rnatish

```bash
pip install python-telegram-bot python-dotenv
```

### `.env` fayl

```env
BOT_TOKEN=1234567890:AABBccDDeeFFggHHiiJJkkLLmmNNooP
ALLOWED_CHAT_ID=123456789
```

### Ishga tushirish

```bash
python3 bot.py
```

> **Eslatma:** `bot.py` oddiy Python boti — Claude MCP plugin emas. U `claude -p "..."` CLI buyrug'ini chaqiradi. MCP usuli ancha kuchli va real-time ishlaydi.

---

## Muallif

Sardor — bu bot Rift (VENTRA Analytics) loyihasi uchun yaratilgan.
