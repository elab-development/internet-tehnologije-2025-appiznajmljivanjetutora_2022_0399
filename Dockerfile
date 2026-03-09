FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=mysql://app:app@localhost:3306/tutor_app
ENV JWT_SECRET=ci-secret
ENV RESEND_API_KEY=
ENV RESEND_FROM_EMAIL=
ENV GOOGLE_CALENDAR_ID=
ENV GOOGLE_SERVICE_ACCOUNT_EMAIL=
ENV GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]