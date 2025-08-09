# Multi-stage build: build static assets, then run with vite preview
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Keep node_modules to have vite available for preview
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.js ./vite.config.js

# Render sets PORT; default to 8080 locally
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "npx vite preview --host 0.0.0.0 --port $PORT"]
