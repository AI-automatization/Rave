#!/bin/bash
# Ежедневное утреннее напоминание Saidazim'у: тренировка + питание.
# Запускается launchd-агентом com.wewatch.morning-reminder в 9:00 (Asia/Tashkent).
# Бот плагина Telegram (тот, где идёт разговор с Claude)
BOT_TOKEN=$(grep -E "^TELEGRAM_BOT_TOKEN=" "$HOME/.claude/channels/telegram/.env" 2>/dev/null | cut -d= -f2-)
[ -z "$BOT_TOKEN" ] && { echo "no TELEGRAM_BOT_TOKEN in ~/.claude/channels/telegram/.env"; exit 1; }
CHAT="6299152655"
START="2026-07-05"

# номер дня челленджа
NOW=$(date +%s)
S=$(date -j -f "%Y-%m-%d" "$START" +%s 2>/dev/null || echo "$NOW")
DAY=$(( (NOW - S) / 86400 + 1 )); [ "$DAY" -lt 1 ] && DAY=1

# раз в неделю (по понедельникам) — напомнить про фото
PHOTO=""
[ "$(date +%u)" = "1" ] && PHOTO="📸 <b>Сегодня — фото недели</b> (спереди + сбоку, то же место и свет).
"

read -r -d '' MSG <<EOF
💪 <b>Доброе утро! День ${DAY} — тренировка</b>

⚖️ Сначала взвесься (натощак, после туалета).
${PHOTO}
🔥 <b>Разминка (5 мин):</b> плечи · руки · махи ногами · наклоны · бег на месте.

<b>Тренировка (~25 мин):</b>
1️⃣ Отжимания: 1 обычное + 8–10 от дивана/стола — <b>×4</b> (отдых 1 мин)
2️⃣ Приседания: <b>3×15</b> (спина ровная)
3️⃣ Планка: <b>3×20–30 сек</b>
4️⃣ Ягодичный мостик: <b>3×15</b>
🚶 Прогулка 20–30 мин (если остались силы)

🍽 <b>Питание:</b>
🍳 Завтрак: 2 яйца + хлеб/лепёшка + чай
🥙 Обед: куриный лаваш — мин. соуса, без фри/майонеза, больше курицы и овощей
🍲 Ужин: домашнее, порция поменьше
💧 Не пей калории — вода / чай без сахара

⚡️ Нет настроения? Сделай <b>хотя бы 5 минут</b>. Заверши с мыслью «мог бы ещё чуть-чуть». Погнали 🚀
EOF

curl -s "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT}" \
  --data-urlencode "text=${MSG}" \
  -d "parse_mode=HTML" -d "disable_web_page_preview=true" > /dev/null
