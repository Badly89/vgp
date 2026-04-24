FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install

COPY . .

RUN echo "VITE_API_URL=/api" > .env.production

RUN npm run build

FROM nginx:alpine

# Устанавливаем openssl для генерации сертификатов
RUN apk add --no-cache openssl

# Генерируем самоподписанный сертификат для HTTPS
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=RU/ST=State/L=City/O=Organization/CN=10.87.0.59" \
    -addext "subjectAltName = IP:10.87.0.59"

# Копируем dist из сборщика
COPY --from=builder /app/dist /usr/share/nginx/html

# ЯВНО КОПИРУЕМ public директорию (изображения и статические файлы)
COPY --from=builder /app/public /usr/share/nginx/html

# Настройка nginx с поддержкой HTTP и HTTPS
RUN echo 'server { \
    listen 80; \
    server_name 10.87.0.59 localhost; \
    location / { \
        return 301 https://$host$request_uri; \
    } \
} \
\
server { \
    listen 443 ssl http2; \
    server_name 10.87.0.59 localhost; \
    \
    ssl_certificate /etc/nginx/ssl/nginx.crt; \
    ssl_certificate_key /etc/nginx/ssl/nginx.key; \
    ssl_protocols TLSv1.2 TLSv1.3; \
    ssl_ciphers HIGH:!aNULL:!MD5; \
    \
    root /usr/share/nginx/html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    location /health { \
        return 200 "OK"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]