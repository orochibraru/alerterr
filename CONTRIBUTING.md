# Contributing

## Prerequisites

- [Bun](https://bun.sh) v1.x

## Setup

```bash
bun install
cp config.example.json config.json
# Edit config.json — set at least one notifier webhook URL
```

## Running locally

```bash
bun run dev        # hot-reload dev server
bun run build      # compile self-contained binary → ./baba
./baba start       # run the binary
```

## Tests

```bash
bun test           # run tests with coverage
bun run lint       # lint with Biome
bun run lint:fix   # auto-fix lint issues
```

## Other scripts

```bash
bun run gen:schema    # regenerate schema/config.schema.json
bun run gen:docs      # regenerate docs/env.md and docs/config.md
bun run validate      # send a test alert to all configured notifiers
```

## Adding a notifier

1. Create `src/lib/notifiers/<name>.ts` — export a Zod schema and a class extending `AbstractNotifier`
2. Add the schema import and union entry in `src/config.ts`
3. Add an instantiation branch in `src/lib/notifiers/index.ts`
4. Add corresponding `BABA_*` env vars in `src/lib/env.ts`
