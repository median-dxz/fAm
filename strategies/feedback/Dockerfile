FROM node:lts-bookworm-slim AS base
RUN apt-get update -y
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN pnpm i

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

EXPOSE 3002

CMD npm start