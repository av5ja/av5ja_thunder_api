import { createRoute, OpenAPIHono as Hono, z } from '@hono/zod-openapi'
import { cache } from 'hono/cache'
import { HTTPMethod } from '@/enums/method'
import { CoopSchedule, CoopScheduleQuery } from '@/models/coop_schedule.dto'
import type { Bindings } from '@/utils/bindings'
import { createPrismaClient } from '@/utils/prisma'

export const app = new Hono<{ Bindings: Bindings }>()

const UPSTREAM_URL = 'https://splatoon.oatmealdome.me/api/v1/three/coop/phases?count=5'
const EDGE_TTL_SECONDS = 1800

const readFromD1 = async (env: Bindings): Promise<CoopSchedule.Response[]> => {
  const prisma = createPrismaClient(env)
  const rows = await prisma.schedule.findMany({
    orderBy: { startTime: 'desc' }
  })
  return rows.map((row) =>
    CoopSchedule.Response.parse({
      startTime: row.startTime,
      endTime: row.endTime,
      mode: row.mode,
      rule: row.rule,
      bossId: row.bossId ?? undefined,
      stageId: row.stageId,
      rareWeapons: JSON.parse(row.rareWeapons),
      weaponList: JSON.parse(row.weaponList)
    })
  )
}

const readFromUpstream = async (): Promise<CoopSchedule.Response[]> => {
  const upstream = await fetch(UPSTREAM_URL, {
    cf: { cacheEverything: true, cacheTtl: EDGE_TTL_SECONDS }
  })
  if (!upstream.ok) return []
  return new CoopScheduleQuery(await upstream.json()).schedules
}

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
    const schedules = await readFromD1(c.env).catch(() => [] as CoopSchedule.Response[])
    if (schedules.length > 0) {
      return c.json({ schedules })
    }
    return c.json({ schedules: await readFromUpstream() })
  }
)
