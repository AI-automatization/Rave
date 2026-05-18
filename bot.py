import asyncio
import subprocess
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

BOT_TOKEN = "8734969603:AAF0FcbPp86XYgTkWf2Sveqqy8QOB_dh8P0"
ALLOWED_CHAT_ID = 6299152655
PROJECT_DIR = "/Users/saidazim/Desktop/Rave"


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_chat.id != ALLOWED_CHAT_ID:
        return

    message = update.message.text
    await update.message.reply_text("⏳ Думаю...")

    try:
        result = await asyncio.to_thread(
            subprocess.run,
            ["claude", "-p", message, "--dangerously-skip-permissions"],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=180,
        )
        response = result.stdout.strip() or result.stderr.strip() or "Нет ответа"
    except subprocess.TimeoutExpired:
        response = "⏰ Таймаут (180с). Задача слишком долгая."
    except Exception as e:
        response = f"❌ Ошибка: {e}"

    # Telegram max 4096 chars per message
    for i in range(0, len(response), 4096):
        await update.message.reply_text(response[i:i+4096])


def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    print("✅ Bot запущен. Пиши в Telegram.")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
