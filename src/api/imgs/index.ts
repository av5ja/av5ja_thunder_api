import { ImageType } from '@/enums/image_type'
import { HTTPMethod } from '@/enums/method'
import type { Bindings } from '@/utils/bindings'
import { KV } from '@/utils/kv'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/{type}/{raw_id}',
    tags: ['画像'],
    summary: '取得',
    description: '画像データへリダイレクトします',
    request: {
      params: z.object({
        type: z.preprocess((v) => v as string, z.nativeEnum(ImageType)),
        raw_id: z
          .preprocess((v) => (v === undefined ? undefined : Number.parseInt(v as string, 10)), z.number().int())
          .openapi({
            description: '内部ID'
          })
      })
    },
    responses: {
      302: {
        description: 'バージョン'
      }
    }
  }),
  async (c) => {
    const { type, raw_id } = c.req.valid('param')
    return c.redirect(await KV.RESOURCE.get(c, type, raw_id))
  }
)
