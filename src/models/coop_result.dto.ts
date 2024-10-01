import { z } from '@hono/zod-openapi'
import { CoopHistoryDetailId } from './common/coop_history_detail_id.dto'
import { S3URL } from './common/s3_url.dto'
import { CoopHistory } from './coop_history.dto'
import { CoopHistoryDetail, CoopHistoryDetailQuery } from './coop_history_detail.dto'
import { CoopSchedule } from './coop_schedule.dto'
import type { ResourceQuery } from './resource.interface'

export namespace CoopResult {
  /**
   * この型で受け付けるだけで内部的なパースは実行しない
   */
  export const Request = z.object({
    histories: z.array(
      z.object({
        schedule: z.record(z.any()),
        results: z.array(z.record(z.any()))
      })
    )
  })

  /**
   * 実質的なレスポンスの型
   */
  export const Response = z.object({
    histories: z.array(
      z.object({
        schedule: CoopSchedule.Response,
        results: z.array(CoopHistoryDetail.Response)
      })
    )
  })

  export type Request = z.infer<typeof Request>
  export type Response = z.infer<typeof Response>
}

export class CoopResultQuery implements ResourceQuery {
  private readonly request: CoopResult.Request
  private readonly response: CoopResult.Response

  constructor(data: object) {
    this.request = CoopResult.Request.parse(data)
    this.response = CoopResult.Response.parse({
      histories: this.request.histories.map((history) => ({
        schedule: CoopSchedule.Response.parse(history.schedule),
        results: history.results.map((result) => {
          return {
            ...new CoopHistoryDetailQuery(result).result,
            schedule: history.schedule
          }
        })
      }))
    })
  }

  toJSON(): CoopResult.Response {
    return this.response
  }

  get results(): CoopHistoryDetail.Response[] {
    return this.response.histories.flatMap((history) => history.results)
  }

  get assetURLs(): S3URL[] {
    return Array.from(
      new Set(
        this.request.histories.flatMap((history) =>
          history.results.flatMap((result) => new CoopHistoryDetailQuery(result).assetURLs.map((url) => url.raw_value))
        )
      )
    ).map((url) => S3URL.parse(url))
  }
}
