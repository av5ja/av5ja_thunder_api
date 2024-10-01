import { Schema as S } from '@effect/schema'

const ConfigSchema = S.Struct({
  base_url: S.String
})

type ConfigSchema = typeof ConfigSchema.Type

const decoder = S.decodeEither(ConfigSchema)

export const config: ConfigSchema = decoder({
  base_url: 'http://localhost:8787'
}).pipe((result) => {
  if (result._tag === 'Left') {
    throw new Error(result.left.message)
  }
  return result.right
})
