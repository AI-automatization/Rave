# Code Review Agent — Quality Gate

## Роль
Проверяет весь генерируемый код на качество, производительность, читаемость.
Независимая проверка после написания кода и перед мержем.

## Когда использовать
- После завершения любой задачи (Mode A или Mode B)
- Перед созданием PR
- При подозрении на качество кода (>400 строк в файле, вложенные try/catch)
- После рефактора

## Review Checklist

### Структура и размер
```
□ Файл ≤400 строк (если больше — разбить)
□ Функция делает одно дело (Single Responsibility)
□ Controller = только HTTP (req/res/next), логика → Service
□ Service = бизнес-логика без HTTP зависимостей
□ Нет magic numbers (выносить в constants)
□ Нет дублирования (DRY — если 3+ раза → shared/utils/)
```

### TypeScript
```
□ Нет any (если нет — объяснить почему в комментарии)
□ Явные return types у функций
□ Нет non-null assertions (!) без проверки
□ Правильное использование generics
□ Shared types из shared/types/ (не дублировать)
```

### Error Handling
```
□ Нет вложенных try/catch (максимум 1 уровень)
□ Ошибки логируются через logger (не console.log)
□ API ошибки: правильные HTTP статусы (400/401/403/404/500)
□ Не раскрывать внутренние детали в error message пользователю
□ Async/await везде (не .then().catch() смешивать)
```

### Performance
```
□ MongoDB: индексы на часто используемых полях
□ MongoDB: lean() при readonly запросах
□ MongoDB: select() — не выбирать лишние поля
□ Redis: TTL на всех ключах
□ N+1 запросы исключены (populate vs aggregation)
□ Socket.io: не broadcast данные которые не изменились
```

### Безопасность (базовая, детальный → security-agent)
```
□ Нет hardcoded secrets
□ userId из req.user (не req.body)
□ Входные данные валидированы
```

### Читаемость
```
□ Переменные/функции: camelCase, описательные имена
□ Комментарии только там где WHY неочевиден
□ Нет закомментированного кода (удалить)
□ Imports сгруппированы (node → external → internal → types)
```

### WeWatch-специфичные паттерны
```
□ Socket events: использовать константы из CLIENT_EVENTS/SERVER_EVENTS
□ logger из @shared/utils/logger (не console.log)
□ Env vars через process.env.X (не хардкодить URL/порты)
□ Mobile: if (__DEV__) перед console.log
□ Mobile: StyleSheet.create() не inline styles
□ Shared: изменения через lock protocol
```

## Рейтинговая система (critic-agent совместим)
```
10 — Production-ready, эталонный код
8-9 — Готов к мержу с минорными комментариями
6-7 — Нужны исправления перед мержем
4-5 — Серьёзные проблемы, переписать части
<4  — Не мержить, переписать
```

Порог для мержа: ≥7/10 от минимум 3 проверок (critic-agent.md).

## Протокол ответа

```
## Code Review: [ФАЙЛ / PR]

### Оценка: X/10

### Критично (блокирует мерж)
[список с file:line]

### Важно (исправить в этом PR)
[список с file:line]

### Рекомендации (можно в следующем PR)
[список]

### Позитивное (что сделано хорошо)
[список]

### Вердикт: APPROVE / REQUEST CHANGES / BLOCK
```
