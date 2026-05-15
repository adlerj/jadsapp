# Build stage
FROM node:20 AS build-stage
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
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
