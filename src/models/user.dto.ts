import { z } from '@hono/zod-openapi'

export namespace Thunder {
  export const User = z
    .object({
      id: z.string(),
      avatar: z.string(),
      username: z.string(),
      nsa_id: z.string().nullable().default(null),
      npln_user_id: z.string().nullable().default(null),
      membership: z.boolean().default(false),
      expires_in: z.number().nullable().default(null)
    })
    .transform((value) => {
      return {
        ...value,
        thumbnail_url: new URL(`avatars/${value.id}/${value.avatar}.webp`, 'https://cdn.discordapp.com/').href
      }
    })

  export const Token = z.object({
    aud: z.string(),
    exp: z.number().min(0),
    iat: z.number().min(0),
    iss: z.string(),
    jti: z.string().uuid(),
    nbf: z.number().min(0),
    sub: z.string(),
    typ: z.enum(['access_token']),
    usr: User
  })

  export type User = z.infer<typeof User>
  export type Token = z.infer<typeof Token>
}
