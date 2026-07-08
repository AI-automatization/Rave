#!/usr/bin/env python3
"""
Send DM to @Emirhan7788 from Saidazim's personal Telegram account via Telethon.
Usage: python3 send_dm_emirhan.py
"""
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.contacts import ResolveUsernameRequest

API_ID   = 36982142
API_HASH = "7ef862d1e3d3ce1892232ff1cc24f5d0"
SESSION  = "/tmp/saidazim_personal_session"

MESSAGE = """Сенсэй, нашёл крутой Claude Code skill — Emil Kowalski (Linear design engineer).

Ставится так:
claude mcp add --transport http https://api.cloudcodetools.com/emil-design-eng/mcp

Что умеет:
• Генерирует анимации в стиле Emil (spring physics, Framer Motion)
• UI компоненты — minimal, elegant, production-ready
• Даёт design feedback и accessibility tips
• Знает все его паттерны из Linear/Craft

48к+ установок, популярный в сообществе. Думаю пригодится для WeWatch Web."""


async def main():
    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.start()

    result = await client(ResolveUsernameRequest("Emirhan7788"))
    user = result.users[0]
    await client.send_message(user, MESSAGE)
    print(f"✅ Отправлено @Emirhan7788 (id: {user.id})")
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
