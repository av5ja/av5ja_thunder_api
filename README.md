# Thunder API

A tiny Cloudflare Workers API that serves Splatoon 3 Salmon Run schedules.

## Endpoint

### `GET /v3/schedules`

Returns the current and upcoming Salmon Run schedules. That's it.

```json
{
  "schedules": [
    {
      "id": "0664e978f616079a7a4fa8e1cbc0bb00",
      "startTime": "2024-09-15T16:00:00.000Z",
      "endTime": "2024-09-17T08:00:00.000Z",
      "rareWeapons": [],
      "weaponList": [8000, 230, 4040, 6010],
      "bossId": 24,
      "stageId": 9,
      "mode": "REGULAR",
      "rule": "REGULAR"
    }
  ]
}
```

Interactive docs: `GET /docs` (Scalar UI). OpenAPI spec: `GET /specification`.

## How it works

Upstream data comes from [`splatoon.oatmealdome.me`](https://splatoon.oatmealdome.me/); this API normalises the shape, stores it in **Cloudflare D1**, and caches the response aggressively at the edge.

**Data pipeline**

- A **cron trigger** (`*/30 * * * *`, production only) runs `scheduled` in `src/utils/handler/scheduled.ts`.
- It fetches upstream, parses through `CoopScheduleQuery`, and upserts each schedule into the `schedules` table in D1 (single batch, `ON CONFLICT DO UPDATE`).
- `GET /v3/schedules` reads from D1 (`SELECT … ORDER BY start_time DESC LIMIT 50`). If the D1 read fails, it falls back to fetching upstream directly so the endpoint never hard-fails.

**Caching layers** (hot-path D1 reads = 0 when caches hit):

1. **Cloudflare Cache Rules** on `api.splatnet3.com/v3/schedules` — edge cache, ~30 min. Cache hit → the Worker never runs.
2. **`hono/cache`** (Cache API, colo-local) — catches edge misses.
3. **D1** — colo-local SQLite read (~ms) when both caches miss.

Full miss (each colo, ~once per 30 min) → one D1 read.

## D1 setup

The `SCHEDULES` binding points at a D1 database that must exist before deploy:

```sh
# create the databases (once, per env)
bunx wrangler d1 create av5ja-schedules --env production
bunx wrangler d1 create av5ja-schedules-dev --env development

# copy the returned database_id into wrangler.toml
#   [[env.production.d1_databases]] / [[env.development.d1_databases]]

# apply migrations
bunx wrangler d1 migrations apply av5ja-schedules --env production
bunx wrangler d1 migrations apply av5ja-schedules-dev --env development --local
```

Migrations live in `migrations/`.

## Development

```sh
bun install
bun run dev        # wrangler dev on port 18787
bun test           # unit tests for the schedule shape
bunx tsc --noEmit  # type check
bunx biome check   # lint + format check
```

## Deploy

CI (`.github/workflows/deployment.yaml`) deploys on merged PRs:

- `develop` → development env
- `master` → production env

Manual: `bun run deploy` (production) / `bun run deploy:dev` (development).
