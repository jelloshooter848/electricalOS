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

## Try it in the browser

```sh
pnpm --filter mobile web:export   # static build in apps/mobile/dist
```

Serve `apps/mobile/dist` with any static file server. The build is a single-page
app; the Ask tab is a placeholder until Phase 3.

## Status

Phase 2. Nine offline calculators: voltage drop, conductor ampacity and
sizing, conduit fill, box fill, motor circuits, dwelling load (optional
method), grounding electrode and equipment grounding conductors,
transformers, and power/current. Reference tab with searchable NEC 2023
entries, article filters and a detail view. State picker that sets the NEC
edition, persisted on device. Numeric tables and the adoption snapshot are
marked unverified until checked against the adopted edition (see
docs/data-verification.md).

Not yet built: the AI assistant (Phase 3) and accounts/billing (Phase 4).
