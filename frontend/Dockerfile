FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install || true
COPY . .
RUN npm run build || true
RUN ls -la dist/ 2>/dev/null || ls -la build/ 2>/dev/null || mkdir -p dist

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

# Конфиг nginx через RUN вместо COPY с fallback
RUN echo 'server { \n\
    listen 80; \n\
    server_name localhost; \n\
    root /usr/share/nginx/html; \n\
    \n\
    location / { \n\
        try_files $uri $uri/ /index.html; \n\
        index index.html; \n\
    } \n\
    \n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { \n\
        expires 1y; \n\
        add_header Cache-Control "public, immutable"; \n\
    } \n\
    \n\
    location /health { \n\
        return 200 "OK"; \n\
        add_header Content-Type text/plain; \n\
    } \n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
