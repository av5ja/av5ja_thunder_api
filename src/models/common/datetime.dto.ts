import { z } from '@hono/zod-openapi'
import dayjs from 'dayjs'

export const DateTime = z
  .string()
  .datetime()
  .nullable()
  .transform((value) => (value === null ? null : dayjs(value).toISOString()))

export type DateTime = z.infer<typeof DateTime>
