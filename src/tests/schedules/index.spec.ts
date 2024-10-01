import { describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { CoopScheduleQuery } from '@/models/coop_schedule.dto'

describe('CoopScheduleQuery', () => {
  test('Validity', () => {
    const files: string[] = readdirSync(path.join(__dirname, 'input')).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const data: string = readFileSync(path.join(__dirname, 'input', file), { encoding: 'utf8' })
      new CoopScheduleQuery(JSON.parse(data))
    }
  })
  test('Equality', () => {
    const files: string[] = readdirSync(path.join(__dirname, 'input')).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const input: string = readFileSync(path.join(__dirname, 'input', file), { encoding: 'utf8' })
      const output: string = readFileSync(path.join(__dirname, 'output', file), { encoding: 'utf8' })
      const input_model: CoopScheduleQuery = new CoopScheduleQuery(JSON.parse(input))
      expect(Bun.deepEquals(JSON.parse(JSON.stringify(input_model)), JSON.parse(output), false)).toBe(true)
    }
  })
})
