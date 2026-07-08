#!/usr/bin/env python3
"""Send file DM to @mr_abdulaziz_yormatov from Saidazim's personal Telegram account."""
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.contacts import ResolveUsernameRequest

API_ID   = 32841833
API_HASH = "eab776c5e181eb5e7fa105eaeffb8963"
SESSION  = str(__import__("pathlib").Path.home() / ".tg_autobot_session")  # Telethon appends .session
FILE_PATH = "/Users/saidazim/Desktop/Rave/docs/xsolla-uzbekistan-research.md"
USERNAME  = "mr_abdulaziz_yormatov"

CAPTION = """📊 Xsolla + Узбекистан — полный research

Собрал всю инфу по Xsolla для ООО «Tez Code»:
• Законность в Узбекистане
• Критические риски (CEO скандал $120M, Russian ops)
• Пошаговый чеклист для легального подключения
• IT Park льготы (0% налоги до 2040)
• Сравнение с альтернативами

Главный вывод: законно при 5 условиях, но есть критический риск — нужно убедиться что договор с Xsolla (USA) Inc., а не с российским ООО."""


async def main():
    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.start()

    result = await client(ResolveUsernameRequest(USERNAME))
    user = result.users[0]

    await client.send_file(user, FILE_PATH, caption=CAPTION)
    print(f"✅ Отправлено @{USERNAME} (id: {user.id})")
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
