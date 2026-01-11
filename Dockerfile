# Build stage
FROM node:22.14-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV NEXT_PUBLIC_API_BASE_URL=http://51.77.146.43:3000/api
ENV NEXT_PUBLIC_APP_URL=http://51.77.146.43
ENV NEXT_PUBLIC_APP_NAME=Zaydo
RUN npm run build

# Production stage
FROM node:22.14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "start", "--", "-H", "0.0.0.0"]