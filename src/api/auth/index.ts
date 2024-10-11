import { HTTPMethod } from '@/enums/method'
import type { Bindings } from '@/utils/bindings'
import { DiscordOAuth } from '@/utils/discord_oauth'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import { setCookie } from 'hono/cookie'

export const app = new Hono<{ Bindings: Bindings }>()

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/id_token',
    tags: ['トークン'],
    summary: 'IDトークン',
    description: '認証用のトークンを発行してHTTP OnlyなCookieに認証情報を保存します',
    request: {
      query: z.object({
        code: z.string(),
        state: z.preprocess(
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (input: any) => Object.fromEntries(new URLSearchParams(input).entries()),
          z.object({
            nsaId: z.string(),
            nplnUserId: z.string()
          })
        )
      })
    },
    responses: {
      302: {
        description: 'リダイレクト'
      }
    }
  }),
  async (c) => {
    const { code, state } = c.req.valid('query')
    const token: DiscordOAuth.Token = await DiscordOAuth.create_token(c, code, state.nsaId, state.nplnUserId)
    // setCookie(c, 'iksm_session', token, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'Lax'
    // })
    return c.redirect(
      `npf5f8ee15ea46f2ea1://auth#access_token=${token.access_token}&refresh_token=${token.refresh_token}`
    )
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/refresh_token',
    tags: ['トークン'],
    summary: 'リフレッシュトークン',
    description: 'リフレッシュトークンを利用してアクセストークンを更新します',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              refreshToken: z.string()
            })
          }
        }
      }
    },
    responses: {
      302: {
        description: 'リダイレクト'
      }
    }
  }),
  async (c) => {
    const { refreshToken } = c.req.valid('json')
    const token: string = await DiscordOAuth.create_token(c, code)
    setCookie(c, 'iksm_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    })
    return c.redirect(c.env.APP_REDIRECT_URI)
  }
)

// const get_npln_user_id = async (
//   c: Context<{ Bindings: Bindings }>,
//   bullet_token: BulletToken,
//   revision: string
// ): Promise<string> => {
//   const url: URL = new URL('api/graphql', 'https://api.lp1.av5ja.srv.nintendo.net')
//   const headers: Headers = new Headers({
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${bullet_token.bulletToken}`,
//     'X-Web-View-Ver': revision
//   })
//   const response = await fetch(url.href, {
//     method: HTTPMethod.POST,
//     headers: headers,
//     body: JSON.stringify({
//       extensions: {
//         persistedQuery: {
//           version: 1,
//           sha256Hash: 'e11a8cf2c3de7348495dea5cdcaa25e0c153541c4ed63f044b6c174bc5b703df'
//         }
//       },
//       variables: {}
//     })
//   })
//   if (response.ok) {
//     const histoies = new CoopHistoryQuery(await response.json()).histories
//     if (histoies.length === 0) {
//       throw new HTTPException(404, { message: 'Not Found' })
//     }
//     if (histoies[0].results.length === 0) {
//       throw new HTTPException(404, { message: 'Not Found' })
//     }
//     return histoies[0].results[0].nplnUserId
//   }
//   throw new HTTPException(response.status as StatusCode, { message: response.statusText })
// }

// const create_token = async (c: Context<{ Bindings: Bindings }>, token: string): Promise<string> => {
//   const revision: string = await get_revision()
//   const gtoken: Payload = await verify_token(c, token)
//   const bullet_token: BulletToken = await get_bullet_token(c, token, revision)
//   const npln_user_id: string = await get_npln_user_id(c, bullet_token, revision)
//   const current_time: Dayjs = dayjs()
//   const payload: JWTPayload = fromPairs(
//     sortBy(
//       toPairs({
//         aud: gtoken.aud,
//         iss: new URL(c.req.url).hostname,
//         jti: gtoken.jti,
//         typ: 'id_token',
//         nbf: current_time.unix(),
//         iat: current_time.unix(),
//         exp: current_time.add(1, 'month').unix(),
//         npln_user_id: npln_user_id,
//         nsa_id: gtoken.nsa_id,
//         membership: gtoken.membership.active
//       })
//     )
//   )
//   return await sign(payload, c.env.JWT_SECRET_KEY, AlgorithmTypes.HS256)
// }

// const get_bullet_token = async (
//   c: Context<{ Bindings: Bindings }>,
//   token: string,
//   revision: string
// ): Promise<BulletToken> => {
//   const url: URL = new URL('api/bullet_tokens', 'https://api.lp1.av5ja.srv.nintendo.net')
//   const headers: Headers = new Headers({
//     Accept: '*/*',
//     'Accept-Encoding': 'gzip, deflate, br, zstd',
//     'Accept-Language': 'ja-JP',
//     'Cache-Control': 'no-cache',
//     'Content-Length': '0',
//     'Content-Type': 'applcation/json',
//     Cookie: `_gtoken=${token}`,
//     Origin: 'https://api.lp1.av5ja.srv.nintendo.net',
//     Pragme: 'no-cache',
//     Priority: 'u=1, i',
//     Referer: 'https://api.lp1.av5ja.srv.nintendo.net/',
//     'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
//     'Sec-Ch-Ua-Mobile': '?0',
//     'Sec-Ch-Ua-Platform': '"macOS"',
//     'Sec-Fetch-Dest': 'empty',
//     'Sec-Fetch-Mode': 'cors',
//     'Sec-Fetch-Site': 'same-origin',
//     'User-Agent':
//       'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
//     'X-NaCountry': 'JP',
//     'X-Web-View-Ver': revision
//   })
//   const response = await fetch(url.href, {
//     method: HTTPMethod.POST,
//     headers: headers
//   })
//   if (response.ok) {
//     return BulletToken.parse(await response.json())
//   }
//   throw new HTTPException(response.status as StatusCode, { message: response.statusText })
// }

// const verify_token = async (c: Context, gtoken: string): Promise<Payload> => {
//   const token: JWTToken = JWTToken.parse(decode(gtoken))
//   const keys: Key[] = CertificateList.parse(await (await fetch(new URL(token.header.jku).href)).json()).keys
//   const key: Key | undefined = keys.find((key) => key.kid === token.header.kid)
//   if (key === undefined) {
//     throw new HTTPException(401, { message: 'Unauthorized.' })
//   }
//   try {
//     return Payload.parse(await verify(gtoken, key, token.header.alg))
//   } catch (error) {
//     if (error instanceof JwtTokenExpired) {
//       throw new HTTPException(401, { message: 'Token has expired.' })
//     }
//     if (error instanceof JwtHeaderInvalid) {
//       throw new HTTPException(401, { message: 'Invalid token header.' })
//     }
//     if (error instanceof JwtTokenInvalid) {
//       throw new HTTPException(401, { message: 'Invalid token.' })
//     }
//     if (error instanceof JwtAlgorithmNotImplemented) {
//       throw new HTTPException(400, { message: 'Unsupported token signing algorithm.' })
//     }
//     if (error instanceof JwtTokenNotBefore) {
//       throw new HTTPException(401, { message: 'Token not valid yet.' })
//     }
//     if (error instanceof JwtTokenIssuedAt) {
//       throw new HTTPException(401, { message: 'Token used before issued.' })
//     }
//     if (error instanceof JwtTokenSignatureMismatched) {
//       throw new HTTPException(401, { message: 'Invalid token signature.' })
//     }
//     console.error(error)
//     throw new HTTPException(400, { message: 'Bad Request.' })
//   }
// }
