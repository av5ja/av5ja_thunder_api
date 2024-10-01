import { z } from '@hono/zod-openapi'

export const RawId = <T extends z.EnumLike>(S: T) =>
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  z.preprocess((input: any) => {
    const pattern: RegExp = /-([0-9-]+)$/
    const match: RegExpMatchArray | null = atob(input as string).match(pattern)
    if (match === null) {
      return input
    }
    const value: number = Number.parseInt(match[1], 10)
    if (Number.isNaN(value)) {
      return input
    }
    return value
  }, z.nativeEnum(S))

export const RawInt =
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  z.preprocess((input: any) => {
    const pattern: RegExp = /-([0-9-]+)$/
    const match: RegExpMatchArray | null = atob(input as string).match(pattern)
    if (match === null) {
      return input
    }
    const value: number = Number.parseInt(match[1], 10)
    if (Number.isNaN(value)) {
      return input
    }
    return value
  }, z.number().int().min(0))

export type RawInt = z.infer<typeof RawInt>
export type RawId<T extends z.EnumLike> = z.infer<ReturnType<typeof RawId<T>>>
