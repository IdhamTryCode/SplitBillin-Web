import { describe, it, expect } from 'vitest'
import { computeSplit } from './split'
import type { BillFees, BillItem, BillMember, ItemAssignment } from './schemas'

/** Deterministic LCG so a failure can be reproduced from its seed. */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface GeneratedCase {
  items: BillItem[]
  fees: BillFees
  total: number
  members: BillMember[]
  assignments: Record<string, ItemAssignment[]>
  expectedComputed: number
}

/** Random but always-consistent bill: every item is assigned, total = computed + adjustment. */
function randomCase(rng: () => number): GeneratedCase {
  const memberCount = 2 + Math.floor(rng() * 5) // 2..6
  const members: BillMember[] = Array.from({ length: memberCount }, (_, i) => ({
    id: `m${i}`,
    name: `Orang ${i}`,
    color: '#7e22ce',
    is_payer: i === 0,
    paid_at: null,
  }))

  const itemCount = 1 + Math.floor(rng() * 12) // 1..12
  const items: BillItem[] = []
  const assignments: Record<string, ItemAssignment[]> = {}

  for (let i = 0; i < itemCount; i++) {
    const qty = 1 + Math.floor(rng() * 5)
    const unitPrice = Math.floor(rng() * 49501) + 500
    const lineTotal = qty * unitPrice
    const discount = Math.floor(rng() * Math.floor(lineTotal * 0.5 + 1))
    items.push({ id: `i${i}`, name: `Item ${i}`, qty, unit_price: unitPrice, line_total: lineTotal, discount })

    // Assign to a non-empty subset so no item's net is lost.
    const chosen = shuffle(members, rng).slice(0, 1 + Math.floor(rng() * memberCount))
    const withUnits = qty > 1 && rng() < 0.5
    assignments[`i${i}`] = chosen.map((m) =>
      withUnits ? { member_id: m.id, units: 1 + Math.floor(rng() * qty) } : { member_id: m.id },
    )
  }

  const otherCount = Math.floor(rng() * 3)
  const other = Array.from({ length: otherCount }, (_, i) => ({
    name: `Biaya ${i}`,
    amount: Math.floor(rng() * 15001),
  }))
  const fees: BillFees = {
    discount: Math.floor(rng() * 5001),
    service: Math.floor(rng() * 10001),
    other,
    tax: Math.floor(rng() * 20001),
    tax_included: rng() < 0.5,
    rounding: Math.floor(rng() * 1001) - 500,
    adjustment: Math.floor(rng() * 1001) - 500,
  }

  const net = items.reduce((s, it) => s + it.line_total - it.discount, 0)
  const otherTotal = other.reduce((s, f) => s + f.amount, 0)
  const expectedComputed =
    net - fees.discount + fees.service + otherTotal + (fees.tax_included ? 0 : fees.tax) + fees.rounding
  const total = expectedComputed + fees.adjustment

  return { items, fees, total, members, assignments, expectedComputed }
}

describe('computeSplit — property (seeded)', () => {
  it('Σ memberTotals selalu sama dengan total (diskon item, pajak, pembulatan, per porsi)', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = makeRng(seed * 2654435761)
      const c = randomCase(rng)
      const res = computeSplit(c.items, c.fees, c.total, c.members, c.assignments)
      const sum = Object.values(res.memberTotals).reduce((a, b) => a + b, 0)
      expect(sum, `seed ${seed}: Σ memberTotals`).toBe(c.total)
      for (const [id, v] of Object.entries(res.memberTotals)) {
        expect(Number.isInteger(v), `seed ${seed}: ${id} harus integer`).toBe(true)
      }
    }
  })

  it('computed mengikuti rumus dan mengabaikan pajak yang sudah termasuk', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = makeRng(seed * 40503)
      const c = randomCase(rng)
      const res = computeSplit(c.items, c.fees, c.total, c.members, c.assignments)
      expect(res.computed, `seed ${seed}: computed`).toBe(c.expectedComputed)
    }
  })
})
