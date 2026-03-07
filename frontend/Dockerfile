# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve stage
FROM node:20-alpine

WORKDIR /app

RUN npx -y serve@latest --version 2>/dev/null || true
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npx", "-y", "serve", "-s", "dist", "-l", "3000"]
