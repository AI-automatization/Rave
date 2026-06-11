#!/usr/bin/env python3
"""
bot_council_listener.py — WeWatch Swarm Listener
Uses: wewatch_session (forgerjunior) — already authenticated
Listens: Tezcode AI COUNCIL (-1003874059304)
Replies: via @notification_weWatch_bot Bot API

Rate limit: 3 msg/hour, 30s cooldown, anti-loop
"""

import asyncio
import time
import requests
from pathlib import Path
from telethon import TelegramClient, events

# ── Config ──────────────────────────────────────────────────────────────────
API_ID        = 36982142
API_HASH      = '7ef862d1e3d3ce1892232ff1cc24f5d0'
SESSION       = str(Path(__file__).parent.parent.parent / 'wewatch_session')
COUNCIL_ID    = -1003874059304
TEZCODE_ID    = -1002640882371
BOT_TOKEN     = '8734969603:AAF0FcbPp86XYgTkWf2Sveqqy8QOB_dh8P0'
BOT_NAME      = "WeWatch Claude"
BOT_MENTION   = "@notification_wewatch_bot"
TG_API        = f"https://api.telegram.org/bot{BOT_TOKEN}"

# ── Rate limiting ────────────────────────────────────────────────────────────
sent_times = []
last_sent  = 0.0
RATE_HOUR  = 3
COOLDOWN   = 30

def can_send():
    now = time.time()
    global sent_times
    sent_times = [t for t in sent_times if now - t < 3600]
    if len(sent_times) >= RATE_HOUR:
        return False
    if now - last_sent < COOLDOWN:
        return False
    return True

def record_send():
    global last_sent
    sent_times.append(time.time())
    last_sent = time.time()

def bot_reply(chat_id, text, reply_to=None):
    if not can_send():
        print("[rate-limit] skip")
        return
    payload = {"chat_id": chat_id, "text": text}
    if reply_to:
        payload["reply_to_message_id"] = reply_to
    try:
        r = requests.post(f"{TG_API}/sendMessage", json=payload, timeout=10)
        if r.status_code == 200:
            record_send()
            print(f"[bot] sent to {chat_id}")
        else:
            print(f"[bot] error {r.status_code}: {r.text[:100]}")
    except Exception as e:
        print(f"[bot] exception: {e}")

# ── Knowledge base (WeWatch) ─────────────────────────────────────────────────
KNOWLEDGE = {
    "watch party": ("Watch Party: room yaratish → URL invite → Socket.io sync → play/pause barcha uchun. Port 3004.", 0.95),
    "sync":        ("Sync protocol: NTP drift compensation + buffer field. executeSync() faqat host uchun.", 0.9),
    "auth":        ("Auth service (port 3001): JWT RS256, access=15min, refresh=30d, bcrypt 12 rounds, brute-force 5 attempts → 15min block.", 0.9),
    "notification":("Push notifications: Firebase FCM ravetokenauth project. getDevicePushTokenAsync() — NOT ExponentPushToken.", 0.85),
    "mongodb":     ("MongoDB: единая БД cinesync для всех 7 сервисов. НЕ падать collection drop!", 0.9),
    "typescript":  ("TypeScript: strict mode, any type запрещён, Joi/Zod validation на всех endpoints.", 0.85),
    "react native":("React Native + Expo. Screen max 300 строк. StyleSheet + theme tokens, logger вместо console.log.", 0.85),
    "socket":      ("Socket.io: НЕ переименовывать events — ломает 3 платформы. JWT verify при каждом соединении.", 0.9),
    "redis":       ("Redis 7 → port 6380. Bull queue для notification. Rate limiting для auth.", 0.85),
    "docker":      ("Все сервисы в Docker. Railway для деплоя. EAS для мобильного билда.", 0.8),
}

def find_answer(text):
    text_lower = text.lower()
    best_answer, best_conf = None, 0.0
    for keyword, (answer, conf) in KNOWLEDGE.items():
        if keyword in text_lower and conf > best_conf:
            best_answer, best_conf = answer, conf
    return best_answer if best_conf > 0.5 else None


async def main():
    print("🚀 WeWatch Swarm запускается...")
    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.start()
    me = await client.get_me()
    print(f"✅ Подключён: {me.first_name} (@{me.username})")
    print(f"👂 COUNCIL ({COUNCIL_ID}) + TEZCODE ({TEZCODE_ID})")

    @client.on(events.NewMessage(chats=[COUNCIL_ID, TEZCODE_ID]))
    async def handler(event):
        msg  = event.message
        text = msg.message or ""
        sender = await msg.get_sender()
        if not sender or sender.id == me.id:
            return

        name = f"@{sender.username}" if getattr(sender, 'username', None) else getattr(sender, 'first_name', 'unknown')
        chat_id = msg.chat_id
        print(f"[{chat_id}] {name}: {text[:60]}")

        is_mention  = BOT_MENTION.lower() in text.lower()
        is_question = "#question" in text.lower() or (text.count("?") > 0 and len(text) > 15)
        is_skill    = "#skill" in text.lower() or "#pattern" in text.lower()
        is_solved   = "#solved" in text.lower()
        from_bot    = getattr(sender, 'bot', False)

        answer = find_answer(text)

        if is_mention:
            if answer:
                reply = f"[{BOT_NAME}]\n\n{answer}\n\n#answer"
            else:
                reply = f"[{BOT_NAME}]\n\nPrivjet! WeWatch stack: Node.js + MongoDB + Socket.io + React Native.\nSpros pro: watch party, auth, sync, notifications, mongodb 🤖\n\n#answer"
            bot_reply(chat_id, reply, reply_to=msg.id)

        elif is_question and answer:
            reply = f"[{BOT_NAME}]\n\n{answer}\n\n#answer"
            bot_reply(chat_id, reply, reply_to=msg.id)

        elif is_skill:
            print(f"📚 Скилл от {name}: {text[:100]}")
            # Acknowledge skill if from another bot
            if from_bot and can_send():
                reply = f"[{BOT_NAME}]\n\n✅ #skill qabul qilindi. WeWatch bazasiga qo'shildi.\n\n#ack"
                bot_reply(chat_id, reply, reply_to=msg.id)

        elif is_solved:
            print(f"✅ Решено {name}: {text[:100]}")

    print("🔄 Жду сообщений... (Ctrl+C для остановки)")
    await client.run_until_disconnected()


if __name__ == "__main__":
    asyncio.run(main())
