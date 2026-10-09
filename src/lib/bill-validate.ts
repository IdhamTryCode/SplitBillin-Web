/**
 * Cross-field validation for a bill, on top of the zod shape check. Pure, so
 * it runs in every server action that writes `bills.data`.
 */

import type { BillData } from './schemas'

export const MAX_MEMBERS = 30
export const MAX_ITEMS = 150
export const MAX_PAYMENT_METHODS = 6

/** Returns a user-facing error message, or null when the bill is consistent. */
export function validateBill(bill: BillData): string | null {
  const memberIds = new Set(bill.members.map((m) => m.id))
  if (memberIds.size !== bill.members.length) return 'Ada anggota yang dobel'
  if (bill.members.length > MAX_MEMBERS) return `Maksimal ${MAX_MEMBERS} anggota`
  if (bill.members.filter((m) => m.is_payer).length !== 1) return 'Harus ada tepat satu orang yang nalangin'

  const names = new Set(bill.members.map((m) => m.name.trim().toLowerCase()))
  if (names.size !== bill.members.length) return 'Nama anggota tidak boleh sama'

  if (bill.payment.methods.length > MAX_PAYMENT_METHODS) return 'Terlalu banyak cara bayar'

  if (bill.mode === 'manual') {
    if (!bill.manual) return 'Cara membagi belum dipilih'
    if (bill.total <= 0) return 'Total tagihan harus lebih dari 0'
    const values = bill.members.map((m) => bill.manual!.values[m.id] ?? 0)
    if (values.some((v) => !Number.isFinite(v) || v < 0)) return 'Nilai pembagian tidak valid'
    const sum = values.reduce((a, b) => a + b, 0)
    if (bill.manual.split === 'amount') {
      if (values.some((v) => !Number.isInteger(v))) return 'Nominal harus bilangan bulat'
      if (sum !== bill.total) return 'Jumlah nominal belum sama dengan total'
    }
    if (bill.manual.split === 'percent' && Math.abs(sum - 100) > 1e-6) return 'Total persen harus 100'
    return null
  }

  if (bill.items.length === 0) return 'Tambahkan minimal satu item'
  if (bill.items.length > MAX_ITEMS) return `Maksimal ${MAX_ITEMS} item`

  const itemIds = new Set(bill.items.map((i) => i.id))
  if (itemIds.size !== bill.items.length) return 'Ada item yang dobel'

  for (const item of bill.items) {
    if (item.discount > item.line_total) return `Potongan "${item.name}" melebihi harganya`
    const assigned = bill.assignments[item.id] ?? []
    if (assigned.length === 0) return `Item "${item.name}" belum dibagi`
    const seen = new Set<string>()
    for (const a of assigned) {
      if (!memberIds.has(a.member_id)) return 'Pembagian merujuk anggota yang tidak ada'
      if (seen.has(a.member_id)) return 'Pembagian item dobel untuk satu anggota'
      seen.add(a.member_id)
    }
  }
  for (const itemId of Object.keys(bill.assignments)) {
    if (!itemIds.has(itemId)) return 'Pembagian merujuk item yang tidak ada'
  }

  // Everything the members owe must add up to the confirmed total (§4.3).
  const net = bill.items.reduce((s, i) => s + i.line_total - i.discount, 0)
  const other = bill.fees.other.reduce((s, f) => s + f.amount, 0)
  const sum =
    net -
    bill.fees.discount +
    bill.fees.service +
    other +
    (bill.fees.tax_included ? 0 : bill.fees.tax) +
    bill.fees.rounding +
    bill.fees.adjustment
  if (sum !== bill.total) return 'Hitungan item dan biaya belum sama dengan total'

  return null
}
