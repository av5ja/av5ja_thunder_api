import { CoopBossInfo, CoopEnemyInfo } from '@/enums/coop/coop_enemy'
import { CoopStage } from '@/enums/coop/coop_stage'
import { ImageType } from '@/enums/image_type'
import { WeaponInfoMain } from '@/enums/weapon/main'
import { WeaponInfoSpecial } from '@/enums/weapon/special'
import { CoopPlayerId } from '@/models/common/coop_player_id.dto'
import { CoopResult, CoopResultQuery } from '@/models/coop_result.dto'
import { CoopSchedule } from '@/models/coop_schedule.dto'
import { Thunder } from '@/models/user.dto'
import dayjs, { type Dayjs } from 'dayjs'
import type { Context } from 'hono'
import { raw } from 'hono/html'
import { HTTPException } from 'hono/http-exception'
import { jwt, sign } from 'hono/jwt'
import { AlgorithmTypes } from 'hono/utils/jwt/jwa'
import { v4 as uuidv4 } from 'uuid'
import type { Bindings } from './bindings'

export namespace KV {
  export namespace USER {
    /**
     * ユーザーデータの読み込み
     * @param c
     * @param id
     * @returns
     */
    export const get = async (c: Context<{ Bindings: Bindings }>, id: string): Promise<Thunder.User | null> => {
      const data: unknown | null = await c.env.USERS.get(id, { type: 'json' })
      if (data === null) {
        return null
      }
      return Thunder.User.parse(data)
    }

    /**
     * ユーザーデータの書き込み
     * @param c
     * @param data
     * @returns
     */
    export const set = async (c: Context<{ Bindings: Bindings }>, data: object): Promise<Thunder.User> => {
      console.info('[SET USER]:', data)
      const user: Thunder.User = Thunder.User.parse(data)
      await c.env.USERS.put(user.id, JSON.stringify(user))
      return user
    }

    /**
     * ユーザーデータからトークンを生成
     * @param c
     * @param data
     * @returns
     */
    export const token = (c: Context<{ Bindings: Bindings }>, data: object): Promise<string> => {
      const user: Thunder.User = Thunder.User.parse(data)
      const current_time: Dayjs = dayjs()
      const token: Thunder.Token = Thunder.Token.parse({
        aud: c.env.DISCORD_CLIENT_ID,
        exp: current_time.add(12, 'hour').unix(),
        iat: current_time.unix(),
        iss: new URL(c.req.url).hostname,
        jti: uuidv4(),
        nbf: current_time.unix(),
        sub: user.id,
        typ: 'access_token',
        usr: user
      })
      return sign(token, c.env.JWT_SECRET_KEY, AlgorithmTypes.HS256)
    }
  }

  export namespace RESOURCE {
    const find_hash = (type: ImageType, raw_id: number): string | undefined => {
      switch (type) {
        case ImageType.WeaponInfoMain:
          return WeaponInfoMain.Hash[
            WeaponInfoMain.Id[
              raw_id % 1000 === 900 ? raw_id : raw_id < 0 ? raw_id : raw_id >= 20000 ? raw_id : raw_id + 20000
            ] as keyof typeof WeaponInfoMain.Hash
          ]
        case ImageType.WeaponInfoSpecial:
          return WeaponInfoSpecial.Hash[WeaponInfoSpecial.Id[raw_id] as keyof typeof WeaponInfoSpecial.Hash]
        case ImageType.StageInfo:
          return CoopStage.Hash[CoopStage.Id[raw_id] as keyof typeof CoopStage.Hash]
        case ImageType.EnemyInfo:
          return raw_id >= 20
            ? CoopBossInfo.Hash[CoopBossInfo.Id[raw_id] as keyof typeof CoopBossInfo.Id]
            : CoopEnemyInfo.Hash[CoopEnemyInfo.Id[raw_id] as keyof typeof CoopEnemyInfo.Hash]
        default:
          return ''
      }
    }

    export const get = async (c: Context<{ Bindings: Bindings }>, type: ImageType, raw_id: number): Promise<string> => {
      const hash: string | undefined = find_hash(type, raw_id)
      if (hash === undefined) {
        throw new HTTPException(400, { message: 'Bad Request.' })
      }
      console.log('HASH:', hash)
      const text: string | null = await c.env.RESOURCES.get(hash, { type: 'text' })
      if (text === null) {
        throw new HTTPException(404, { message: 'Not Found.' })
      }
      return new URL(text).href
    }

    export const set = async (
      c: Context<{ Bindings: Bindings }>,
      path: string,
      raw_id: number,
      data: Buffer
    ): Promise<void> => {}
  }

  export namespace RESULT {
    /**
     * オリジナルのリザルト書き込み
     * @param c
     * @param data
     * @returns
     */

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    export const set = async (c: Context<{ Bindings: Bindings }>, data: any): Promise<void> => {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const myResult: any = data.histories[0].results[0].data.coopHistoryDetail.myResult
        const id: CoopPlayerId = CoopPlayerId.parse(myResult.player.id)
        await c.env.HISTORIES.put(`${id.nplnUserId}:${id.playTime}`, JSON.stringify(data))
      } catch (error) {
        console.error(error)
      }
    }
  }

  export namespace SCHEDULE {
    /**
     * スケジュール読み込み
     * @param c
     * @param id
     * @returns
     */
    export const get = async (c: Context<{ Bindings: Bindings }>, id: string): Promise<CoopSchedule.Response> => {
      const data: unknown | null = await c.env.SCHEDULES.get(id, { type: 'json' })
      if (data === null) {
        throw new HTTPException(404, { message: 'Not Found.' })
      }
      return CoopSchedule.Response.parse(data)
    }

    /**
     * スケジュール書き込み
     * @param c
     * @param data
     * @returns
     */
    export const set = async (c: Context<{ Bindings: Bindings }>, data: object): Promise<CoopSchedule.Response> => {
      console.info('[SET SCHEDULE]:', data)
      const schedule: CoopSchedule.Response = CoopSchedule.Response.parse(data)
      await c.env.SCHEDULES.put(`${schedule.startTime}:${schedule.endTime}`, JSON.stringify(schedule))
      return schedule
    }
  }
}
