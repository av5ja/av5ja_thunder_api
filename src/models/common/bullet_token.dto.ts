import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'

export const BulletToken = z.object({
  bulletToken: z.string(),
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  is_noe_country: z.preprocess((input: any) => input === 'true', z.boolean()),
  lang: z.enum(['ja-JP', 'en-US', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'ru-RU', 'zh-CN', 'ko-KR', 'zh-TW'])
})

export type BulletToken = z.infer<typeof BulletToken>
