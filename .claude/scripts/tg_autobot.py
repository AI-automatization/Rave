#!/usr/bin/env python3
"""
tg_autobot.py — TezCode Telegram monitor (Telethon)

Modes:
  --history N         Read last N days from tezCode group → formatted Claude summary
  --watch             Background daemon: write new messages to ~/tg_messages.log
  --session-report    Report messages received since ~/tg_session_start.time

Config: ~/.config/tg_autobot/config.env
  TG_API_ID=12345678
  TG_API_HASH=abcdef1234567890abcdef1234567890
  TG_PHONE=+998901234567
  TG_GROUP=tezCode       (group name, username, or numeric ID like -1001234567890)

Setup: bash .claude/scripts/tg-setup.sh
"""

import asyncio
import os
import sys
import re
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── Config paths ───────────────────────────────────────────────────────────────
CONFIG_FILE      = Path.home() / '.config' / 'tg_autobot' / 'config.env'
SESSION_FILE     = str(Path.home() / '.tg_autobot_session')
LOG_FILE         = Path.home() / 'tg_messages.log'
SESSION_LOG_FILE = Path.home() / 'tg_session.log'
SESSION_START_TS = Path.home() / '.tg_session_start.time'
PID_FILE         = Path.home() / '.tg_watch.pid'
VAULT            = Path(os.environ.get('OBSIDIAN_VAULT', str(Path.home() / 'Documents' / 'Obsidian Vault')))

# ── Importance keywords ────────────────────────────────────────────────────────
URGENT   = ['срочно','urgent','critical','краш','crash','падает','сломалось','asap','kritik','shoshilinch','важно','СРОЧНО']
TASK     = ['нужно','сделай','задача','task','сделать','исправь','fix','добавь','реализуй','kerak','qil','bajar']
BUG      = ['баг','ошибка','bug','error','exception','не работает','сломан','xato','ishlamaydi','muammo']
DEPLOY   = ['деплой','deploy','production','релиз','release','prod','server','сервер','chiqar']
MENTIONS = ['saidazim','саидазим','backend','бэкенд','api','сервер backend','back-end']
TEAM     = ['бекзод','bekzod','abubakir','diyor','диёр','sardor','сардор','akmal','акмал']


def load_config() -> dict:
    cfg = {}
    if not CONFIG_FILE.exists():
        return cfg
    for line in CONFIG_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            cfg[k.strip()] = v.strip()
    return cfg


def importance_score(text: str) -> tuple[int, list[str]]:
    """Score 0-10, return (score, tags)."""
    low = text.lower()
    score = 0
    tags = []

    for kw in URGENT:
        if kw.lower() in low:
            score += 4
            tags.append('⚠️ URGENT')
            break
    for kw in BUG:
        if kw.lower() in low:
            score += 3
            tags.append('🐛 BUG')
            break
    for kw in TASK:
        if kw.lower() in low:
            score += 2
            tags.append('📋 TASK')
            break
    for kw in DEPLOY:
        if kw.lower() in low:
            score += 2
            tags.append('🚀 DEPLOY')
            break
    for kw in MENTIONS:
        if kw.lower() in low:
            score += 3
            tags.append('👤 MENTION')
            break

    return min(score, 10), tags


def format_msg_line(dt: datetime, sender: str, text: str, tags: list[str]) -> str:
    ts = dt.strftime('%Y-%m-%d %H:%M')
    tag_str = ' '.join(tags) + ' ' if tags else ''
    text_short = text[:200].replace('\n', ' ')
    return f"[{ts}] TEZCODE | {tag_str}{sender}: {text_short}"


async def fetch_history(days: int, important_only: bool = False):
    """Fetch last `days` days from tezCode group, print formatted summary."""
    try:
        from telethon import TelegramClient
        from telethon.tl.types import User, Chat, Channel
    except ImportError:
        print("⚠️  telethon не установлен. Запусти: bash .claude/scripts/tg-setup.sh")
        return

    cfg = load_config()
    required = ['TG_API_ID', 'TG_API_HASH', 'TG_PHONE', 'TG_GROUP']
    missing = [k for k in required if not cfg.get(k)]
    if missing:
        print(f"⚠️  tg_config не заполнен: {', '.join(missing)}")
        print(f"    Файл: {CONFIG_FILE}")
        return

    client = TelegramClient(SESSION_FILE, int(cfg['TG_API_ID']), cfg['TG_API_HASH'])
    try:
        await client.start(phone=cfg['TG_PHONE'])
    except Exception as e:
        print(f"⚠️  Telegram auth failed: {e}")
        await client.disconnect()
        return

    group_id = cfg['TG_GROUP']
    try:
        group_id = int(group_id)
    except ValueError:
        pass

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    messages = []

    try:
        # For private groups (no username) find entity via dialogs
        entity = None
        if isinstance(group_id, int):
            async for dialog in client.iter_dialogs():
                if dialog.entity.id == group_id:
                    entity = dialog.entity
                    break
        if entity is None:
            entity = await client.get_entity(group_id)
        async for msg in client.iter_messages(entity, offset_date=None, reverse=False):
            if msg.date < cutoff:
                break
            if not msg.text:
                continue
            sender_name = 'Unknown'
            try:
                if msg.sender:
                    s = msg.sender
                    if hasattr(s, 'first_name'):
                        sender_name = (s.first_name or '') + (' ' + s.last_name if s.last_name else '')
                        sender_name = sender_name.strip() or s.username or 'Unknown'
                    elif hasattr(s, 'title'):
                        sender_name = s.title
            except Exception:
                pass

            score, tags = importance_score(msg.text)
            messages.append({
                'dt': msg.date,
                'sender': sender_name,
                'text': msg.text,
                'score': score,
                'tags': tags,
                'line': format_msg_line(msg.date.astimezone(), sender_name, msg.text, tags)
            })
    except Exception as e:
        print(f"⚠️  Ошибка чтения группы '{cfg['TG_GROUP']}': {e}")
        await client.disconnect()
        return

    await client.disconnect()

    if not messages:
        print(f"📭 Нет сообщений за последние {days} дней в группе '{cfg['TG_GROUP']}'")
        return

    # Sort chronologically (oldest first)
    messages.sort(key=lambda m: m['dt'])

    important = [m for m in messages if m['score'] >= 4]
    mentions  = [m for m in messages if '👤 MENTION' in m['tags']]
    total     = len(messages)

    print(f"━━━ 💬 TEZCODE — последние {days} дн. ━━━")
    print(f"📊 Всего: {total} сообщ. | Важных: {len(important)} | Упоминаний: {len(mentions)}")
    print()

    if important:
        print("⚠️  ВАЖНЫЕ (требуют внимания):")
        for m in important:
            print(f"  {m['line']}")
        print()

    if mentions and not important:
        print("👤 УПОМИНАНИЯ:")
        for m in mentions:
            print(f"  {m['line']}")
        print()

    if not important_only:
        recent = messages[-15:]
        print(f"💬 ПОСЛЕДНИЕ {len(recent)} СООБЩЕНИЙ:")
        for m in recent:
            print(f"  {m['line']}")
        print()

    # Auto-save critical to Obsidian
    critical = [m for m in important if m['score'] >= 7]
    if critical:
        _save_critical_to_obsidian(critical, cfg.get('TG_GROUP', 'tezCode'))


def _save_critical_to_obsidian(messages: list, group: str):
    """Save high-priority messages to Obsidian vault."""
    tg_file = VAULT / 'PROJECTS' / 'tezCode' / '_telegram.md'
    if not tg_file.parent.exists():
        return
    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    block = f"\n### 🔥 {now} — Критичные ({len(messages)} шт.)\n"
    for m in messages:
        block += f"- {m['line']}\n"
    try:
        with open(tg_file, 'a', encoding='utf-8') as f:
            f.write(block)
    except Exception:
        pass


async def watch_mode():
    """Daemon: write new messages to ~/tg_messages.log and ~/tg_session.log."""
    try:
        from telethon import TelegramClient, events
    except ImportError:
        print("⚠️  telethon не установлен. Запусти: bash .claude/scripts/tg-setup.sh")
        return

    cfg = load_config()
    required = ['TG_API_ID', 'TG_API_HASH', 'TG_PHONE', 'TG_GROUP']
    missing = [k for k in required if not cfg.get(k)]
    if missing:
        return  # Silently exit in daemon mode

    # Record session start time
    SESSION_START_TS.write_text(datetime.now().isoformat())

    # Clear session log
    SESSION_LOG_FILE.write_text('')

    client = TelegramClient(SESSION_FILE, int(cfg['TG_API_ID']), cfg['TG_API_HASH'])
    try:
        await client.start(phone=cfg['TG_PHONE'])
    except Exception:
        return

    group_id = cfg['TG_GROUP']
    try:
        group_id = int(group_id)
    except ValueError:
        pass

    try:
        entity = None
        if isinstance(group_id, int):
            async for dialog in client.iter_dialogs():
                if dialog.entity.id == group_id:
                    entity = dialog.entity
                    break
        if entity is None:
            entity = await client.get_entity(group_id)
        group_peer_id = entity.id
    except Exception:
        await client.disconnect()
        return

    @client.on(events.NewMessage(chats=group_peer_id))
    async def handler(event):
        msg = event.message
        if not msg.text:
            return
        sender_name = 'Unknown'
        try:
            sender = await event.get_sender()
            if sender:
                if hasattr(sender, 'first_name'):
                    sender_name = (sender.first_name or '') + (' ' + sender.last_name if sender.last_name else '')
                    sender_name = sender_name.strip() or sender.username or 'Unknown'
        except Exception:
            pass

        score, tags = importance_score(msg.text)
        line = format_msg_line(msg.date.astimezone(), sender_name, msg.text, tags)

        # Append to main log
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line + '\n')

        # Append to session log
        with open(SESSION_LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line + '\n')

        # Auto-save critical to Obsidian immediately
        if score >= 7:
            _save_critical_to_obsidian([{'line': line}], cfg.get('TG_GROUP', 'tezCode'))

    await client.run_until_disconnected()


async def session_report():
    """Print messages logged since session start (from tg_session.log)."""
    if not SESSION_LOG_FILE.exists() or SESSION_LOG_FILE.stat().st_size == 0:
        print("📭 За время сессии новых сообщений в tezCode не было")
        return

    lines = SESSION_LOG_FILE.read_text(encoding='utf-8').strip().splitlines()
    if not lines:
        print("📭 За время сессии новых сообщений в tezCode не было")
        return

    important = []
    all_msgs  = []
    for line in lines:
        all_msgs.append(line)
        score, _ = importance_score(line)
        if score >= 4:
            important.append(line)

    print(f"\n━━━ 💬 TEZCODE — за время сессии ({len(all_msgs)} сообщ.) ━━━")
    if important:
        print(f"\n⚠️  ВАЖНЫЕ ({len(important)}):")
        for l in important:
            print(f"  {l}")
    if len(all_msgs) > len(important):
        others = [l for l in all_msgs if l not in important]
        print(f"\n💬 ОСТАЛЬНЫЕ ({len(others)}):")
        for l in others[-10:]:
            print(f"  {l}")
    print()


def main():
    parser = argparse.ArgumentParser(description='tg_autobot — TezCode Telegram monitor')
    parser.add_argument('--history',        type=int, metavar='N', help='Fetch last N days')
    parser.add_argument('--important',      action='store_true',   help='Show only important messages')
    parser.add_argument('--watch',          action='store_true',   help='Background daemon mode')
    parser.add_argument('--session-report', action='store_true',   help='Report session messages')
    args = parser.parse_args()

    loop = asyncio.get_event_loop()

    if args.session_report:
        loop.run_until_complete(session_report())
    elif args.watch:
        loop.run_until_complete(watch_mode())
    elif args.history is not None:
        loop.run_until_complete(fetch_history(args.history, important_only=args.important))
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
