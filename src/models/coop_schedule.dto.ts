import { createHash } from 'node:crypto'
import { CoopBossInfo } from '@/enums/coop/coop_enemy'
import { CoopMode } from '@/enums/coop/coop_mode'
import { CoopRule } from '@/enums/coop/coop_rule'
import { CoopStage } from '@/enums/coop/coop_stage'
import { WeaponInfoMain } from '@/enums/weapon/main'
import { StageSchedule } from '@/schema/schedule.dto'
import { camelcaseKeys } from '@/utils/camelcase_keys'
import { z } from '@hono/zod-openapi'
import { DateTime } from './common/datetime.dto'

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const BigBossModel = z.preprocess((input: any) => {
  switch (input) {
    case 'SakeJaw':
      return CoopBossInfo.Id.SakeJaw
    case 'SakeRope':
      return CoopBossInfo.Id.SakeRope
    case 'SakelienGiant':
      return CoopBossInfo.Id.SakelienGiant
    case 'Triple':
      return CoopBossInfo.Id.Triple
    case 'Random':
      return CoopBossInfo.Id.Random
    default:
      return null
  }
}, z.nativeEnum(CoopBossInfo.Id).nullable())

const ScheduleModel = (mode: CoopMode, rule: CoopRule) =>
  z
    .object({
      bigBoss: BigBossModel,
      startTime: DateTime,
      endTime: DateTime,
      stage: z.nativeEnum(CoopStage.Id),
      weapons: z.array(z.nativeEnum(WeaponInfoMain.Id)),
      rareWeapons: z.array(z.nativeEnum(WeaponInfoMain.Id))
    })
    .transform((object) => {
      return {
        ...object,
        weaponList: object.weapons,
        bossId: object.bigBoss,
        stageId: object.stage,
        mode: mode,
        rule: rule
      }
    })

export const Request = z.preprocess(
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  (input: any) => {
    return camelcaseKeys(input)
  },
  z.object({
    normal: z.array(ScheduleModel(CoopMode.REGULAR, CoopRule.REGULAR)),
    bigRun: z.array(ScheduleModel(CoopMode.REGULAR, CoopRule.BIG_RUN)),
    teamContest: z.array(ScheduleModel(CoopMode.LIMITED, CoopRule.TEAM_CONTEST))
  })
)

/**
 * サーモンランのスケジュール
 * 自動でIDを生成する
 */
export const Response = z.preprocess(
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  (input: any) => {
    if (input.bossId === undefined) input.bossId = undefined
    return input
  },
  z
    .object({
      startTime: DateTime,
      endTime: DateTime,
      mode: z.nativeEnum(CoopMode),
      rule: z.nativeEnum(CoopRule),
      bossId: z.nativeEnum(CoopBossInfo.Id).nullish(),
      stageId: z.nativeEnum(CoopStage.Id),
      rareWeapons: z.array(z.nativeEnum(WeaponInfoMain.Id)),
      weaponList: z.array(z.nativeEnum(WeaponInfoMain.Id))
    })
    .transform((object) => {
      return {
        id:
          object.startTime === null || object.endTime === null
            ? createHash('md5')
                .update(`${object.mode}-${object.rule}-${object.stageId}-${object.weaponList.join(',')}`)
                .digest('hex')
            : createHash('md5').update(`${object.startTime}:${object.endTime}`).digest('hex'),
        ...object
      }
    })
)

export class CoopScheduleQuery {
  private readonly request: Request
  private readonly response: Response[]

  private get schedules(): ScheduleModel[] {
    return [...this.request.normal, ...this.request.bigRun, ...this.request.teamContest]
  }

  constructor(data: object) {
    this.request = Request.parse(data)
    this.response = this.schedules.map((schedule) => Response.parse(schedule))
  }

  toJSON(): object {
    return this.response
  }
}

type ScheduleModel = z.infer<ReturnType<typeof ScheduleModel>>
type Request = z.infer<typeof Request>
type Response = z.infer<typeof Response>
