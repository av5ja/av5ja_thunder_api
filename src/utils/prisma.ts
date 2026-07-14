import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@/generated/prisma'
import type { Bindings } from './bindings'

export const createPrismaClient = (env: Bindings): PrismaClient => {
  const adapter = new PrismaD1(env.SCHEDULES)
  return new PrismaClient({ adapter })
}
