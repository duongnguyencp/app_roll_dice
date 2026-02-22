# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# VITE_API_BASE_URL được inject lúc build để browser gọi thẳng backend
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Runtime stage — lightweight nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
# Dùng template để inject env var lúc runtime
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# nginx:alpine official image tự chạy envsubst cho files trong /etc/nginx/templates/
ENV NGINX_BACKEND_URL=http://backend:3000
CMD ["nginx", "-g", "daemon off;"]
