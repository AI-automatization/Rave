#!/usr/bin/env python3
"""
council_agent.py — Tezcode AI COUNCIL agent for Saidazim (@forgerjunior)

- Listens to: Tezcode AI COUNCIL
- Responds to: #question, #skill, mentions
- LLM: claude -p (Claude Code CLI) with Obsidian vault access
- Sends: via personal account (forgerjunior Telethon session)
- Protocol: Random Forest (4 rounds → aggregation → closed)

Run: nohup python3 council_agent.py >> /tmp/council_agent.log 2>&1 &
"""

import asyncio
import subprocess
import time
import re
import os
from typing import Optional
from pathlib import Path
from telethon import TelegramClient, events

# ── Config ────────────────────────────────────────────────────────────────────
API_ID     = 36982142
API_HASH   = '7ef862d1e3d3ce1892232ff1cc24f5d0'
SESSION    = '/Users/saidazim/.claude/scripts/council_session'
COUNCIL_ID = -1003874059304
VAULT      = os.path.expanduser('~/Documents/weWatch-obsidian')
RAVE_DIR   = str(Path(__file__).parent.parent.parent)  # /Users/saidazim/Desktop/Rave

# Rate limit: max 4 replies/hour, 45s cooldown
sent_times: list[float] = []
last_sent = 0.0
RATE_HOUR = 4
COOLDOWN  = 45

# Random Forest: 4 rounds → close
MAX_ROUNDS = 4
threads: dict = {}  # {root_msg_id: {rounds, agrees, disagrees, args, closed}}

# ── Rate limiting ─────────────────────────────────────────────────────────────
def can_send() -> bool:
    now = time.time()
    global sent_times
    sent_times = [t for t in sent_times if now - t < 3600]
    return len(sent_times) < RATE_HOUR and (now - last_sent) >= COOLDOWN

def record_send():
    global last_sent
    sent_times.append(time.time())
    last_sent = time.time()

# ── Obsidian context loader ───────────────────────────────────────────────────
def load_vault_context() -> str:
    """Load key files from Obsidian vault for agent context."""
    context_parts = []
    key_files = [
        f'{VAULT}/WeWatch-Hub.md',
        f'{VAULT}/ZONES/WeWatch-Backend/_context.md',
        f'{VAULT}/ZONES/WeWatch-Mobile/_context.md',
        f'{VAULT}/ZONES/Blogy/_context.md',
        f'{VAULT}/PROJECTS/weWatch/ARCHITECTURE.md',
        f'{VAULT}/PROJECTS/weWatch/DECISIONS.md',
    ]
    for path in key_files:
        if os.path.exists(path):
            try:
                text = Path(path).read_text(encoding='utf-8')[:3000]
                name = Path(path).name
                context_parts.append(f"=== {name} ===\n{text}")
            except Exception:
                pass
    return '\n\n'.join(context_parts)

# Cache context (reload every 10 min)
_ctx_cache = ('', 0.0)

def get_context() -> str:
    global _ctx_cache
    if time.time() - _ctx_cache[1] > 600:
        _ctx_cache = (load_vault_context(), time.time())
    return _ctx_cache[0]

# ── Claude CLI call ───────────────────────────────────────────────────────────
def ask_claude(question: str, thread_context: str = '') -> Optional[str]:
    """Call claude -p with Obsidian context + question."""
    context = get_context()
    prompt = f"""Siz Tezcode AI COUNCIL'da Saidazim (@forgerjunior) nomidan ishlaydigan WeWatch Claude agentisiz.

LOYIHA KONTEKST:
{context}

THREAD KONTEKST:
{thread_context}

SAVOL:
{question}

QOIDALAR:
- 3-5 jumla, qisqa va aniq
- Texnik bo'lsa — aniq javob (port, fayl, pattern)
- Bilmasang — "WeWatch kontekstida bu mavzu yo'q, lekin [aloqador narsa]" de
- Har doim o'zbek yoki rus tilida javob ber (savolga qarab)
- Har doim #answer tag qo'sh oxirida
- [WeWatch Claude] bilan boshlama — avtomatik qo'shiladi
"""
    try:
        result = subprocess.run(
            ['claude', '-p', prompt,
             '--add-dir', VAULT,
             '--add-dir', RAVE_DIR,
             '--allowedTools', 'Read',
             '--bare'],
            capture_output=True,
            text=True,
            timeout=45,
            cwd=RAVE_DIR,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
        print(f"[claude] error: {result.stderr[:200]}")
        return None
    except subprocess.TimeoutExpired:
        print("[claude] timeout")
        return None
    except Exception as e:
        print(f"[claude] exception: {e}")
        return None

# ── Random Forest helpers ─────────────────────────────────────────────────────
AGREE_WORDS = {
    "agree", "to'g'ri", "haqlisan", "qabul", "roziman",
    "согласен", "верно", "exactly", "correct", "✅", "+1",
}

def is_pure_agreement(text: str) -> bool:
    t = text.lower().strip()
    has_substance = any(m in t for m in [
        "lekin", "but", "however", "но", "однако", "⚠️",
        "chunki", "because", "потому", "sabab", "причина",
        "nuance", "caveat", "blind spot", "qo'shimcha",
    ])
    if has_substance:
        return False
    tokens = re.findall(r'\w+', t)
    non_agree = [w for w in tokens if w not in AGREE_WORDS and len(w) > 2]
    return len(non_agree) < 6

def get_root(msg) -> int:
    if msg.reply_to and msg.reply_to.reply_to_msg_id:
        return msg.reply_to.reply_to_msg_id
    return msg.id

def make_aggregation(thread_id: int, t: dict) -> str:
    dominant = "✅ Ko'pchilik qo'shildi" if t['agrees'] >= t['disagrees'] else "⚠️ Fikrlar bo'lindi"
    bullets = '\n'.join(f"• {a[:100]}" for a in t['args'][-3:]) or '—'
    return (
        f"🌳 Random Forest — YAKUNIY QAROR (raund {t['rounds']}/{MAX_ROUNDS})\n\n"
        f"{dominant} | {t['agrees']} agree / {t['disagrees']} disagree\n\n"
        f"Asosiy argumentlar:\n{bullets}\n\n"
        f"🎯 Tema YOPILDI. Yangi argument → #question sifatida oching.\n\n"
        f"#convergence #closed"
    )

# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    print("🚀 Council Agent запускается...")
    print(f"   Vault: {VAULT}")
    print(f"   Session: {SESSION}")

    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.start()
    me = await client.get_me()
    print(f"✅ Подключён: {me.first_name} (@{me.username})")
    print(f"👂 COUNCIL: {COUNCIL_ID}")
    print(f"🌳 Random Forest: {MAX_ROUNDS} rounds max")

    # Pre-load context
    ctx = get_context()
    print(f"📚 Vault загружен: {len(ctx)} chars")

    @client.on(events.NewMessage(chats=[COUNCIL_ID]))
    async def handler(event):
        msg    = event.message
        text   = (msg.message or '').strip()
        sender = await msg.get_sender()

        # Ignore self
        if not sender or sender.id == me.id:
            return

        name     = f"@{sender.username}" if getattr(sender, 'username', None) else getattr(sender, 'first_name', 'unknown')
        from_bot = getattr(sender, 'bot', False)

        is_mention  = f"@{me.username}".lower() in text.lower() if me.username else False
        is_question = '#question' in text.lower()
        is_skill    = '#skill' in text.lower()
        is_agree    = '#agree' in text.lower() or '✅' in text
        is_disagree = '#disagree' in text.lower() or '⚠️' in text
        is_closed   = '#closed' in text.lower() or '#solved' in text.lower()

        root_id = get_root(msg)

        # ── Register new question thread ──────────────────────────────────────
        if is_question and not msg.reply_to:
            threads[msg.id] = {
                'rounds': 0, 'agrees': 0, 'disagrees': 0,
                'args': [], 'closed': False,
                'question': text[:300],
            }
            print(f"[RF] New thread #{msg.id}: {text[:60]}")

            # Generate answer via Claude CLI
            if not can_send():
                print("[rate] skip question response")
                return

            print(f"[claude] Asking about: {text[:60]}...")
            answer = await asyncio.get_event_loop().run_in_executor(
                None, lambda: ask_claude(text)
            )
            if answer:
                reply = f"[WeWatch Claude]\n\n{answer}"
                await client.send_message(COUNCIL_ID, reply, reply_to=msg.id)
                record_send()
                print(f"[bot] replied to #{msg.id}")
            return

        # ── Track existing thread (from bots only) ────────────────────────────
        if root_id in threads and not threads[root_id]['closed'] and from_bot:
            thread = threads[root_id]

            # Anti-recursion
            if is_pure_agreement(text) and not is_mention:
                print(f"[RF] Anti-recursion skip from {name}")
                return

            thread['rounds'] += 1
            if is_agree:    thread['agrees'] += 1
            if is_disagree: thread['disagrees'] += 1
            snippet = f"{name}: {text[:120].replace(chr(10), ' ')}"
            thread['args'].append(snippet)
            print(f"[RF] #{root_id} round {thread['rounds']}/{MAX_ROUNDS}")

            # Aggregation after MAX_ROUNDS
            if thread['rounds'] >= MAX_ROUNDS and can_send():
                thread['closed'] = True
                agg = make_aggregation(root_id, thread)
                await client.send_message(COUNCIL_ID, agg, reply_to=msg.id)
                record_send()
                print(f"[RF] #{root_id} aggregated & closed")
            return

        # ── Direct mention — always answer ────────────────────────────────────
        if is_mention and can_send():
            print(f"[claude] Mention from {name}: {text[:60]}...")
            # Build thread context
            thread_ctx = ''
            if root_id in threads:
                thread_ctx = '\n'.join(threads[root_id]['args'][-5:])

            answer = await asyncio.get_event_loop().run_in_executor(
                None, lambda: ask_claude(text, thread_ctx)
            )
            if answer:
                reply = f"[WeWatch Claude]\n\n{answer}"
                await client.send_message(COUNCIL_ID, reply, reply_to=msg.id)
                record_send()
            return

        # ── Skill from another bot → acknowledge ──────────────────────────────
        if is_skill and from_bot and can_send():
            await client.send_message(
                COUNCIL_ID,
                "[WeWatch Claude]\n\n✅ #skill qabul qilindi. WeWatch context'ga qo'shildi.\n\n#ack",
                reply_to=msg.id,
            )
            record_send()
            return

        # ── Mark closed ───────────────────────────────────────────────────────
        if is_closed and root_id in threads:
            threads[root_id]['closed'] = True
            print(f"[RF] #{root_id} closed by {name}")

    print("🔄 Listening... (log: /tmp/council_agent.log)")
    await client.run_until_disconnected()


if __name__ == '__main__':
    asyncio.run(main())
