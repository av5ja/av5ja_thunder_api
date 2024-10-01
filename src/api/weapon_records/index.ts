import { HTTPMethod } from '@/enums/method'
import { WeaponRecord, WeaponRecordQuery } from '@/models/weapon_record.dto'
import { BadRequestResponse } from '@/utils/bad_request.response'
import type { Bindings } from '@/utils/bindings'
import { resource } from '@/utils/resource'
import { OpenAPIHono as Hono, createRoute } from '@hono/zod-openapi'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    middleware: [resource],
    path: '/',
    tags: ['記録'],
    deprecated: true,
    summary: 'ブキ',
    description: 'ブキのURLを登録します',
    request: {
      body: {
        content: {
          'application/json': {
            schema: WeaponRecord.Request.openapi({
              description: 'WeaponRecordQuery'
            })
          }
        }
      }
    },
    responses: {
      204: {
        description: 'ブキ記録'
      },
      ...BadRequestResponse()
    }
  }),
  async (c) => {
    const body: WeaponRecordQuery = new WeaponRecordQuery(await c.req.json())
    return new Response(null, { status: 204 })
  }
)
