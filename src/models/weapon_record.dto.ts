import { z } from '@hono/zod-openapi'
import { CoopData } from './common/coop_data.dto'
import { ImageURL } from './common/image_url.dto'
import { NodeList } from './common/node_list.dto'
import { S3URL } from './common/s3_url.dto'
import type { ResourceQuery } from './resource.interface'

const WeaponRecordModel = z
  .object({
    weaponId: z.number().int(),
    subWeapon: ImageURL,
    specialWeapon: ImageURL,
    image2d: z.object({
      url: z.string().url()
    })
  })
  .transform((data) => {
    return {
      ...data,
      coopAddition: (data.weaponId & 1) === 0
    }
  })

export namespace WeaponRecord {
  export const Request = CoopData(
    z.object({
      weaponRecords: NodeList(WeaponRecordModel)
    })
  )

  export const Response = z.object({
    assetURLs: z.array(S3URL)
  })

  export type Request = z.infer<typeof Request>
  export type Response = z.infer<typeof Response>
}

export class WeaponRecordQuery implements ResourceQuery {
  private readonly request: WeaponRecord.Request
  private readonly response: WeaponRecord.Response

  constructor(data: object) {
    this.request = WeaponRecord.Request.parse(data)
    this.response = WeaponRecord.Response.parse({
      assetURLs: Array.from(
        new Set(
          this.weaponRecords.flatMap((record) => [
            record.image2d.url,
            record.subWeapon.image.url,
            record.specialWeapon.image.url
          ])
        )
      )
    })
  }

  private get weaponRecords(): WeaponRecordModel[] {
    return this.request.data.weaponRecords.nodes.filter((node) => node.coopAddition)
  }

  get assetURLs(): S3URL[] {
    return this.response.assetURLs
  }

  toJSON(): object {
    return this.response
  }
}

type WeaponRecordModel = z.infer<typeof WeaponRecordModel>
