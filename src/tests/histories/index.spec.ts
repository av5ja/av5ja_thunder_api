import { describe, expect, it, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { CoopHistoryQuery } from '@/models/coop_history.dto'
import { Response as CoopHistoryModel } from '@/models/coop_history.dto'

describe('CoopHistoryQuery', () => {
  test('Validity', () => {
    const files: string[] = readdirSync(path.join(__dirname, 'input')).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const data: string = readFileSync(path.join(__dirname, 'input', file), { encoding: 'utf8' })
      expect(() => new CoopHistoryQuery(JSON.parse(data))).not.toThrow()
    }
  })

  test('Equality', () => {
    const files: string[] = readdirSync(path.join(__dirname, 'input')).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const input: string = readFileSync(path.join(__dirname, 'input', file), { encoding: 'utf8' })
      const output: string = readFileSync(path.join(__dirname, 'output', file), { encoding: 'utf8' })
      const input_model: CoopHistoryQuery = new CoopHistoryQuery(JSON.parse(input))
      expect(Bun.deepEquals(JSON.parse(JSON.stringify(input_model)), JSON.parse(output))).toBe(true)
    }
  })
})
