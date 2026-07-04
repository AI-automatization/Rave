#!/usr/bin/env python3
"""First-time auth for WeWatch Council Listener userbot."""
import asyncio
from pyrogram import Client

API_ID   = 32841833
API_HASH = "eab776c5e181eb5e7fa105eaeffb8963"
PHONE    = "+998930974542"
SESSION  = str(__import__("pathlib").Path.home() / ".council_bot_session")

async def main():
    app = Client(SESSION, api_id=API_ID, api_hash=API_HASH, phone_number=PHONE)
    await app.start()
    me = await app.get_me()
    print(f"\n✅ Авторизован: {me.first_name} (@{me.username})")
    print(f"📁 Session сохранён: {SESSION}.session")
    print("\n🚀 Теперь запусти: python3 .claude/scripts/bot_council_listener.py")
    await app.stop()

asyncio.run(main())
