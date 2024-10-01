import { HTTPMethod } from '@/enums/method'
import { CoopSchedule } from '@/models/coop_schedule.dto'
import { StageSchedule, StageScheduleQuery } from '@/models/stage_schedule.dto'
import type { Bindings } from '@/utils/bindings'
import { resource } from '@/utils/resource'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import dummy from './dummy.json'

export const app = new Hono<{ Bindings: Bindings }>()

const get_schedules = async (c: Context<{ Bindings: Bindings }>): Promise<CoopSchedule.Response[]> => {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const body: any | null = await c.env.CACHES.get('api.splatnet3.com/v3/schedules', { type: 'json' })
  if (body === null) {
    return []
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return body.map((schedule: any) => CoopSchedule.Response.parse(schedule))
}

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
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
    // const schedules: CoopSchedule.Response[] = await get_schedules(c)
    return c.json(z.object({ schedules: z.array(CoopSchedule.Response) }).parse(dummy))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    security: [{ AuthorizationApiKey: [] }],
    middleware: [resource],
    deprecated: true,
    path: '/',
    tags: ['スケジュール'],
    summary: '一覧取得',
    description: 'スケジュール一覧を追加します',
    request: {
      body: {
        content: {
          'application/json': {
            schema: StageSchedule.Request
          }
        }
      }
    },
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
    c.req.valid('json')
    const body: StageScheduleQuery = new StageScheduleQuery(await c.req.json())
    return c.json(body)
  }
)

// app.openapi(
//   createRoute({
//     method: HTTPMethod.PATCH,
//     security: [{ AuthorizationApiKey: [] }],
//     path: '/',
//     tags: ['スケジュール'],
//     summary: '更新',
//     description: '更新',
//     request: {},
//     responses: {
//       200: {
//         type: 'application/json',
//         description: '更新'
//       }
//     }
//   }),
//   async (c) => {
//     await c.env.Cache.put('api.splatnet3.com/v3/schedules', JSON.stringify(dummy.schedules))
//     return c.json(dummy)
//   }
// )

// app.openapi(
//   createRoute({
//     method: HTTPMethod.DELETE,
//     path: '/',
//     tags: ['スケジュール'],
//     summary: '一括削除',
//     description: 'スケジュールを一括削除します',
//     request: {},
//     responses: {
//       204: {
//         description: '削除'
//       }
//     }
//   }),
//   async (c) => {
//     const keys: string[] = (await c.env.Schedule.list({ limit: 50 })).keys.map((schedule) => schedule.name)
//     c.executionCtx.waitUntil(Promise.all(keys.map(async (key) => c.env.Schedule.delete(key))))
//     return c.json({})
//   }
// )
