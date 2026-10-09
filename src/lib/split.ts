/**
 * Hitungan pembagian bill — fungsi murni, tanpa efek samping.
 *
 * Algoritma dari plan.md §4.3:
 * 1. Per item: net = line_total − discount. Dibagi ke anggota (rata, atau per units)
 *    dengan metode sisa terbesar (largest remainder) sehingga jumlahnya tepat net.
 * 2. member_items[m] = jumlah bagian item anggota itu.
 * 3. Biaya tingkat struk E = −discount + service + Σother + (tax_included ? 0 : tax)
 *    + rounding + adjustment. Dibagi proporsional ke member_items (rata bila semua 0).
 * 4. member_total = member_items + bagian E. Invarian: Σ member_total = total.
 * 5. computed = Σnet − discount + service + Σother + pajakDitambah + rounding.
 *    Jika computed ≠ total → banner selisih; adjustment = total − computed.
 * 6. Yang nalangin: otomatis lunas. Belum lunas = Σ bagian anggota lain yang belum paid.
 * 7. Jalur manual: equal, amount, percent.
 */

import type { BillItem, BillFees, BillMember, ItemAssignment } from './schemas'

// ── Largest Remainder Method ─────────────────────────────────────────────────

/**
 * Bagi bilangan bulat `total` menjadi array of ints proporsional terhadap
 * `weights`. Metode sisa terbesar (Hamilton) menjamin Σ result = total.
 */
export function largestRemainder(total: number, weights: number[]): number[] {
  const n = weights.length
  if (n === 0) return []
  if (n === 1) return [total]

  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum === 0) return splitEqual(total, n)

  const exact = weights.map((w) => (total * w) / sum)
  const floored = exact.map(Math.floor)
  const remainder = total - floored.reduce((a, b) => a + b, 0)

  // Urutkan index berdasarkan sisa pecahan terbesar; tie-break oleh index
  const indices = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)

  for (let j = 0; j < remainder; j++) {
    floored[indices[j].i]++
  }

  return floored
}

/**
 * Bagi rata bilangan bulat. Σ result = total dijamin.
 */
export function splitEqual(total: number, count: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [total]

  const base = Math.floor(total / count)
  const remainder = total - base * count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}

// ── Split Result ─────────────────────────────────────────────────────────────

export interface SplitResult {
  /** Total per anggota. Invarian: Σ values = bill total. */
  memberTotals: Record<string, number>
  /** Subtotal item per anggota (sebelum alokasi biaya). */
  memberItems: Record<string, number>
  /** Alokasi biaya tingkat struk per anggota. */
  memberFees: Record<string, number>
  /** Rincian: memberItemDetails[memberId][itemId] = nominal bagian. */
  memberItemDetails: Record<string, Record<string, number>>
  /** Total yang dihitung dari item + biaya (tanpa adjustment). */
  computed: number
  /** Jumlah belum dibayar (anggota bukan penalang dan belum paid_at). */
  unpaid: number
}

// ── Receipt mode split ───────────────────────────────────────────────────────

/**
 * Hitung pembagian bill mode receipt.
 */
export function computeSplit(
  items: BillItem[],
  fees: BillFees,
  total: number,
  members: BillMember[],
  assignments: Record<string, ItemAssignment[]>,
): SplitResult {
  const memberIds = members.map((m) => m.id)
  const memberItems: Record<string, number> = {}
  const memberItemDetails: Record<string, Record<string, number>> = {}

  for (const id of memberIds) {
    memberItems[id] = 0
    memberItemDetails[id] = {}
  }

  // Langkah 1: Bagi tiap item ke anggota yang ditandai
  for (const item of items) {
    const net = item.line_total - item.discount
    const assigned = assignments[item.id] ?? []
    if (assigned.length === 0) continue

    const hasUnits = assigned.some((a) => a.units !== undefined && a.units > 0)

    let shares: number[]
    if (hasUnits) {
      const weights = assigned.map((a) => a.units ?? 0)
      shares = largestRemainder(net, weights)
    } else {
      shares = splitEqual(net, assigned.length)
    }

    for (let i = 0; i < assigned.length; i++) {
      const mid = assigned[i].member_id
      memberItems[mid] = (memberItems[mid] ?? 0) + shares[i]
      if (!memberItemDetails[mid]) memberItemDetails[mid] = {}
      memberItemDetails[mid][item.id] = (memberItemDetails[mid][item.id] ?? 0) + shares[i]
    }
  }

  // Langkah 2: Hitung biaya tingkat struk (E)
  const otherTotal = fees.other.reduce((s, f) => s + f.amount, 0)
  const E =
    -fees.discount +
    fees.service +
    otherTotal +
    (fees.tax_included ? 0 : fees.tax) +
    fees.rounding +
    fees.adjustment

  // Langkah 3: Alokasikan E proporsional ke member_items
  const memberFees: Record<string, number> = {}
  const weights = memberIds.map((id) => memberItems[id] ?? 0)
  const feeShares = largestRemainder(E, weights)

  for (let i = 0; i < memberIds.length; i++) {
    memberFees[memberIds[i]] = feeShares[i]
  }

  // Langkah 4: member_total = member_items + bagian E
  const memberTotals: Record<string, number> = {}
  for (const id of memberIds) {
    memberTotals[id] = (memberItems[id] ?? 0) + (memberFees[id] ?? 0)
  }

  // Langkah 5: computed (tanpa adjustment)
  const netItems = items.reduce((s, item) => s + item.line_total - item.discount, 0)
  const computed =
    netItems - fees.discount + fees.service + otherTotal +
    (fees.tax_included ? 0 : fees.tax) + fees.rounding

  // Langkah 6: Hitung belum lunas
  let unpaid = 0
  for (const m of members) {
    if (!m.is_payer && !m.paid_at) {
      unpaid += memberTotals[m.id] ?? 0
    }
  }

  return {
    memberTotals,
    memberItems,
    memberFees,
    memberItemDetails,
    computed,
    unpaid,
  }
}

// ── Manual mode split ────────────────────────────────────────────────────────

export interface ManualSplitResult {
  memberTotals: Record<string, number>
  unpaid: number
}

/**
 * Hitung pembagian bill mode manual.
 */
export function computeManualSplit(
  total: number,
  members: BillMember[],
  mode: 'equal' | 'amount' | 'percent',
  values: Record<string, number>,
): ManualSplitResult {
  const memberIds = members.map((m) => m.id)
  const memberTotals: Record<string, number> = {}

  if (mode === 'equal') {
    const shares = splitEqual(total, memberIds.length)
    for (let i = 0; i < memberIds.length; i++) {
      memberTotals[memberIds[i]] = shares[i]
    }
  } else if (mode === 'amount') {
    for (const id of memberIds) {
      memberTotals[id] = values[id] ?? 0
    }
  } else if (mode === 'percent') {
    const shares = largestRemainder(
      total,
      memberIds.map((id) => values[id] ?? 0),
    )
    for (let i = 0; i < memberIds.length; i++) {
      memberTotals[memberIds[i]] = shares[i]
    }
  }

  let unpaid = 0
  for (const m of members) {
    if (!m.is_payer && !m.paid_at) {
      unpaid += memberTotals[m.id] ?? 0
    }
  }

  return { memberTotals, unpaid }
}
