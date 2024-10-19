# Build stage
FROM node:14 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy the MP3 files from the build stage to the production stage
COPY --from=build-stage /app/public/tunes /usr/share/nginx/html/tunes
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]