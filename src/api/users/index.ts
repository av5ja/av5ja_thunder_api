import { HTTPMethod } from '@/enums/method'
import { bearerToken } from '@/middleware/bearer_token.middleware'
import { Thunder } from '@/models/user.dto'
import type { Bindings } from '@/utils/bindings'
import { KV } from '@/utils/kv'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/',
    middleware: [bearerToken],
    tags: ['ユーザー'],
    summary: 'ユーザー情報',
    description: 'Thunder3+のユーザー情報を返します',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: Thunder.User
          }
        },
        description: 'バージョン'
      }
    }
  }),
  async (c) => {
    const { sub } = c.get('jwtPayload')
    return c.json(await KV.USER.get(c, sub))
  }
)
