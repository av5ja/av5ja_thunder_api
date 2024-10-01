import { HTTPMethod } from '@/enums/method'
import { bearerToken } from '@/middleware/bearer_token.middleware'
import { S3URL } from '@/models/common/s3_url.dto'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/',
    tags: ['情報'],
    summary: 'リソース',
    description: 'アセット一覧のURLを返します',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.array(z.string().url())
          }
        },
        description: 'アセットURLの一覧'
      }
    }
  }),
  async (c) => {
    const keys: string[] = (await c.env.RESOURCES.list({ limit: 200 })).keys.map((key) => key.name)
    const assetURLs: S3URL[] = (await Promise.all(keys.map((key) => c.env.RESOURCES.get(key, { type: 'text' }))))
      .filter((value) => value !== null)
      .sort()
      .map((value) => S3URL.parse(value))
    return c.json(assetURLs.map((url) => url.raw_value))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.DELETE,
    middleware: [bearerToken],
    path: '/',
    tags: ['情報'],
    summary: 'リソース',
    description: 'アセット一覧のURLを全削除します',
    responses: {
      204: {
        description: '成功'
      }
    }
  }),
  async (c) => {
    const keys: string[] = (await c.env.RESOURCES.list({ limit: 200 })).keys.map((key) => key.name)
    await Promise.all(keys.map((key) => c.env.RESOURCES.delete(key)))
    return new Response(null, { status: 204 })
  }
)
