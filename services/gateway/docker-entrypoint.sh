#!/bin/sh
set -e

# Railway assigns $PORT; default for local runs.
: "${PORT:=8080}"
export PORT

# nginx's `resolver` directive needs a real nameserver IP — read whatever this container's own
# OS-level DNS already uses (works identically on Railway's private network and plain Docker
# Compose, since both configure /etc/resolv.conf correctly for their own internal DNS; this avoids
# hardcoding an address that's only correct for one of the two environments). Falls back to
# Docker's standard embedded resolver if resolv.conf is somehow empty (shouldn't happen).
RESOLVER_IP=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf)
: "${RESOLVER_IP:=127.0.0.11}"
export RESOLVER_IP

# Substitute ONLY our vars so nginx's own $variables ($host, $remote_addr, ...) survive.
VARS='${PORT} ${RESOLVER_IP} ${AUTH_UPSTREAM} ${USER_UPSTREAM} ${CONTENT_UPSTREAM} ${WATCH_PARTY_UPSTREAM} ${NOTIFICATION_UPSTREAM} ${ADMIN_UPSTREAM}'
envsubst "$VARS" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

nginx -t
exec nginx -g 'daemon off;'
