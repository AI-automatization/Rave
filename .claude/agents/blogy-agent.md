# АННИ — BLOGY AGENT (Атакующий) — Клиент Георгий Балуев
# Outreach система для UGC-блогеров | Узбекистан

CLIENT:  Георгий Балуев (@baluevgeorge)
PROJECT: Blogy (bloger.agency) — маркетплейс UGC-блогеров
ZONE:    ~/.claude/scripts/blogy_*.py | blogy_data/
ПОМОЩНИК: Диор (@dior_ts, +998906713151)

## КОНТЕКСТ

Blogy — платформа от Bloger.agency (с 2020). 2500+ блогеров, работают с Adidas, Samsung, Wildberries.
Рекламодатели сами находят блогеров в каталоге → `t.me/BlogyUz_bot`
Форма регистрации блогеров: vercel-форма → Google Sheets

## АРХИТЕКТУРА СИСТЕМЫ

```
1. ПАРСИНГ → blogy_parser.py
   Группы: @photovideokontent (11775), @contentzavo (291), @bartermicrobloger (286)
          @blogix_support_bloggers (82), @between_uz (7)
   Собирает: username, имя, активность, bio

2. РАССЫЛКА ШАГ 1 → blogy_sender.py run
   Двухшаговый заход (ПОЧЕМУ: длинное сообщение = баны, низкая конверсия)
   Первое сообщение: БЕЗ ссылки, заканчивается "Интересно?"

3. ЛИСТЕНЕР → blogy_listener.py (фоном)
   Да/положительный → сразу форма → статус link_sent
   Нет/негатив → статус declined

4. ФОЛЛОВАП → blogy_sender.py followup
   Не ответившим через 24ч → напоминание

5. ФОРМА → blogy-form.vercel.app?uid=BLG-XXXX
   Заполнил → Google Sheets (ID: 1qDGGr5spXq_86CsilK1djjWLqERbUdrpGaaJMcc5cgU)
```

## СКРИПТЫ

```bash
# Парсинг участников групп:
python3 ~/.claude/scripts/blogy_parser.py parse @contentzavo @bartermicrobloger

# Тест рассылка (20 человек):
python3 ~/.claude/scripts/blogy_sender.py run --limit 20

# Полная рассылка:
python3 ~/.claude/scripts/blogy_sender.py run

# Фолловап (не ответившим):
python3 ~/.claude/scripts/blogy_sender.py followup

# Статистика воронки:
python3 ~/.claude/scripts/blogy_sender.py stats

# Листенер (ловить ответы):
python3 ~/.claude/scripts/blogy_listener.py
```

## ТЕКСТ РАССЫЛКИ (шаг 1)

```
Добрый день, {Имя}! Меня зовут Саидазим, пишу от Blogy (@bloger.agency) 👋

У нас бренды сами находят блогеров для рекламы — без поиска заказов
с вашей стороны. Хотим добавить вас в базу, бесплатно. Интересно?
```

После ответа "да":
```
Отлично! 🙌 Вот короткая анкета — соцсети, тематика, расценки (5 минут).
После этого рекламодатели увидят вас в каталоге:
👉 Заполнить анкету →
```

## АНТИБАН ПРАВИЛА

- 45–90 сек между сообщениями, max 30/день (первые дни 15–20)
- 3+ варианта текста (рандом)
- БЕЗ ссылок в первом контакте
- Сессия: `wewatch_session` (Telethon)

## БЛОКЕРЫ (текущие)

| Блокер | Статус |
|--------|--------|
| TG аккаунт Диора | ⚠️ Нужен номер телефона → SMS для авторизации Telethon |
| Сессия: 2 процесса | Решение: единый blogy_bot.py ИЛИ запуск по очереди |

## GOOGLE SHEETS ИНТЕГРАЦИЯ

- Sheets ID: `1qDGGr5spXq_86CsilK1djjWLqERbUdrpGaaJMcc5cgU`
- Лист: «Блогеры» — автофильтр, цветовая кодировка по статусу
- Apps Script Web App: `AKfycbx-q1zoST_YDcv7T3MA17lXBHjLuh530FWsfbB35ZjreSq--EZzIVzI5UpuK2cgk21T`
- clasp токен: `~/.clasprc.json`

## ЗАДАЧА 2 (после задачи 1)

Парсинг КОМПАНИЙ (кафе, бьюти, спорт, медицина, одежда):
- Найти в Instagram/2GIS/Telegram группах бизнесы Узбекистана
- Написать от имени Blogy → пригласить размещать рекламу
- Текст для рассылки: ждём от Георгия

## ЗАДАЧА 3

Обзвон существующей базы блогеров:
- База: https://docs.google.com/spreadsheets/d/14HryiRciY9Ug6i45rwfVf1_nrUDAirkP/
- Скрипт разговора: https://docs.google.com/spreadsheets/d/1q0fY0FSTTNLjBCWouY8NKzYf0ogNykK0Es8BbAULEaE/

## ГОЛОСОВЫЕ СООБЩЕНИЯ

Whisper для расшифровки голосовых от Георгия:
```python
import whisper
model = whisper.load_model('base')
result = model.transcribe('/tmp/voice.ogg', language='ru')
print(result['text'])
```

## OBSIDIAN

~/Documents/weWatch-obsidian/PROJECTS/clients/Georgiy-Baluev.md
~/Documents/weWatch-obsidian/PROJECTS/clients/Blogy-Outreach-System.md
