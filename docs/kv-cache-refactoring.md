# スケジュール専用化 + KV / cron 完全撤廃 リファクタリング計画書

作成日: 2026-07-14
最終更新: 2026-07-14 (方針確定: `/v3/schedules` のみ残し、KV / cron 全廃、3 段キャッシュで速度維持)
対象: `av5ja` (Thunder API on Cloudflare Workers + Hono, `api.splatnet3.com`)

## 0. TL;DR

- **削るもの**: `/v3/schedules` (GET) を除く全 API、cron trigger、全 KV namespace (6 個)、認証系、resource middleware 一式。
- **残すもの**: `GET /v3/schedules` 1 本のみ。
- **速さの維持策**: **Cache Rules (edge) → Cache API (colo) → `fetch({cf:{cacheEverything}})` (Cloudflare HTTP cache) の 3 段構え**。
  - Edge / colo cache hit: 数 ms、Worker 実行 0 回、upstream fetch 0 回
  - 全段 miss (各 colo 30 分に 1 回程度): upstream fetch 1 回 → 100–300 ms
  - hot path での KV アクセスは **完全ゼロ**
- **結果**: 現行の「cron で KV を温めて GET は KV 一発読み」より速く (edge hit で Worker すら動かない)、コード量は激減、KV / cron の運用も消える。

---

## 1. 削除対象・保持対象

### 削除する API

| Route | ファイル | 備考 |
|---|---|---|
| `POST /v3/results` | `src/api/results/index.ts` | リザルト書き込み |
| `POST /v1/histories` | `src/api/histories/index.ts` | 履歴 POST |
| `POST /v1/records` | `src/api/records/index.ts` | 記録 POST |
| `POST /v1/weapon_records` | `src/api/weapon_records/index.ts` | 武器記録 POST |
| `GET /v1/version` | `src/api/version/index.ts` | バージョン情報 (upstream fetch) |
| `POST /v1/auth/*` | `src/api/auth/index.ts` | Discord OAuth |
| `GET /v1/users` | `src/api/users/index.ts` | ユーザー情報 |
| `GET /v1/imgs/{type}/{raw_id}` | `src/api/imgs/index.ts` | 画像 302 リダイレクト |
| `GET /v1/resources`, `DELETE /v1/resources` | `src/api/resources/index.ts` | アセット URL 一覧 |
| `POST /v3/schedules` (deprecated) | `src/api/schedules/index.ts` の下半分 | resource middleware 使用 |

### 保持する API

| Route | ファイル | 現状 | 見直し内容 |
|---|---|---|---|
| `GET /v3/schedules` | `src/api/schedules/index.ts` | dummy.json を返却中 | upstream fetch (`splatoon.oatmealdome.me`) + `cf.cacheEverything` + Cache API + Cache Rules |

### 併せて削除するもの

**cron trigger**:
- `wrangler.toml` の `[triggers] crons = [...]` を削除
- `src/utils/handler/scheduled.ts` 削除
- `src/index.ts` の `export default { fetch, scheduled }` から `scheduled` を落として `export default app` に

**KV namespace (6 個 → 0 個)**:

| Binding | 削除可否 | 理由 |
|---|---|---|
| `RESULTS` | ✅ | results 系削除で不要 |
| `USERS` | ✅ | auth/users 削除で不要 |
| `RESOURCES` | ✅ | imgs/resources 削除で不要 |
| `HISTORIES` | ✅ | histories POST 削除で不要 |
| `CACHES` | ✅ | schedules キャッシュ用途を `fetch({cf})` + Cache API に移すため不要 |
| `SCHEDULES` | ✅ | 他システム依存なし (2026-07-14 ユーザー確認済み)。upstream 直接 fetch にするため不要 |

**middleware / utility**:
- `src/middleware/bearer_token.middleware.ts`
- `src/utils/resource.ts`
- `src/utils/discord_oauth.ts`
- `src/utils/kv.ts` (全 namespace 削除、ファイルごと消す)
- `src/utils/hash.ts` (schedules で参照なしのはず、grep で最終確認)
- `src/utils/decode.ts`, `src/utils/camelcase_keys.ts` (未使用確認して削除)

**models / enums**:
- `Thunder.User`, `Thunder.Token` (`src/models/user.dto.ts`)
- `CoopResult`, `CoopHistory`, `CoopHistoryDetail`, `WeaponRecord`, `CoopRecord`, `S3URL`, `BulletToken`, `DiscordToken`, `JsonWebToken`, `RawId`, `CoopPlayerId`, `WeaponHash`, `CoopHistoryDetailId`, `CoopData`, `NodeList`, `ImageURL`, `Datetime` (schedules で参照されないもの)
- 保持: `CoopSchedule`, `StageSchedule` (schedule 実装で使うもの), 依存する共通 dto (`CoopStage`, `CoopGrade` など schedule 側で必要な分のみ)
- `src/enums/weapon/*`, `src/enums/coop/coop_enemy.ts`, `src/enums/coop/coop_trophy.ts`, `src/enums/coop/coop_mode.ts`, `src/enums/image_type.ts` 等は schedules 側で参照有無を確認して未使用なら削除

**依存 (`package.json`)**:
- `import { jwt, sign } from 'hono/jwt'` の使用箇所消滅 (hono 本体パッケージは残る)
- `uuid`, `@types/uuid` — 未使用になれば削除
- `lodash`, `@types/lodash` — 未使用になれば削除

**tests**:
- `src/tests/records/`, `src/tests/weapon_records/`, `src/tests/history_details/`, `src/tests/results/`, `src/tests/histories/` 削除
- 保持: `src/tests/schedules/`

**`Bindings` 型** (`src/utils/bindings.ts`):
- 全 KV namespace フィールド削除
- `APP_REDIRECT_URI`, `DISCORD_*`, `JWT_SECRET_KEY` 削除
- 実質空になるので `type Bindings = {}` or ファイルごと廃止

---

## 2. `/v3/schedules` の 3 段キャッシュ設計

### レイヤ役割

| # | レイヤ | 効く場所 | hit で消費するもの | 想定 hit 率 |
|---|---|---|---|---|
| 1 | **Cache Rules Edge cache** | Cloudflare ゾーン (colo 集約) | 数 ms、Worker 実行なし | 高 (最も外側) |
| 2 | **Cache API** (`caches.default` / `hono/cache`) | Worker 内・colo ローカル | Worker 実行はするが fetch なし、数 ms | 中 (Edge miss を吸収) |
| 3 | **`fetch({cf:{cacheEverything}})`** | Cloudflare HTTP キャッシュ | subrequest 1 回、多くは HTTP cache から数 ms | 中 (Cache API miss を吸収) |
| — | 全段 miss | upstream (`splatoon.oatmealdome.me`) | 100–300 ms | 各 colo で 30 分に 1 回程度 |

### Cache Rules 設定 (Dashboard で設定)

- Rule name: `schedules-edge-cache`
- Matching: `Hostname == api.splatnet3.com AND URI Path starts with "/v3/schedules"`
- Actions:
  - Cache eligibility: **Eligible for cache**
  - Edge TTL: **Override origin — 30 minutes**
  - Browser TTL: **Respect origin** (Worker 側で `Cache-Control: public, max-age=1800`)
  - Cache Key: default (URL のみで十分。認証もクエリも無いので)
- (任意) Cache Reserve を有効化して colo 跨ぎで永続化 → 全 colo 合計での upstream fetch を月数回まで削れる

### Cache API + fetch (Worker 内コード)

```ts
// src/api/schedules/index.ts (目標形、疑似コード)
app.get(
  '/',
  cache({
    cacheName: (c) => c.req.url,
    cacheControl: 'public, max-age=1800',
  }),
  async (c) => {
    const url = new URL('/api/v1/three/coop/phases', 'https://splatoon.oatmealdome.me')
    url.searchParams.set('count', '5')
    const res = await fetch(url.href, {
      cf: { cacheEverything: true, cacheTtl: 1800 },
    })
    if (!res.ok) {
      // 上流が落ちても Cache API に残っている古い応答を返せるよう
      // 空配列でハード 500 を返さない選択肢もある
      return c.json({ schedules: [] })
    }
    const query = new CoopScheduleQuery(await res.json())
    return c.json({
      schedules: z.array(CoopSchedule.Response).parse(query.schedules),
    })
  }
)
```

### レスポンスヘッダ

- `Cache-Control: public, max-age=1800` — Cache Rules 側の Respect origin 用
- `Vary` は不要 (URL のみで一意に決まる)
- CORS は `web.splatnet3.com` + `http://localhost:3000` を維持 (現行と同じ)

---

## 3. 速度・KV 使用量の比較

| 項目 | Before | After |
|---|---|---|
| GET 一発の平均レイテンシ | KV read (10–30 ms) + 応答 | Edge hit で数 ms |
| upstream 依存 | cron 30 分毎に upstream fetch | 各 colo で 30 分に 1 回 upstream fetch |
| KV read / GET | 1 (cache から) | **0** |
| KV write / GET | 0 | 0 |
| KV write / 30min | N 件バラ書き + 集約書き | **0** |
| KV namespace 数 | 6 | **0** |
| cron 実行 | 30 分毎に upstream fetch + KV 書き | **なし** |
| コード量 (src 配下) | 現状 | 概算 70%+ 削減 |

**"cron で KV を温める"戦略との差分**:
- Before は cache miss 時に KV read (10–30 ms) が走る
- After は cache miss 時に fetch cacheEverything (多くは Cloudflare HTTP cache 内で数 ms、真の cold のみ upstream RTT)
- 実用上、edge / colo cache が十分に効くのでレイテンシは Before 以下

---

## 4. 実装ステップ

1. **エンドポイント削除**
   - `src/index.ts` の `app.route()` から schedules 以外を撤去
   - `src/api/{imgs,resources,users,auth,version,records,weapon_records,histories,results}/` をディレクトリごと削除
   - `src/api/schedules/index.ts` から POST ハンドラ (deprecated) とコメントアウト部分を削除
2. **cron / scheduled 撤去**
   - `src/utils/handler/scheduled.ts` 削除
   - `src/index.ts` の `export default { fetch, scheduled }` を `export default app` に
   - `wrangler.toml` の `[triggers]` `[env.*.triggers]` を全削除
3. **middleware / utility 掃除**
   - `src/middleware/bearer_token.middleware.ts` 削除
   - `src/utils/resource.ts` 削除
   - `src/utils/discord_oauth.ts` 削除
   - `src/utils/kv.ts` 削除 (schedules は直接 fetch なので namespace helper 不要)
   - `src/utils/hash.ts` 等の未使用 utility を grep で確認して削除
4. **models / enums 掃除**
   - schedules で参照される dto / enum のみ残し、他は削除
   - `bunx tsc --noEmit` を頼りに剥がす
5. **`src/index.ts` の cache middleware 削除**
   - `app.get('*', cache(...))` を撤去 (認証系リーク問題も同時解決)
   - schedules 側で個別に `cache()` を付ける (§2 の疑似コード)
6. **`src/api/schedules/index.ts` を §2 の実装に置換**
   - dummy.json 参照を撤去
   - `fetch(upstream, {cf:{cacheEverything, cacheTtl:1800}})` に切替
7. **`wrangler.toml` を目標形に (§5)**
8. **`Bindings` 型を空 or 廃止**
9. **未使用パッケージを剥がす** (`bun pm ls` と grep)
10. **tests 掃除** (schedules 系のみ残す)
11. **Cache Rules を Dashboard に追加** (§2 参照)
12. **README を更新** (対応エンドポイントを schedules のみに)

---

## 5. `wrangler.toml` の目標形

```toml
name = "av5ja"
main = "src/index.ts"
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2024-09-02"
send_metrics = true

[observability]
enabled = true
head_sampling_rate = 1

[env.development]
workers_dev = true

[env.development.observability]
enabled = true
head_sampling_rate = 1

[env.production]

[env.production.observability]
enabled = true
head_sampling_rate = 1

[dev]
ip = "0.0.0.0"
port = 18787
```

- KV namespace、cron trigger、いずれも消える
- Custom Domain (`api.splatnet3.com`) は Dashboard 側で維持

---

## 6. 未確認・確認したい事項

1. **upstream (`splatoon.oatmealdome.me`) の可用性・利用規約** — 直接プロキシする形で問題ないか。長期的に安定して依存できる相手か。
2. **`GET /v3/schedules` のレスポンス形状** — 現状 dummy.json を返している。dummy と upstream 実データの形状差分を要確認 (Zod パースで拾える想定)。
3. **`api.splatnet3.com` の Cache Rules 現状** — Dashboard 側で既に何か設定されていないか要確認 (競合 or 上書き)。
4. **削除対象エンドポイントを叩いている外部クライアント** — Observability の直近 30 日ログで想定外の依存がないか確認。
5. **KV namespace 削除の順序** — wrangler.toml から抜くのと KV 実データ削除は分けて実施 (万一の rollback 用に KV 側は数日残す)。

---

## 7. リスク

- **upstream 側の rate limit** — 各 colo で 30 分に 1 回程度なら問題ないはずだが、初回大量アクセス時に注意。Cache Reserve 有効化で更に緩和可能。
- **upstream の互換性ブレ** — Zod パースで検出、失敗時は空配列を返す設計 (§2)。
- **Cache Rules の設定漏れ** — 未設定でも Cache API + fetch cache で数 ms 応答は取れるので致命的ではない。Edge hit のメリットが乗らないだけ。

---

## 8. 参考

- Cloudflare Docs: Cache Rules (developers.cloudflare.com/cache/how-to/cache-rules)
- Cloudflare Docs: Cache API (`caches.default`)
- Cloudflare Docs: `fetch` の `cf.cacheEverything` / `cf.cacheTtl`
- Cloudflare Docs: Cache Reserve
- 本計画は Fable によるレビュー (2026-07-14) と、その後の方針確定 (2026-07-14: `/v3/schedules` 以外全撤去、KV / cron 廃止、3 段キャッシュで速度維持) を反映
