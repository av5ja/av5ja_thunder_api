import { CoopScheduleQuery } from '@/models/coop_schedule.dto'
import type { Bindings } from '@/utils/bindings'
import { createPrismaClient } from '@/utils/prisma'

const UPSTREAM_URL = 'https://splatoon.oatmealdome.me/api/v1/three/coop/phases?count=5'

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
  const prisma = createPrismaClient(env)
  await prisma.$transaction(
    query.schedules.map((schedule) => {
      const payload = {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        mode: schedule.mode,
        rule: schedule.rule,
        bossId: schedule.bossId ?? null,
        stageId: schedule.stageId,
        rareWeapons: JSON.stringify(schedule.rareWeapons),
        weaponList: JSON.stringify(schedule.weaponList)
      }
      return prisma.schedule.upsert({
        where: { id: schedule.id },
        create: { id: schedule.id, ...payload },
        update: payload
      })
    })
  )
}

export const scheduled = async (_event: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> => {
  ctx.waitUntil(refresh(env))
}
