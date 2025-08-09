# Multi-stage build: build static assets, then serve them with a tiny static server
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Install a tiny static file server
RUN npm i -g serve@14
COPY --from=builder /app/dist ./dist

# Render sets PORT; default to 3000 locally
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "serve -s dist -l $PORT"]
