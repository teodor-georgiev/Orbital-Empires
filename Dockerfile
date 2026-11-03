# Self-hosted static game; no backend, accounts, or third-party runtime dependencies.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css app.js core.js sw.js manifest.webmanifest /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
EXPOSE 8080
