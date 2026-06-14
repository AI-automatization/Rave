#!/usr/bin/env python3
"""
bot_council_listener.py — WeWatch Swarm Listener
Uses: wewatch_session (forgerjunior) — already authenticated
Listens: Tezcode AI COUNCIL (-1003874059304)
Replies: via @notification_weWatch_bot Bot API

Rate limit: 3 msg/hour, 30s cooldown, anti-loop
Random Forest Protocol: 4 rounds → aggregation → topic closed
"""

import asyncio
import time
import re
from pathlib import Path
from telethon import TelegramClient, events

# ── Config ──────────────────────────────────────────────────────────────────
API_ID        = 36982142
API_HASH      = '7ef862d1e3d3ce1892232ff1cc24f5d0'
SESSION       = str(Path(__file__).parent.parent.parent / 'wewatch_session')
COUNCIL_ID    = -1003874059304
TEZCODE_ID    = -1002640882371
BOT_NAME      = "WeWatch Claude"
BOT_MENTION   = "@notification_wewatch_bot"

# ── Rate limiting ────────────────────────────────────────────────────────────
sent_times = []
last_sent  = 0.0
RATE_HOUR  = 4
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

async def bot_reply(client, chat_id, text, reply_to=None):
    if not can_send():
        print("[rate-limit] skip")
        return False
    try:
        await client.send_message(
            chat_id,
            text,
            reply_to=reply_to,
        )
        record_send()
        print(f"[bot] sent to {chat_id} (personal account)")
        return True
    except Exception as e:
        print(f"[bot] exception: {e}")
        return False

# ── Random Forest Protocol ───────────────────────────────────────────────────
MAX_ROUNDS = 4

# threads: {root_msg_id: {rounds, participants, agrees, disagrees, closed, last_args}}
threads = {}

AGREE_WORDS = {
    "agree", "#agree", "to'g'ri", "haqlisan", "qabul", "roziman",
    "согласен", "верно", "правильно", "exactly", "correct", "yes",
    "✅", "+1", "👍",
}

def is_just_agreement(text):
    """True if message is pure agreement without new argument (anti-recursion)."""
    t = text.lower().strip()
    # Strip common agree words and check if anything substantial remains
    tokens = re.findall(r'\w+', t)
    non_agree = [tok for tok in tokens if tok not in AGREE_WORDS and len(tok) > 2]
    # Also check for structural indicators of a real argument
    has_argument = any(marker in t for marker in [
        "lekin", "but", "however", "но", "однако", "caveat",
        "⚠️", "blind spot", "nuance", "qo'shimcha", "дополнение",
        "chunki", "because", "потому", "sabab", "причина",
    ])
    if has_argument:
        return False
    # If fewer than 6 substantive tokens — probably just agreement
    return len(non_agree) < 6

def get_root_id(msg):
    """Get thread root message ID."""
    if msg.reply_to and msg.reply_to.reply_to_msg_id:
        return msg.reply_to.reply_to_msg_id
    return msg.id

def aggregate_thread(thread_id, rounds, agrees, disagrees, last_args):
    """Generate 🎯 YAKUNIY QAROR aggregation message."""
    total = agrees + disagrees
    dominant = "consensus" if agrees >= disagrees else "split"

    if dominant == "consensus":
        verdict = "✅ Ko'pchilik qo'shildi"
    else:
        verdict = "⚠️ Fikrlar bo'lindi"

    summary_lines = []
    for arg in last_args[-3:]:
        if arg.strip():
            summary_lines.append(f"• {arg[:120]}")

    summary = "\n".join(summary_lines) if summary_lines else "— (asosiy nuqtalar yuqorida)"

    return (
        f"🌳 <b>Random Forest — YAKUNIY QAROR</b> (raund {rounds}/{MAX_ROUNDS})\n\n"
        f"{verdict} | {agrees} agree / {disagrees} disagree\n\n"
        f"<b>Asosiy argumentlar:</b>\n{summary}\n\n"
        f"🎯 Tema YOPILDI. Yangi argument bo'lsa → #question sifatida oching.\n\n"
        f"#convergence #closed"
    )

# ── Knowledge base (WeWatch) ─────────────────────────────────────────────────
KNOWLEDGE = {
    "watch party": ("Watch Party: room yaratish → URL invite → Socket.io sync → play/pause barcha uchun. Port 3004.", 0.95),
    "sync":        ("Sync protocol: NTP drift compensation + buffer field. executeSync() faqat host uchun.", 0.9),
    "auth":        ("Auth service (port 3001): JWT RS256, access=15min, refresh=30d, bcrypt 12 rounds, brute-force 5 attempts → 15min block.", 0.9),
    "notification":("Push notifications: Firebase FCM. getDevicePushTokenAsync() — NOT ExponentPushToken.", 0.85),
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
    print("🚀 WeWatch Swarm запускается (Random Forest Protocol)...")
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

        name     = f"@{sender.username}" if getattr(sender, 'username', None) else getattr(sender, 'first_name', 'unknown')
        chat_id  = msg.chat_id
        from_bot = getattr(sender, 'bot', False)
        print(f"[{chat_id}] {name}: {text[:60]}")

        is_mention  = BOT_MENTION.lower() in text.lower()
        is_question = "#question" in text.lower() or (text.count("?") > 1 and len(text) > 20)
        is_skill    = "#skill" in text.lower() or "#pattern" in text.lower()
        is_solved   = "#solved" in text.lower() or "#closed" in text.lower()
        is_agree    = "#agree" in text.lower() or "✅" in text
        is_disagree = "#disagree" in text.lower() or "⚠️" in text

        answer = find_answer(text)

        # ── Random Forest: thread tracking ──────────────────────────────────
        root_id = get_root_id(msg)

        # Register new question thread
        if is_question and not msg.reply_to:
            threads[msg.id] = {
                "rounds": 0,
                "participants": set(),
                "agrees": 0,
                "disagrees": 0,
                "closed": False,
                "last_args": [],
            }
            print(f"[RF] New thread #{msg.id}")

        # Track existing thread activity
        elif root_id in threads and not threads[root_id]["closed"] and from_bot:
            thread = threads[root_id]

            # Anti-recursion: skip pure agreements
            if is_just_agreement(text) and not is_mention:
                print(f"[RF] Anti-recursion: skip pure agreement from {name}")
                return

            # Count this as a real round
            thread["rounds"] += 1
            thread["participants"].add(name)
            if is_agree:
                thread["agrees"] += 1
            if is_disagree:
                thread["disagrees"] += 1

            # Store argument snippet
            snippet = text[:150].strip().replace("\n", " ")
            thread["last_args"].append(f"{name}: {snippet}")

            print(f"[RF] Thread #{root_id} round {thread['rounds']}/{MAX_ROUNDS}")

            # Aggregation: after MAX_ROUNDS, close the thread
            if thread["rounds"] >= MAX_ROUNDS:
                thread["closed"] = True
                agg = aggregate_thread(
                    root_id,
                    thread["rounds"],
                    thread["agrees"],
                    thread["disagrees"],
                    thread["last_args"],
                )
                await bot_reply(client, chat_id, agg, reply_to=msg.id)
                return

        # ── Mention: always respond ──────────────────────────────────────────
        if is_mention:
            if answer:
                reply = f"[{BOT_NAME}]\n\n{answer}\n\n#answer"
            else:
                reply = (
                    f"[{BOT_NAME}]\n\n"
                    f"WeWatch stack: Node.js + MongoDB + Socket.io + React Native + Expo.\n"
                    f"Savol: watch party, auth, sync, notifications, redis? 🤖\n\n"
                    f"#answer"
                )
            await bot_reply(client, chat_id, reply, reply_to=msg.id)

        # ── Question with known answer ───────────────────────────────────────
        elif is_question and answer:
            reply = f"[{BOT_NAME}]\n\n{answer}\n\n#answer"
            await bot_reply(client, chat_id, reply, reply_to=msg.id)

        # ── Skill acknowledgement ────────────────────────────────────────────
        elif is_skill and from_bot and can_send():
            reply = f"[{BOT_NAME}]\n\n✅ #skill qabul qilindi. WeWatch bazasiga qo'shildi.\n\n#ack"
            await bot_reply(client, chat_id, reply, reply_to=msg.id)

        elif is_solved:
            # Mark thread closed if we know it
            if root_id in threads:
                threads[root_id]["closed"] = True
            print(f"✅ Closed by {name}: {text[:60]}")

    print("🔄 Жду сообщений... (Ctrl+C для остановки)")
    await client.run_until_disconnected()


if __name__ == "__main__":
    asyncio.run(main())
