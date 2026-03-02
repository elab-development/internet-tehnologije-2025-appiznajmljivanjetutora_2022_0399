FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ENV DATABASE_URL=mysql://app:app@db:3306/tutor_app
ENV JWT_SECRET=docker-build-secret
ENV RESEND_API_KEY=
ENV RESEND_FROM_EMAIL=
ENV GOOGLE_CALENDAR_ID=
ENV GOOGLE_SERVICE_ACCOUNT_EMAIL=
ENV GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS tools
ENV DATABASE_URL=mysql://app:app@db:3306/tutor_app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
