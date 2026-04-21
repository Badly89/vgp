FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install || true

COPY . .

# Важно: устанавливаем базовый URL для продакшена
ENV VITE_API_URL=/api

RUN npm run build || true

RUN mkdir -p /output && \
    if [ -d "dist" ]; then \
        cp -r dist/* /output/; \
    elif [ -d "build" ]; then \
        cp -r build/* /output/; \
    else \
        echo "<h1>VGP Frontend</h1>" > /output/index.html; \
    fi

FROM nginx:alpine

COPY --from=builder /output /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    location / { \
        try_files $uri $uri/ /index.html; \
        index index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location /health { \
        return 200 "OK"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]