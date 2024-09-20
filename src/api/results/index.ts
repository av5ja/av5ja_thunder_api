import { HTTPMethod } from '@/enums/method'
import { CoopResult, CoopResultQuery } from '@/models/coop_result.dto'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
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
    console.log('[COOP RESULT]:', body.assetURLs.length)
    return c.json(body)
  }
)
