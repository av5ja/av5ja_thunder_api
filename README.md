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

Upstream data comes from [`splatoon.oatmealdome.me`](https://splatoon.oatmealdome.me/); this API just normalises the shape and caches aggressively at the edge.

Caching (three layers, hot-path KV reads = 0):

1. **Cloudflare Cache Rules** on `api.splatnet3.com/v3/schedules` — edge cache, ~30 min. Cache hit → the Worker never runs.
2. **`hono/cache`** (Cache API, colo-local) — catches edge misses.
3. **`fetch({cf: {cacheEverything: true, cacheTtl: 1800}})`** — catches Cache API misses via the Cloudflare HTTP cache.

Full miss (each colo, ~once per 30 min) → one upstream fetch.

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
