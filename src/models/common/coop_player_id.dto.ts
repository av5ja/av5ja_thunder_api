import { z } from '@hono/zod-openapi'
import dayjs from 'dayjs'

export const CoopPlayerId = z.preprocess(
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  (input: any) => {
    if (typeof input !== 'string') {
      return input
    }
    const text: string = atob(input)
    const pattern: RegExp =
      /^([A-Za-z]+)-([a-z]{1})-([a-z0-9]{20}):([0-9T]{15})_([0-9a-f-]{36}):([a-z]{1})-([a-z0-9]{20})$/
    const match: RegExpMatchArray | null = text.match(pattern)
    if (match === null) {
      return input
    }
    const [, type, , , playTime, uuid, , nplnUserId] = match
    return {
      // rawValue: input,
      type: type,
      nplnUserId: nplnUserId,
      playTime: dayjs(playTime, 'YYYYMMDDTHHmmss').toISOString(),
      uuid: uuid
    }
  },
  z
    .object({
      type: z.string(),
      nplnUserId: z.string(),
      playTime: z.string().datetime(),
      uuid: z.string().uuid()
      // hostNplnUserId: z.string(),
      // rawValue: z.string()
    })
    .transform((object) => {
      return {
        ...object
      }
    })
)

export type CoopPlayerId = z.infer<typeof CoopPlayerId>
