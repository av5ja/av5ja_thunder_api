import { Schema as S } from '@effect/schema'
import type { ParseError } from '@effect/schema/ParseResult'
import type { Either } from 'effect'

export declare type ClassConstructor<T> = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  new (...args: any[]): T
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function decode<T>(schema: S.Schema<T>, body: any): Either.Either<T, ParseError> {
  const decoder = S.decodeEither(schema, { onExcessProperty: 'ignore', errors: 'first' })
  return decoder(body)
}
