import { z } from '@hono/zod-openapi'
import dayjs from 'dayjs'

export const S3URL = z.preprocess(
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  (input: any) => {
    const url: URL = new URL(input)
    const expires: string | null = url.searchParams.get('Expires')
    const expires_in: number = expires === null ? 0 : Number.parseInt(expires, 10)
    const pattern: RegExp = /prod\/v(\d{1})\/.*([a-f0-9]{64})/
    const match: RegExpMatchArray | null = url.pathname.match(pattern)
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      pathname: url.pathname,
      expiration: expires_in,
      expires_in: dayjs(expires_in * 1000).toISOString(),
      searchParams: Object.fromEntries(url.searchParams),
      raw_value: input,
      version: match === null ? 0 : Number.parseInt(match[1], 10),
      key: match === null ? null : match[2]
    }
  },
  z.object({
    protocol: z.string(),
    hostname: z.string(),
    pathname: z.string(),
    expires_in: z.string().datetime(),
    expiration: z.number().int(),
    raw_value: z.string().url(),
    version: z.number().int().min(0).max(3),
    key: z.string()
  })
)

export const S3ImageURL = z.object({
  image: z.object({
    url: S3URL
  })
})

export type S3URL = z.infer<typeof S3URL>
export type S3ImageURL = z.infer<typeof S3ImageURL>
