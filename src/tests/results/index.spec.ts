import { describe, expect, it, test } from 'bun:test'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { CoopResultQuery } from '@/models/coop_result.dto'

describe('CoopResultQuery', () => {
  test('Validity', () => {
    const files: string[] = readdirSync(path.join(__dirname, 'input')).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const data: string = readFileSync(path.join(__dirname, 'input', file), { encoding: 'utf8' })
      expect(() => new CoopResultQuery(JSON.parse(data))).not.toThrow()
    }
  })
  test('Equality', () => {
    const files: string[] = readdirSync(path.join(__dirname, 'input')).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const input: string = readFileSync(path.join(__dirname, 'input', file), { encoding: 'utf8' })
      const output: string = readFileSync(path.join(__dirname, 'output', file), { encoding: 'utf8' })
      const input_model: CoopResultQuery = new CoopResultQuery(JSON.parse(input))
      Bun.write(path.join(__dirname, 'output', '03.json'), JSON.stringify(input_model, null, 2))
      expect(Bun.deepEquals(JSON.parse(JSON.stringify(input_model)), JSON.parse(output))).toBe(true)
    }
  })
})
