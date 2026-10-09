import { describe, it, expect } from 'vitest'
import { formatIDR, parseIDR } from './money'
import {
  largestRemainder,
  splitEqual,
  computeSplit,
  computeManualSplit,
} from './split'
import type { BillItem, BillFees, BillMember, ItemAssignment } from './schemas'

describe('money.ts', () => {
  describe('formatIDR', () => {
    it('formats positive integers correctly', () => {
      expect(formatIDR(21907)).toBe('Rp21.907')
      expect(formatIDR(1000000)).toBe('Rp1.000.000')
      expect(formatIDR(0)).toBe('Rp0')
    })

    it('formats negative integers correctly', () => {
      expect(formatIDR(-6400)).toBe('-Rp6.400')
    })
  })

  describe('parseIDR', () => {
    it('parses valid IDR strings', () => {
      expect(parseIDR('17.400')).toBe(17400)
      expect(parseIDR('17.400,00')).toBe(17400)
      expect(parseIDR('17400')).toBe(17400)
      expect(parseIDR('Rp 17.400')).toBe(17400)
      expect(parseIDR('Rp17.400')).toBe(17400)
      expect(parseIDR('-6.400')).toBe(-6400)
      expect(parseIDR('-Rp 6.400')).toBe(-6400)
    })

    it('returns NaN for invalid inputs', () => {
      expect(parseIDR('abc')).toBeNaN()
      expect(parseIDR('')).toBeNaN()
    })
  })
})

describe('split.ts', () => {
  describe('largestRemainder', () => {
    it('splits total into exact sum of parts', () => {
      const result = largestRemainder(10, [1, 1, 1])
      expect(result.reduce((a, b) => a + b, 0)).toBe(10)
      expect(result).toEqual([4, 3, 3])
    })
  })

  describe('splitEqual', () => {
    it('splits total evenly', () => {
      const result = splitEqual(10, 3)
      expect(result.reduce((a, b) => a + b, 0)).toBe(10)
      expect(result).toEqual([4, 3, 3])
    })
  })

  describe('GEDUNG RE test case (§6 of plan.md)', () => {
    // Struk GEDUNG RE (29 Jun 2026): item bruto 62.700, potongan item 7.000 (Mabell 6.400, Gaga 600),
    // total Rp55.700, PPN 6.214 sudah termasuk.
    // Anggota: Samuel (nalangin), Evan, Sulthan, Rina, Budi.
    const items: BillItem[] = [
      { id: '1', name: 'Indomi Goreng Spc 80', qty: 1, unit_price: 3200, line_total: 3200, discount: 0 },
      { id: '2', name: 'Bihunku Grg Spcl 60G', qty: 2, unit_price: 4000, line_total: 8000, discount: 0 },
      { id: '3', name: 'Indomie Tori Kara 89', qty: 2, unit_price: 6500, line_total: 13000, discount: 0 },
      { id: '4', name: 'Idm Tas Rmh Lngk Kcl', qty: 1, unit_price: 4000, line_total: 4000, discount: 0 },
      { id: '5', name: 'Indomie Soto Pd.D 76', qty: 2, unit_price: 3100, line_total: 6200, discount: 0 },
      { id: '6', name: 'Indomi Sblak Hot/J75', qty: 1, unit_price: 3100, line_total: 3100, discount: 0 },
      { id: '7', name: 'Mabell SS S.Tempong', qty: 2, unit_price: 8700, line_total: 17400, discount: 6400 },
      { id: '8', name: 'Gaga 100 Gr.Jlpno 85', qty: 2, unit_price: 3900, line_total: 7800, discount: 600 },
    ]

    const fees: BillFees = {
      discount: 0,
      service: 0,
      other: [],
      tax: 6214,
      tax_included: true, // Pajak sudah termasuk, tidak pernah ditambahkan
      rounding: 0,
      adjustment: 0,
    }

    const total = 55700

    const members: BillMember[] = [
      { id: 'samuel', name: 'Samuel', color: '#7e22ce', is_payer: true, paid_at: null },
      { id: 'evan', name: 'Evan', color: '#2563eb', is_payer: false, paid_at: null },
      { id: 'sulthan', name: 'Sulthan', color: '#059669', is_payer: false, paid_at: null },
      { id: 'rina', name: 'Rina', color: '#d97706', is_payer: false, paid_at: '2026-06-29T10:00:00Z' },
      { id: 'budi', name: 'Budi', color: '#db2777', is_payer: false, paid_at: '2026-06-29T10:05:00Z' },
    ]

    // Sample assignments
    const assignments: Record<string, ItemAssignment[]> = {
      '1': [{ member_id: 'samuel' }, { member_id: 'evan' }],
      '2': [{ member_id: 'sulthan' }, { member_id: 'rina' }],
      '3': [{ member_id: 'samuel' }, { member_id: 'evan' }, { member_id: 'sulthan' }, { member_id: 'rina' }, { member_id: 'budi' }],
      '4': [{ member_id: 'samuel' }],
      '5': [{ member_id: 'evan' }, { member_id: 'sulthan' }],
      '6': [{ member_id: 'samuel' }],
      '7': [{ member_id: 'samuel', units: 1 }, { member_id: 'budi', units: 1 }],
      '8': [{ member_id: 'evan' }, { member_id: 'rina' }, { member_id: 'budi' }],
    }

    it('satisfies invariant: sum of member totals === bill total', () => {
      const res = computeSplit(items, fees, total, members, assignments)
      const sum = Object.values(res.memberTotals).reduce((a, b) => a + b, 0)
      expect(sum).toBe(total)
    })

    it('does not add tax_included to total fees', () => {
      const res = computeSplit(items, fees, total, members, assignments)
      expect(res.computed).toBe(total)
    })

    it('calculates unpaid accurately for non-payers who have not paid', () => {
      const res = computeSplit(items, fees, total, members, assignments)
      // Unpaid = Evan + Sulthan (Rina and Budi are paid_at, Samuel is_payer)
      expect(res.unpaid).toBe(res.memberTotals['evan'] + res.memberTotals['sulthan'])
    })
  })

  describe('receipt-mode invariant with tax added + rounding (sample warung)', () => {
    const items: BillItem[] = [
      { id: 'a', name: 'Nasi Goreng Spesial', qty: 2, unit_price: 28000, line_total: 56000, discount: 0 },
      { id: 'b', name: 'Es Teh Manis', qty: 2, unit_price: 8000, line_total: 16000, discount: 0 },
      { id: 'c', name: 'Ayam Bakar', qty: 1, unit_price: 35000, line_total: 35000, discount: 5000 },
      { id: 'd', name: 'Kerupuk', qty: 1, unit_price: 5000, line_total: 5000, discount: 0 },
    ]
    const fees: BillFees = {
      discount: 0,
      service: 5350,
      other: [],
      tax: 11235,
      tax_included: false,
      rounding: 15,
      adjustment: 0,
    }
    const total = 123600
    const members: BillMember[] = [
      { id: 'a1', name: 'Aku', color: '#7e22ce', is_payer: true, paid_at: null },
      { id: 'b1', name: 'Budi', color: '#2563eb', is_payer: false, paid_at: null },
      { id: 'c1', name: 'Citra', color: '#059669', is_payer: false, paid_at: null },
    ]
    const assignments: Record<string, ItemAssignment[]> = {}
    for (const item of items) assignments[item.id] = members.map((m) => ({ member_id: m.id }))

    it('sums member totals to the bill total and matches computed', () => {
      const res = computeSplit(items, fees, total, members, assignments)
      const sum = Object.values(res.memberTotals).reduce((a, b) => a + b, 0)
      expect(sum).toBe(total)
      expect(res.computed).toBe(total)
    })
  })
})

