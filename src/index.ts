import { OpenAPIHono as Hono, z } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { cache } from 'hono/cache'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import type { JwtVariables as Variables } from 'hono/jwt'
import { logger } from 'hono/logger'
import { ZodError } from 'zod'
import { app as auth } from './api/auth'
import { app as histories } from './api/histories'
import { app as imgs } from './api/imgs'
import { app as records } from './api/records'
import { app as results } from './api/results'
import { app as schedules } from './api/schedules'
import { app as users } from './api/users'
import { app as version } from './api/version'
import { app as weapon_records } from './api/weapon_records'
import type { Bindings } from './utils/bindings'
import { scheduled } from './utils/handler/scheduled'
import { reference, specification } from './utils/openapi'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  in: 'header',
  description: 'Bearer Token'
})

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Tokyo')

app.use(csrf())
app.get('/docs', apiReference(reference))
app.doc('/specification', specification)
app.notFound((c) => c.redirect('/docs'))
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://web.splatnet3.com'],
    credentials: true
  })
)
switch (process.env.NODE_ENV) {
  case 'production':
    app.get(
      '*',
      cache({
        cacheName: async (c) => c.req.url,
        cacheControl: 'max-age=600'
      })
    )
    break
  default:
    app.use(logger())
    break
}
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    console.error(error.message)
    return c.json({ message: error.message, description: error.cause }, error.status)
  }
  if (error instanceof ZodError) {
    console.error(JSON.parse(error.message))
    return c.json({ message: JSON.parse(error.message), description: error.cause }, 400)
  }
  console.error(error)
  return c.json({ message: error.message }, 500)
})
app.route('/v3/schedules', schedules)
app.route('/v3/results', results)
app.route('/v1/histories', histories)
app.route('/v1/records', records)
app.route('/v1/weapon_records', weapon_records)
app.route('/v1/version', version)
app.route('/v1/auth', auth)
app.route('/v1/users', users)
app.route('/v1/imgs', imgs)

export default {
  fetch: app.fetch,
  scheduled
}
