import { Hash2Id } from '@/enums/weapon/main'
import { HTTPException } from 'hono/http-exception'
import { ImageURL } from './image_url.dto'

export const WeaponInfoMainHash = ImageURL.transform((object) => {
  const pattern: RegExp = /\/([a-f0-9]{64})_/
  const match: RegExpMatchArray | null = object.image.url.match(pattern)
  if (match === null) {
    throw new HTTPException(400, { message: 'Invalid image URL' })
  }
  return {
    id: Hash2Id(match[1]),
    url: object.image.url
  }
})
