import { describe, it, expect } from 'vitest'
import { summarizeBill } from './breakdown'
import { validateBill } from './bill-validate'
import { BillDataSchema, type BillData, type BillDataInput } from './schemas'

const members = [
  { id: 'a', name: 'Aku', color: '#7e22ce', is_payer: true, paid_at: null },
  { id: 'b', name: 'Budi', color: '#2563eb', is_payer: false, paid_at: null },
  { id: 'c', name: 'Citra', color: '#059669', is_payer: false, paid_at: null },
]

function bill(partial: Partial<BillDataInput>): BillData {
  return BillDataSchema.parse({ mode: 'receipt', merchant: 'Uji', total: 0, members, ...partial })
}

/** Rincian tiap anggota harus menjumlah tepat ke nominal anggota itu. */
function expectLinesAddUp(data: BillData) {
  const res = summarizeBill(data)
  expect(Object.values(res.memberTotals).reduce((a, b) => a + b, 0)).toBe(data.total)
  for (const m of members) {
    const sum = res.memberLines[m.id].reduce((s, l) => s + l.amount, 0)
    expect(sum, `anggota ${m.id}`).toBe(res.memberTotals[m.id])
  }
  return res
}

describe('summarizeBill — adjustment negatif', () => {
  it('penyesuaian negatif tetap bikin rincian menjumlah ke nominal anggota', () => {
    const data = bill({
      total: 7000,
      items: [{ id: 'i1', name: 'Nasi', qty: 1, unit_price: 10000, line_total: 10000, discount: 0 }],
      fees: { adjustment: -3000 },
      assignments: { i1: [{ member_id: 'a' }] },
    })
    expect(validateBill(data)).toBeNull()
    const res = expectLinesAddUp(data)
    expect(res.memberLines.a).toContainEqual({ label: 'Penyesuaian', amount: -3000, kind: 'fee' })
    expect(res.memberLines.b).toEqual([])
  })

  it('penyesuaian negatif dibagi proporsional ke yang punya porsi', () => {
    const data = bill({
      total: 9000,
      items: [
        { id: 'x', name: 'Sate', qty: 1, unit_price: 6000, line_total: 6000, discount: 0 },
        { id: 'y', name: 'Es', qty: 1, unit_price: 6000, line_total: 6000, discount: 0 },
      ],
      fees: { adjustment: -3000 },
      assignments: { x: [{ member_id: 'a' }], y: [{ member_id: 'b' }] },
    })
    expect(validateBill(data)).toBeNull()
    const res = expectLinesAddUp(data)
    expect(res.memberTotals.a).toBe(4500)
    expect(res.memberTotals.b).toBe(4500)
    expect(res.memberTotals.c).toBe(0)
  })

  it('gabungan diskon item, service, PPN ditambahkan, dan adjustment negatif', () => {
    const data = bill({
      total: 0, // placeholder, dihitung di bawah
      items: [
        { id: 'p', name: 'Bebek', qty: 1, unit_price: 34091, line_total: 34091, discount: 0 },
        { id: 'q', name: 'Nasi', qty: 2, unit_price: 6000, line_total: 12000, discount: 2000 },
      ],
      fees: { service: 2305, tax: 4609, tax_included: false, rounding: -4, adjustment: -1500 },
      assignments: {
        p: [{ member_id: 'a' }, { member_id: 'b', units: 1 }],
        q: [{ member_id: 'b' }, { member_id: 'c' }, { member_id: 'a' }],
      },
    })
    // net = 34091 + 10000 = 44091; computed = 44091 + 2305 + 4609 - 4 = 51001; total = 49501
    const withTotal = BillDataSchema.parse({ ...data, total: 49501 })
    expect(validateBill(withTotal)).toBeNull()
    expectLinesAddUp(withTotal)
  })
})
