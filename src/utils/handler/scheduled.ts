import { type CoopSchedule, CoopScheduleQuery } from '@/models/coop_schedule.dto'
import { HTTPException } from 'hono/http-exception'
import type { StatusCode } from 'hono/utils/http-status'
import type { Bindings } from '../bindings'
import dummy from './dummy.json'

const update = async (env: Bindings): Promise<void> => {
  const url: URL = new URL('/api/v1/three/coop/phases', 'https://splatoon.oatmealdome.me')
  url.searchParams.set('count', '5')
  const response = await fetch(url.href)
  if (!response.ok) {
    throw new HTTPException(response.status as StatusCode, { message: response.statusText })
  }
  const schedules = new CoopScheduleQuery(await response.json()).schedules
  // 個別にデータ追加
  // 本来は不要な処理だが、念の為バックアップをとっておく
  await Promise.all(
    schedules.map(async (schedule) =>
      env.Schedule.put(`${schedule.startTime}:${schedule.endTime}`, JSON.stringify(schedule))
    )
  )
  // キャッシュの更新
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const cache: any | null = await env.Cache.get('api.splatnet3.com/v3/schedules', { type: 'json' })
  if (cache === null) {
    // キャッシュがなければダミーデータを追加
    await env.Cache.put('api.splatnet3.com/v3/schedules', JSON.stringify(dummy.schedules))
    return
  }
  const update_cache: CoopSchedule.Response[] = Array.from(
    new Map([...cache, ...schedules].map((obj) => [obj.id, obj])).values()
  )
  await env.Cache.put('api.splatnet3.com/v3/schedules', JSON.stringify(update_cache))
}

export const scheduled = async (event: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> => {
  switch (event.cron) {
    case '*/30 * * * *':
      ctx.waitUntil(update(env))
      break
    default:
      break
  }
}
