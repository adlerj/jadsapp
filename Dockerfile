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
COPY package*.json ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "server.js"]
