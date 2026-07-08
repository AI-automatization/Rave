# WeWatch API Gateway — nginx reverse proxy.
# Build context = services/gateway/ (deployed via `railway up services/gateway`).
FROM nginx:1.27-alpine

# envsubst (gettext) for templating the config from env vars at startup
RUN apk add --no-cache gettext

# Remove the stock default site; we provide the full http{} config
RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint-gw.sh
RUN chmod +x /docker-entrypoint-gw.sh

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint-gw.sh"]
