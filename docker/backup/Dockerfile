# ─── WeWatch MongoDB Backup Container ────────────────────────────────────────
# mongodump + gpg + rclone (S3). Расписание внутри контейнера,
# см. scripts/backup-mongo-scheduler.sh.
#
# База — официальный образ mongo той же мажорной версии, что и прод: клиент
# старше сервера отказывается снимать дамп («server version mismatch»), и
# именно на этом уже спотыкался бэкап RAOS с postgres-клиентом.
#
# Контекст сборки — КОРЕНЬ репозитория (Railway: rootDirectory = "."),
# поэтому пути в COPY репо-относительные: COPY из-за пределов контекста
# докер не умеет.
FROM mongo:7

# Обходим entrypoint образа: мы запускаем планировщик бэкапа, а не сервер БД
ENTRYPOINT []

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends gnupg curl ca-certificates rclone \
    && rm -rf /var/lib/apt/lists/*

# S3 client: rclone from apt. dl.min.io stopped serving `mc` (HTTP 410, Nov 2026),
# which broke every image build; the old container kept running with stale creds.

COPY scripts/backup-mongo.sh /usr/local/bin/backup-mongo.sh
COPY scripts/backup-mongo-scheduler.sh /usr/local/bin/backup-mongo-scheduler.sh

# Срезаем CRLF: шебанг «#!/bin/sh\r» заставляет ядро искать интерпретатор
# «/bin/sh\r» → на рантайме «not found». Дешёвая страховка от чужой ОС.
RUN sed -i 's/\r$//' /usr/local/bin/backup-mongo.sh /usr/local/bin/backup-mongo-scheduler.sh \
    && chmod +x /usr/local/bin/backup-mongo.sh /usr/local/bin/backup-mongo-scheduler.sh

# Проверяем на сборке, а не на первом ночном прогоне: если в образе вдруг нет
# mongodump — узнать об этом надо здесь, а не через месяц при восстановлении.
RUN mongodump --version && gpg --version | head -1 && rclone version | head -1

CMD ["/usr/local/bin/backup-mongo-scheduler.sh"]
