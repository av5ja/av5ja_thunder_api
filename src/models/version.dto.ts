import { z } from '@hono/zod-openapi'

export const VersionModel = z.object({
  game: z.string().openapi({ description: 'ゲームバージョン', example: '9.1.0' }),
  app: z.string().openapi({ description: 'アプリバージョン', example: '2.10.0' }),
  web: z.string().openapi({ description: 'ウェブバージョン', example: '6.0.0-9f87c815' })
})

export const LookupModel = z
  .object({
    results: z.array(
      z.object({
        bundleId: z.string(),
        userRatingCount: z.number().int().min(0),
        trackId: z.number().int().min(0),
        price: z.number().min(0),
        userRatingCountForCurrentVersion: z.number().int().min(0),
        averageUserRating: z.number().min(0),
        averageUserRatingForCurrentVersion: z.number().min(0),
        fileSizeBytes: z.string().pipe(z.coerce.number()),
        minimumOsVersion: z.string(),
        releaseDate: z.string().datetime(),
        currentVersionReleaseDate: z.string().datetime(),
        version: z.string().openapi({ description: 'バージョン', example: '2.10.0' })
      })
    )
  })
  .transform((object) => {
    return object.results[0]
  })

export type LookupModel = z.infer<typeof LookupModel>
export type VersionModel = z.infer<typeof VersionModel>
