import { z } from '@hono/zod-openapi'
import { CoopData } from './common/coop_data.dto'
import { CoopStageModel } from './common/coop_stage.dto'
import { ImageURL } from './common/image_url.dto'
import { NodeList } from './common/node_list.dto'
import { S3URL } from './common/s3_url.dto'
import { WeaponInfoMainHash } from './common/weapon_hash.dto'
import type { ResourceQuery } from './resource.interface'

export namespace StageSchedule {
  const Setting = z.object({
    coopStage: CoopStageModel,
    weapons: z.array(WeaponInfoMainHash)
  })

  const Schedule = z.object({
    setting: Setting
  })

  export const Request = CoopData(
    z.object({
      coopGroupingSchedule: z.object({
        regularSchedules: NodeList(Schedule),
        bigRunSchedules: NodeList(Schedule),
        teamContestSchedules: NodeList(Schedule)
      })
    })
  )

  export const Response = z.object({})

  export type Request = z.infer<typeof Request>
  export type Response = z.infer<typeof Response>
}

export class StageScheduleQuery implements ResourceQuery {
  private readonly request: StageSchedule.Request
  private readonly response: StageSchedule.Response

  constructor(data: object | unknown) {
    this.request = StageSchedule.Request.parse(data)
    this.response = StageSchedule.Response.parse({})
  }

  toJSON(): StageSchedule.Response {
    return this.response
  }

  get assetURLs(): S3URL[] {
    return Array.from(
      new Set(
        [
          ...this.request.data.coopGroupingSchedule.regularSchedules.nodes,
          ...this.request.data.coopGroupingSchedule.bigRunSchedules.nodes,
          ...this.request.data.coopGroupingSchedule.teamContestSchedules.nodes
        ].flatMap((node) => [node.setting.coopStage.image.url, node.setting.weapons.map((weapon) => weapon.url)].flat())
      )
    ).map((url) => S3URL.parse(url))
  }
}
