FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

RUN bun build --compile --outfile /app/alerterr ./src/index.ts

FROM debian:latest

WORKDIR /app

COPY --from=build /app/alerterr /app/alerterr

CMD ["/app/alerterr", "start"]
