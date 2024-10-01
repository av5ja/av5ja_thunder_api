import { HTTPMethod } from '@/enums/method'
import { bearerToken } from '@/middleware/bearer_token.middleware'
import { CoopHistoryDetail } from '@/models/coop_history_detail.dto'
import { CoopResult, CoopResultQuery } from '@/models/coop_result.dto'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { resource } from '@/utils/resource'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    middleware: [resource],
    path: '/',
    tags: ['リザルト'],
    summary: '一覧詳細',
    description: 'リザルト一覧詳細を返します',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CoopResult.Request.openapi({
              description: 'CoopHistoryQuery+CoopHistoryDetailQuery'
            })
          }
        }
      }
    },
    responses: {
      201: {
        content: {
          'application/json': {
            schema: CoopResult.Response
          }
        },
        description: 'リザルト一覧詳細'
      },
      ...BadRequestResponse()
    }
  }),
  async (c) => {
    c.req.valid('json')
    const body: CoopResultQuery = new CoopResultQuery(await c.req.json())
    // // write_results(c, body.results)
    return c.json(body)
  }
)

// app.openapi(
//   createRoute({
//     method: HTTPMethod.GET,
//     middleware: [bearerToken],
//     path: '/',
//     tags: ['リザルト'],
//     summary: '一覧取得',
//     description: 'リザルト一覧を取得します',
//     request: {
//       query: z.object({
//         cursor: z.string().optional().openapi({
//           default: undefined,
//           description: 'カーソル'
//         }),
//         limit: z
//           .preprocess(
//             // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//             (input: any) => (input === undefined ? 10 : Number.parseInt(input, 10)),
//             z.number().int().min(0).max(200).default(10)
//           )
//           .openapi({
//             default: 10,
//             description: '取得件数'
//           })
//       })
//     },
//     responses: {
//       200: {
//         content: {
//           'application/json': {
//             schema: z.object({
//               cursor: z.string().nullable().openapi({
//                 description: 'カーソル'
//               }),
//               list_complete: z.boolean().openapi({
//                 description: '結果'
//               }),
//               results: z.array(CoopHistoryDetail.Response).openapi({
//                 description: 'リザルト'
//               }),
//               count: z.number().int().min(1).max(200).default(100).openapi({
//                 default: 100,
//                 description: '取得件数'
//               })
//             })
//           }
//         },
//         description: 'リザルト一覧詳細'
//       },
//       ...BadRequestResponse()
//     }
//   }),
//   async (c) => {
//     const { npln_user_id } = c.get('jwtPayload')
//     if (npln_user_id === undefined) {
//       throw new HTTPException(404, { message: 'Not Found.' })
//     }
//     const { cursor, limit } = c.req.valid('query')
//     const result: KVNamespaceListResult<string, string> = await c.env.RESULTS.list({
//       prefix: npln_user_id,
//       limit: limit,
//       cursor: cursor
//     })
//     const keys: string[] = result.keys.map((key) => key.name)
//     const results: CoopHistoryDetail.Response[] = z
//       .array(CoopHistoryDetail.Response)
//       .parse(await Promise.all(keys.map((key) => c.env.RESULTS.get(key, { type: 'json' }))))
//     return c.json({
//       // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//       cursor: (result as any)?.cursor || null,
//       list_complete: result.list_complete,
//       results,
//       count: keys.length
//     })
//   }
// )

// /**
//  * KVにデータを書き込む
//  * @param c
//  * @param results
//  */
// const write_results = async <T extends CoopHistoryDetail.Response>(
//   c: Context<{ Bindings: Bindings }>,
//   results: T[]
// ) => {
//   c.executionCtx.waitUntil(
//     Promise.all(
//       results.map((result) =>
//         c.env.RESULTS.put(`${result.id.nplnUserId}:${result.id.playTime}`, JSON.stringify(result))
//       )
//     )
//   )
// }
