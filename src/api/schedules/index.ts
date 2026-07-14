import { createRoute, OpenAPIHono as Hono, z } from '@hono/zod-openapi'
import { cache } from 'hono/cache'
import { HTTPMethod } from '@/enums/method'
import { CoopSchedule, CoopScheduleQuery } from '@/models/coop_schedule.dto'
import type { Bindings } from '@/utils/bindings'

export const app = new Hono<{ Bindings: Bindings }>()

const UPSTREAM_URL = 'https://splatoon.oatmealdome.me/api/v1/three/coop/phases?count=5'
const EDGE_TTL_SECONDS = 1800

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    middleware: [
      cache({
        cacheName: (c) => c.req.url,
        cacheControl: `public, max-age=${EDGE_TTL_SECONDS}`
      })
    ],
    path: '/',
    tags: ['スケジュール'],
    summary: '一覧取得',
    description: 'スケジュール一覧を取得します',
    request: {},
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              schedules: z.array(CoopSchedule.Response)
            })
          }
        },
        description: 'スケジュール一覧'
      }
    }
  }),
  async (c) => {
    const upstream = await fetch(UPSTREAM_URL, {
      cf: { cacheEverything: true, cacheTtl: EDGE_TTL_SECONDS }
    })
    if (!upstream.ok) {
      return c.json({ schedules: [] })
    }
    const query = new CoopScheduleQuery(await upstream.json())
    return c.json({ schedules: query.schedules })
  }
)
