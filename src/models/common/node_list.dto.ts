import { z } from '@hono/zod-openapi'

export const NodeList = <T extends z.ZodTypeAny>(N: T) =>
  z.object({
    nodes: z.array(N)
  })
