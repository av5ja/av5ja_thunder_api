import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

const Key = z.object({
  alg: z.enum(['RS256']),
  e: z.string(),
  n: z.string(),
  kid: z.string(),
  kty: z.enum(['RSA']),
  usage: z.enum(['id_token']),
  use: z.enum(['sig']),
  x5c: z.array(z.string())
})

export const CertificateList = z.object({
  keys: z.array(Key)
})

const Header = z.object({
  alg: z.enum([
    'HS256',
    'HS384',
    'HS512',
    'RS256',
    'RS384',
    'RS512',
    'PS256',
    'PS384',
    'PS512',
    'ES256',
    'ES384',
    'ES512',
    'EdDSA'
  ]),
  jku: z.string().url(),
  kid: z.string(),
  typ: z.enum(['JWT'])
})

export const Payload = z
  .object({
    iss: z.enum(['api-lp1.znc.srv.nintendo.net']),
    aud: z.enum(['6633677291552768']),
    jti: z.string().uuid(),
    sub: z.number(),
    links: z.object({
      networkServiceAccount: z.object({
        id: z.string().length(16)
      })
    }),
    membership: z.object({
      active: z.boolean()
    })
  })
  .transform((data) => {
    return {
      ...data,
      nsa_id: data.links.networkServiceAccount.id
    }
  })

export const JWTToken = z.object({
  header: Header,
  payload: Payload
})

export type Payload = z.infer<typeof Payload>
export type CertificateList = z.infer<typeof CertificateList>
export type JWTToken = z.infer<typeof JWTToken>
export type Key = z.infer<typeof Key>
