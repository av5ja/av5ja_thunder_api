import { describe, expect, it, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { WeaponRecordQuery } from '@/models/weapon_record.dto'

describe('WeaponRecordQuery', () => {
  test('Validity', () => {
    const files: string[] = readdirSync(path.join(__dirname, 'input')).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const data: string = readFileSync(path.join(__dirname, 'input', file), { encoding: 'utf8' })
      expect(() => new WeaponRecordQuery(JSON.parse(data))).not.toThrow()
    }
  })
  test('Equality', () => {
    const files: string[] = readdirSync(path.join(__dirname, 'input')).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const input: string = readFileSync(path.join(__dirname, 'input', file), { encoding: 'utf8' })
      const output: string = readFileSync(path.join(__dirname, 'output', file), { encoding: 'utf8' })
      const input_model: WeaponRecordQuery = new WeaponRecordQuery(JSON.parse(input))
    }
  })
})
