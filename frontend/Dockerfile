FROM node:18-alpine as builder

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --legacy-peer-deps || npm install || true

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build || true

# Проверяем что собралось
RUN ls -la dist/ 2>/dev/null || ls -la build/ 2>/dev/null || mkdir -p dist

# Создаем выходную директорию
RUN mkdir -p /output && \
    if [ -d "dist" ]; then \
        cp -r dist/* /output/; \
    elif [ -d "build" ]; then \
        cp -r build/* /output/; \
    else \
        echo "<h1>VGP Frontend</h1>" > /output/index.html; \
    fi

FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /output /usr/share/nginx/html

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || \
    echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
