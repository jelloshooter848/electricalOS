# electricalOS

A phone app for field electricians: offline NEC calculators and reference,
plus an AI assistant that answers code questions with article citations.

## Layout

| Path | What |
|---|---|
| `apps/mobile` | Expo (React Native) app for iOS and Android |
| `packages/calc` | Pure TypeScript calculators, no dependencies, fully tested |
| `packages/nec-data` | Our own paraphrased reference entries and derived tables, by edition |
| `services/ask` | Serverless function that calls the Claude API (Phase 3) |
| `docs` | Legal position on NEC content, content style guide, data verification log |

## Develop

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm mobile        # expo start
```

## Status

Phase 1 scaffold. Calculators: voltage drop, conductor ampacity and sizing,
conduit fill. Numeric tables are marked unverified until checked against the
adopted edition (see docs/data-verification.md).
