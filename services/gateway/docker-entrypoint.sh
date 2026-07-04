#!/bin/sh
set -e

# Railway assigns $PORT; default for local runs.
: "${PORT:=8080}"
export PORT

# Substitute ONLY our vars so nginx's own $variables ($host, $remote_addr, ...) survive.
VARS='${PORT} ${AUTH_UPSTREAM} ${USER_UPSTREAM} ${CONTENT_UPSTREAM} ${WATCH_PARTY_UPSTREAM} ${NOTIFICATION_UPSTREAM} ${ADMIN_UPSTREAM}'
envsubst "$VARS" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

nginx -t
exec nginx -g 'daemon off;'
