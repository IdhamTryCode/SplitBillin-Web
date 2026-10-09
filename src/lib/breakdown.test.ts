import { describe, it, expect } from 'vitest'
import { summarizeBill } from './breakdown'
import { validateBill } from './bill-validate'
import { BillDataSchema, type BillData, type BillDataInput } from './schemas'

const members = [
  { id: 'samuel', name: 'Samuel', color: '#7e22ce', is_payer: true, paid_at: null },
  { id: 'evan', name: 'Evan', color: '#2563eb', is_payer: false, paid_at: null },
  { id: 'sulthan', name: 'Sulthan', color: '#059669', is_payer: false, paid_at: null },
  { id: 'rina', name: 'Rina', color: '#d97706', is_payer: false, paid_at: '2026-06-29T10:00:00Z' },
  { id: 'budi', name: 'Budi', color: '#db2777', is_payer: false, paid_at: '2026-06-29T10:05:00Z' },
]

function bill(partial: Partial<BillDataInput>): BillData {
  return BillDataSchema.parse({ mode: 'receipt', merchant: 'Uji', total: 0, members, ...partial })
}

// Pesan-antar (design-brief §13 C): voucher tingkat struk + tiga biaya lain.
const delivery = bill({
  total: 63867,
  items: [
    { id: 'a', name: 'Ayam Geprek', qty: 2, unit_price: 25000, line_total: 50000, discount: 0 },
    { id: 'b', name: 'Nasi Uduk Komplit', qty: 3, unit_price: 13050, line_total: 39150, discount: 0 },
    { id: 'c', name: 'Es Jeruk', qty: 1, unit_price: 15000, line_total: 15000, discount: 0 },
  ],
  fees: {
    discount: 57283,
    other: [
      { name: 'Ongkir', amount: 10000 },
      { name: 'Biaya layanan', amount: 4000 },
      { name: 'Kemasan', amount: 3000 },
    ],
  },
  assignments: {
    a: [{ member_id: 'samuel' }, { member_id: 'evan' }],
    b: [
      { member_id: 'sulthan', units: 1 },
      { member_id: 'rina', units: 2 },
    ],
    c: [{ member_id: 'budi' }, { member_id: 'evan' }, { member_id: 'samuel' }],
  },
})

describe('summarizeBill', () => {
  it('data uji §6: yang nalangin otomatis lunas, belum lunas = 21.750', () => {
    const res = summarizeBill(
      bill({
        mode: 'manual',
        merchant: 'GEDUNG RE',
        total: 55700,
        manual: {
          split: 'amount',
          values: { samuel: 14250, evan: 11800, sulthan: 9950, rina: 10200, budi: 9500 },
        },
      }),
    )
    expect(res.unpaid).toBe(21750)
    expect(res.settledCount).toBe(3)
    expect(Object.values(res.memberTotals).reduce((a, b) => a + b, 0)).toBe(55700)
  })

  it('rincian tiap anggota menjumlah tepat ke nominalnya', () => {
    expect(validateBill(delivery)).toBeNull()
    const res = summarizeBill(delivery)
    expect(Object.values(res.memberTotals).reduce((a, b) => a + b, 0)).toBe(63867)
    for (const m of members) {
      const sum = res.memberLines[m.id].reduce((s, l) => s + l.amount, 0)
      expect(sum).toBe(res.memberTotals[m.id])
    }
  })

  it('potongan item tampil sebagai baris diskon dan pajak termasuk tidak jadi baris', () => {
    const res = summarizeBill(
      bill({
        total: 11000,
        items: [{ id: 'm', name: 'Mabell', qty: 2, unit_price: 8700, line_total: 17400, discount: 6400 }],
        fees: { tax: 1090, tax_included: true },
        assignments: { m: [{ member_id: 'samuel' }, { member_id: 'budi' }] },
      }),
    )
    expect(res.memberLines.samuel).toEqual([
      { label: 'Mabell', note: 'dibagi 2', amount: 8700, kind: 'item' },
      { label: 'Diskon', amount: -3200, kind: 'discount' },
    ])
    expect(res.memberLines.evan).toEqual([])
  })
})

describe('validateBill', () => {
  it('menolak total yang tidak sama dengan hitungan', () => {
    expect(validateBill({ ...delivery, total: 63000 })).toMatch(/belum sama/)
  })

  it('menolak item yang belum dibagi dan anggota yang tidak dikenal', () => {
    expect(validateBill({ ...delivery, assignments: { ...delivery.assignments, c: [] } })).toMatch(/belum dibagi/)
    expect(
      validateBill({ ...delivery, assignments: { ...delivery.assignments, c: [{ member_id: 'hantu' }] } }),
    ).toMatch(/anggota yang tidak ada/)
  })

  it('menolak dua orang yang nalangin', () => {
    const two = delivery.members.map((m) => ({ ...m, is_payer: true }))
    expect(validateBill({ ...delivery, members: two })).toMatch(/satu orang/)
  })

  it('jalur manual: nominal harus pas, persen harus 100', () => {
    const base = bill({ mode: 'manual', total: 1000 })
    const even = { samuel: 200, evan: 200, sulthan: 200, rina: 200, budi: 200 }
    expect(validateBill({ ...base, manual: { split: 'amount', values: even } })).toBeNull()
    expect(validateBill({ ...base, manual: { split: 'amount', values: { ...even, budi: 100 } } })).toMatch(/nominal/i)
    expect(validateBill({ ...base, manual: { split: 'percent', values: { samuel: 50, evan: 40 } } })).toMatch(/100/)
    expect(validateBill({ ...base, manual: { split: 'equal', values: {} } })).toBeNull()
  })
})
