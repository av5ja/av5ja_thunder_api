import { OpenAPIHono as Hono, z } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { cache } from 'hono/cache'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { ZodError } from 'zod'
import { app as histories } from './api/histories'
import { app as records } from './api/records'
import { app as resources } from './api/resources'
import { app as results } from './api/results'
import { app as schedules } from './api/schedules'
import { app as version } from './api/version'
import { app as weapon_records } from './api/weapon_records'
import type { Bindings } from './utils/bindings'
import { scheduled } from './utils/handler/scheduled'
import { reference, specification } from './utils/openapi'

const app = new Hono<{ Bindings: Bindings }>()

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Tokyo')

app.use(logger())
app.use(csrf())
app.use('*', cors())
app.get('/docs', apiReference(reference))
// app.get(
//   '*',
//   cache({
//     cacheName: 'av5ja',
//     cacheControl: 'max-age=3600'
//   })
// )
app.doc('/specification', specification)
app.notFound((c) => c.redirect('docs'))
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ message: error.message, description: error.cause }, error.status)
  }
  if (error instanceof ZodError) {
    return c.json({ message: JSON.parse(error.message), description: error.cause }, 400)
  }
  console.error(error)
  return c.json({ message: 'Internal Server Error' }, 500)
})
// app.route('/v3/schedules', schedules)
app.route('/v1/resouces', resources)
app.route('/v3/results', results)
app.route('/v1/histories', histories)
app.route('/v1/records', records)
app.route('/v1/weapon_records', weapon_records)
app.route('/v1/version', version)

export default {
  port: 3000,
  fetch: app.fetch,
  scheduled
}
