import { z } from '@hono/zod-openapi'

export const CoopData = <T extends z.AnyZodObject>(S: T) =>
  z.object({
    data: S
  })

export type CoopData<T extends z.AnyZodObject> = z.infer<ReturnType<typeof CoopData<T>>>
