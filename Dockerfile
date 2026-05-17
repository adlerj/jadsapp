# Build stage
FROM node:20 AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# Build server dependencies (including native modules) in the full Node image
# This avoids QEMU illegal instruction errors when cross-compiling on Alpine
RUN mkdir /server-deps && cd /server-deps && npm init -y && \
    npm install express@^4.21.0 @anthropic-ai/sdk@^0.39.0 express-rate-limit@^7.5.0 better-sqlite3@^11.0.0 marked@^18.0.3

# Production stage
FROM node:20-slim AS production-stage
WORKDIR /app
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/public/tunes ./dist/tunes
COPY --from=build-stage /server-deps/node_modules ./node_modules
COPY --from=build-stage /server-deps/package.json ./package.json
COPY server.js ./
COPY server/ ./server/
COPY scripts/migrate-posts.js ./scripts/
RUN mkdir -p /app/data
ENV PORT=80
ENV DB_PATH=/app/data/blog.db
EXPOSE 80
VOLUME ["/app/data"]
CMD ["sh", "-c", "node scripts/migrate-posts.js && node server.js"]
