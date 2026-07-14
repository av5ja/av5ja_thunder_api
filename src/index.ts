import { OpenAPIHono as Hono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { ZodError } from 'zod'
import { app as schedules } from './api/schedules'
import type { Bindings } from './utils/bindings'
import { scheduled } from './utils/handler/scheduled'
import { reference, specification } from './utils/openapi'

const app = new Hono<{ Bindings: Bindings }>()

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
if (process.env.NODE_ENV !== 'production') {
  app.use(logger())
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

export default {
  fetch: app.fetch,
  scheduled
}
