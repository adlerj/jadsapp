# Build stage
FROM node:20 AS build-stage
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production-stage
WORKDIR /app
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/public/tunes ./dist/tunes
COPY server.js ./
COPY server/ ./server/
RUN npm init -y && npm install express@^4.21.0 @anthropic-ai/sdk@^0.39.0 express-rate-limit@^7.5.0
ENV PORT=80
EXPOSE 80
CMD ["node", "server.js"]
