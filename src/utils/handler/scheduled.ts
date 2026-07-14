import { CoopScheduleQuery } from '@/models/coop_schedule.dto'
import type { Bindings } from '@/utils/bindings'

const UPSTREAM_URL = 'https://splatoon.oatmealdome.me/api/v1/three/coop/phases?count=5'

const UPSERT_SQL = `INSERT INTO schedules
  (id, start_time, end_time, mode, rule, boss_id, stage_id, rare_weapons, weapon_list, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(id) DO UPDATE SET
    start_time   = excluded.start_time,
    end_time     = excluded.end_time,
    mode         = excluded.mode,
    rule         = excluded.rule,
    boss_id      = excluded.boss_id,
    stage_id     = excluded.stage_id,
    rare_weapons = excluded.rare_weapons,
    weapon_list  = excluded.weapon_list,
    updated_at   = datetime('now')`

const refresh = async (env: Bindings): Promise<void> => {
  const upstream = await fetch(UPSTREAM_URL)
  if (!upstream.ok) {
    console.error('[scheduled] upstream fetch failed:', upstream.status)
    return
  }
  const query = new CoopScheduleQuery(await upstream.json())
  if (query.schedules.length === 0) {
    return
  }
  const statement = env.SCHEDULES.prepare(UPSERT_SQL)
  const batch = query.schedules.map((schedule) =>
    statement.bind(
      schedule.id,
      schedule.startTime,
      schedule.endTime,
      schedule.mode,
      schedule.rule,
      schedule.bossId ?? null,
      schedule.stageId,
      JSON.stringify(schedule.rareWeapons),
      JSON.stringify(schedule.weaponList)
    )
  )
  await env.SCHEDULES.batch(batch)
}

export const scheduled = async (_event: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> => {
  ctx.waitUntil(refresh(env))
}
