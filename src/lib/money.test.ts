import { describe, it, expect } from 'vitest'
import { formatIDR, formatIDRPlain, parseIDR } from './money'

describe('money.ts — format ribuan untuk kolom input', () => {
  describe('formatIDRPlain', () => {
    it('groups thousands without the Rp prefix', () => {
      expect(formatIDRPlain(706497)).toBe('706.497')
      expect(formatIDRPlain(17400)).toBe('17.400')
      expect(formatIDRPlain(1000000)).toBe('1.000.000')
    })

    it('handles zero and negatives', () => {
      expect(formatIDRPlain(0)).toBe('0')
      expect(formatIDRPlain(-6400)).toBe('-6.400')
    })

    it('equals formatIDR without the prefix for every case', () => {
      for (const n of [0, 5, 999, 1000, 706497, -17400]) {
        expect(formatIDRPlain(n)).toBe(formatIDR(n).replace(/Rp/g, ''))
      }
    })
  })

  describe('parseIDR (round-trip yang dipakai MoneyInput)', () => {
    it('reads the grouped display back as the same integer', () => {
      for (const n of [706497, 17400, 1000000, 0, -6400]) {
        expect(parseIDR(formatIDRPlain(n))).toBe(n)
      }
    })

    it('still parses the raw digits typed while focused', () => {
      expect(parseIDR('706497')).toBe(706497)
      expect(parseIDR('-6400')).toBe(-6400)
      expect(parseIDR('17.400,00')).toBe(17400)
      expect(parseIDR('17,400')).toBe(17400)
    })
  })
})
