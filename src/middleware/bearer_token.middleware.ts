import type { Bindings } from '@/utils/bindings'
import type { Context, Next } from 'hono'
import { jwt } from 'hono/jwt'
import { AlgorithmTypes } from 'hono/utils/jwt/jwa'

/**
 * 認証されたユーザーのみがアクセスできるエンドポイント
 * @param c
 * @param next
 * @returns
 */
export const bearerToken = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  return jwt({
    secret: c.env.JWT_SECRET_KEY,
    cookie: {
      key: 'iksm_session'
    },
    alg: AlgorithmTypes.HS256
  })(c, next)
}
