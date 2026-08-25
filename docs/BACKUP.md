# Бэкап и восстановление базы WeWatch

## Коротко

| | |
|---|---|
| Что бэкапится | MongoDB сервиса `MongoDB` в проекте Railway `rave` (вся база, `mongodump --archive --gzip`) |
| Где лежит | MinIO, бакет из `MINIO_BUCKET`, ключ `YYYY/MM/DD/wewatch-mongo-<timestamp>.archive.gz.gpg` |
| Чем зашифровано | GPG, симметрично, AES256, пароль в `GPG_PASSPHRASE` сервиса `wewatch-backup` |
| Когда | Сразу при деплое сервиса, дальше ежедневно в 02:00 UTC (07:00 Ташкент) |
| Сколько хранится | `RETENTION_DAYS`, по умолчанию 30 дней |
| Кто делает | Сервис `wewatch-backup` в проекте Railway `rave` |

## Как это устроено и почему именно так

**Бэкапа не существовало до 25.08.2026.** В репозитории лежал workflow `MongoDB Backup`
по расписанию — он запускался каждую ночь и падал каждую ночь: 99 падений из 100
прогонов, ноль успехов за всю историю, в логе `MONGO_URI is required`. Секретов в
репозитории не было. В списке Actions это выглядело как настроенная защита.

**Почему секреты нельзя было просто добавить.** Репозиторий публичный, а в
организации `default_repository_permission = admin` — на 25.08.2026 у всех 19
коллабораторов права администратора, обязательная 2FA выключена. Любой из них
может добавить шаг в workflow и вывести секрет в лог. Класть туда строку
подключения к боевой базе нельзя.

**Что сделано вместо.** Бэкап перенесён в Railway, где база и живёт:
- строка подключения не копируется никуда — сервис получает её ссылкой
  `${{ MongoDB.MONGO_URL }}`, значение не покидает инфраструктуру Railway;
- дамп шифруется до отправки в хранилище;
- расписание — внутри контейнера (`scripts/backup-mongo-scheduler.sh`), а не
  Railway-cron: в бэкапе RAOS Railway-cron не взвёлся ни разу (поле `cronSchedule`
  заполнено, а `meta.cronSchedule` у каждого деплоя `null`), и это выяснилось
  только когда понадобился дамп.

## Восстановление

Проверять эту процедуру нужно до того, как она понадобится.

```bash
# 1. Достать нужный дамп (в контейнере wewatch-backup или локально с mc)
mc alias set wewatch "$MINIO_ENDPOINT" "$MINIO_ACCESS" "$MINIO_SECRET"
mc ls --recursive "wewatch/$MINIO_BUCKET/"            # посмотреть, что есть
mc cp "wewatch/$MINIO_BUCKET/2026/08/25/wewatch-mongo-2026-08-25T02-00-00Z.archive.gz.gpg" .

# 2. Расшифровать (спросит пароль = GPG_PASSPHRASE)
gpg --batch --yes --passphrase "$GPG_PASSPHRASE" \
    --output wewatch.archive.gz \
    --decrypt wewatch-mongo-2026-08-25T02-00-00Z.archive.gz.gpg

# 3. Восстановить
#    ⚠️ Сначала в ЗАПАСНУЮ базу, а не поверх боевой:
mongorestore --uri="$MONGO_URL_STAGING" --archive=wewatch.archive.gz --gzip

#    Поверх боевой — только осознанно и с --drop, иначе документы смешаются
#    со старыми: mongorestore без --drop делает upsert, а не замену.
```

**Без `GPG_PASSPHRASE` дамп не восстановить.** Пароль хранится в переменных
сервиса `wewatch-backup` на Railway и должен быть продублирован там, где владелец
сможет достать его, даже если доступ к Railway потерян.

## Проверка, что бэкап живой

Не «воркфлоу настроен», а «последний успешный прогон — такого-то числа»:

```bash
railway logs -s wewatch-backup | tail -20        # ищем «Backup complete»
mc ls --recursive "wewatch/$MINIO_BUCKET/" | tail -5   # ищем сегодняшний файл
```

Сервис отправляет уведомление в Telegram при успехе и при отказе, если заданы
`TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`.

## Переменные сервиса `wewatch-backup`

| Переменная | Что это |
|---|---|
| `MONGO_URL` | ссылка `${{ MongoDB.MONGO_URL }}` — не хардкодить |
| `MINIO_ENDPOINT` / `MINIO_ACCESS` / `MINIO_SECRET` | доступ к MinIO |
| `MINIO_BUCKET` | бакет для дампов WeWatch, отдельный от бакета RAOS |
| `GPG_PASSPHRASE` | пароль шифрования |
| `RETENTION_DAYS` | срок хранения, по умолчанию 30 |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | уведомления, необязательно |

Сервис должен оставаться обычным always-on (`numReplicas=1`, **без** `cronSchedule`):
с заданным `cronSchedule` Railway применяет run-once / scale-to-0 и убивает
внутренний планировщик.
