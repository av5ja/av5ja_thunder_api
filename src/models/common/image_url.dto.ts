import { z } from '@hono/zod-openapi'

export const ImageURL = z.object({
  image: z.object({
    url: z.string().url()
  })
})

export type ImageURL = z.infer<typeof ImageURL>
