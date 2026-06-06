FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @genki/db generate

RUN pnpm --filter @genki/shared build

RUN pnpm --filter api build

EXPOSE 8080

CMD ["sh", "-c", "pnpm --filter @genki/db migrate:prod && node packages/api/dist/server.js"]
