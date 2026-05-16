# Build stage
FROM node:20 AS build-stage
WORKDIR /app
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
COPY scripts/migrate-posts.js ./scripts/
COPY src/content/blog/ ./src/content/blog/
RUN apk add --no-cache python3 make g++ && \
    npm init -y && \
    npm install express@^4.21.0 @anthropic-ai/sdk@^0.39.0 express-rate-limit@^7.5.0 better-sqlite3@^11.0.0 marked@^18.0.3 && \
    apk del python3 make g++
RUN mkdir -p /app/data
ENV PORT=80
ENV DB_PATH=/app/data/blog.db
EXPOSE 80
VOLUME ["/app/data"]
CMD ["sh", "-c", "node scripts/migrate-posts.js && node server.js"]
