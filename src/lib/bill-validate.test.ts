import { describe, it, expect } from 'vitest'
import { validateBill, MAX_ITEMS, MAX_MEMBERS, MAX_PAYMENT_METHODS } from './bill-validate'
import { BillDataSchema, type BillData, type BillDataInput } from './schemas'

const members = [
  { id: 'a', name: 'Aku', color: '#7e22ce', is_payer: true, paid_at: null },
  { id: 'b', name: 'Budi', color: '#2563eb', is_payer: false, paid_at: null },
]

function receipt(partial: Partial<BillDataInput> = {}): BillData {
  return BillDataSchema.parse({
    mode: 'receipt',
    merchant: 'Uji',
    total: 10000,
    members,
    items: [{ id: 'i1', name: 'Nasi', qty: 1, unit_price: 10000, line_total: 10000, discount: 0 }],
    assignments: { i1: [{ member_id: 'a' }, { member_id: 'b' }] },
    ...partial,
  })
}

function manual(partial: Partial<BillDataInput> = {}): BillData {
  return BillDataSchema.parse({
    mode: 'manual',
    merchant: 'Uji',
    total: 1000,
    members,
    manual: { split: 'equal', values: {} },
    ...partial,
  })
}

describe('validateBill — setiap cabang penolakan', () => {
  it('menerima bill receipt yang konsisten', () => {
    expect(validateBill(receipt())).toBeNull()
  })

  it('menerima bill manual yang konsisten', () => {
    expect(validateBill(manual())).toBeNull()
  })

  it('anggota: id dobel', () => {
    const dup = receipt({
      members: [
        { id: 'a', name: 'Aku', color: '#7e22ce', is_payer: true, paid_at: null },
        { id: 'a', name: 'Budi', color: '#2563eb', is_payer: false, paid_at: null },
      ],
    })
    expect(validateBill(dup)).toMatch(/dobel/)
  })

  it(`anggota: lebih dari ${MAX_MEMBERS} orang`, () => {
    const many = Array.from({ length: MAX_MEMBERS + 1 }, (_, i) => ({
      id: `m${i}`,
      name: `Orang ${i}`,
      color: '#7e22ce',
      is_payer: i === 0,
      paid_at: null,
    }))
    expect(validateBill(receipt({ members: many }))).toMatch(new RegExp(`Maksimal ${MAX_MEMBERS} anggota`))
  })

  it('anggota: bukan tepat satu yang nalangin', () => {
    const none = receipt({ members: members.map((m) => ({ ...m, is_payer: false })) })
    const two = receipt({ members: members.map((m) => ({ ...m, is_payer: true })) })
    expect(validateBill(none)).toMatch(/satu orang/)
    expect(validateBill(two)).toMatch(/satu orang/)
  })

  it('anggota: nama sama (beda huruf besar/kecil)', () => {
    const dup = receipt({
      members: [
        { id: 'a', name: 'Budi', color: '#7e22ce', is_payer: true, paid_at: null },
        { id: 'b', name: '  budi ', color: '#2563eb', is_payer: false, paid_at: null },
      ],
    })
    expect(validateBill(dup)).toMatch(/Nama anggota tidak boleh sama/)
  })

  it(`pembayaran: lebih dari ${MAX_PAYMENT_METHODS} cara bayar`, () => {
    const methods = Array.from({ length: MAX_PAYMENT_METHODS + 1 }, () => ({
      kind: 'bank' as const,
      provider: 'BCA',
      number: '123',
      holder: 'Aku',
    }))
    expect(validateBill(receipt({ payment: { methods } }))).toMatch(/Terlalu banyak cara bayar/)
  })

  describe('jalur manual', () => {
    it('cara membagi belum dipilih', () => {
      expect(validateBill(manual({ manual: null }))).toMatch(/belum dipilih/)
    })

    it('total tidak lebih dari 0', () => {
      expect(validateBill(manual({ total: 0 }))).toMatch(/lebih dari 0/)
    })

    it('nominal bukan bilangan bulat', () => {
      expect(validateBill(manual({ manual: { split: 'amount', values: { a: 500.5, b: 499.5 } } }))).toMatch(/bulat/)
    })

    it('jumlah nominal belum sama dengan total', () => {
      expect(validateBill(manual({ manual: { split: 'amount', values: { a: 400, b: 500 } } }))).toMatch(
        /belum sama dengan total/,
      )
    })

    it('total persen harus 100', () => {
      expect(validateBill(manual({ manual: { split: 'percent', values: { a: 50, b: 40 } } }))).toMatch(/100/)
    })

    it('nilai pembagian negatif / tak hingga ditolak', () => {
      // Nilai ini tidak bisa lolos zod; panggil validateBill langsung dengan cast.
      const valid = manual({ manual: { split: 'amount', values: { a: 500, b: 500 } } })
      const negative = { ...valid, manual: { split: 'amount' as const, values: { a: -1, b: 1001 } } } as unknown as BillData
      const infinite = { ...valid, manual: { split: 'amount' as const, values: { a: NaN, b: 1000 } } } as unknown as BillData
      expect(validateBill(negative)).toMatch(/tidak valid/)
      expect(validateBill(infinite)).toMatch(/tidak valid/)
    })
  })

  describe('jalur receipt', () => {
    it('tanpa item', () => {
      expect(validateBill(receipt({ items: [], assignments: {} }))).toMatch(/minimal satu item/)
    })

    it(`lebih dari ${MAX_ITEMS} item`, () => {
      const items = Array.from({ length: MAX_ITEMS + 1 }, (_, i) => ({
        id: `i${i}`,
        name: `Item ${i}`,
        qty: 1,
        unit_price: 1000,
        line_total: 1000,
        discount: 0,
      }))
      expect(validateBill(receipt({ items, assignments: {} }))).toMatch(new RegExp(`Maksimal ${MAX_ITEMS} item`))
    })

    it('id item dobel', () => {
      const dup = receipt({
        items: [
          { id: 'i1', name: 'Nasi', qty: 1, unit_price: 5000, line_total: 5000, discount: 0 },
          { id: 'i1', name: 'Es', qty: 1, unit_price: 5000, line_total: 5000, discount: 0 },
        ],
        assignments: { i1: [{ member_id: 'a' }] },
      })
      expect(validateBill(dup)).toMatch(/item yang dobel/)
    })

    it('potongan item melebihi harga', () => {
      const over = receipt({
        items: [{ id: 'i1', name: 'Diskon aneh', qty: 1, unit_price: 1000, line_total: 1000, discount: 2000 }],
        assignments: { i1: [{ member_id: 'a' }] },
      })
      expect(validateBill(over)).toMatch(/melebihi harganya/)
    })

    it('item belum dibagi', () => {
      expect(validateBill(receipt({ assignments: { i1: [] } }))).toMatch(/belum dibagi/)
    })

    it('pembagian merujuk anggota yang tidak ada', () => {
      expect(validateBill(receipt({ assignments: { i1: [{ member_id: 'hantu' }] } }))).toMatch(/anggota yang tidak ada/)
    })

    it('pembagian item dobel untuk satu anggota', () => {
      expect(
        validateBill(receipt({ assignments: { i1: [{ member_id: 'a' }, { member_id: 'a' }] } })),
      ).toMatch(/dobel untuk satu anggota/)
    })

    it('pembagian merujuk item yang tidak ada', () => {
      expect(validateBill(receipt({ assignments: { i1: [{ member_id: 'a' }], i2: [{ member_id: 'b' }] } }))).toMatch(
        /item yang tidak ada/,
      )
    })

    it('hitungan item + biaya belum sama dengan total', () => {
      expect(validateBill(receipt({ total: 9000 }))).toMatch(/belum sama dengan total/)
    })
  })
})
