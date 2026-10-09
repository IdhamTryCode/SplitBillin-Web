/**
 * Per-member breakdown for display ("Rincian pesanan"). Pure. The lines of a
 * member always add up to that member's total from `split.ts`.
 */

import { computeManualSplit, computeSplit, largestRemainder } from './split'
import type { BillData } from './schemas'

export interface BreakdownLine {
  label: string
  /** Extra hint, e.g. the member's portion of the item. */
  note?: string
  amount: number
  kind: 'item' | 'discount' | 'fee'
}

export interface BillSummary {
  memberTotals: Record<string, number>
  /** Empty for manual bills (no per-item detail on that path). */
  memberLines: Record<string, BreakdownLine[]>
  /** Owed by members who are neither the payer nor marked paid. */
  unpaid: number
  /** Members counted as settled (the payer plus everyone marked paid). */
  settledCount: number
}

export function summarizeBill(data: BillData): BillSummary {
  const settledCount = data.members.filter((m) => m.is_payer || m.paid_at).length

  if (data.mode === 'manual' || data.items.length === 0) {
    const manual = data.manual ?? { split: 'equal' as const, values: {} }
    const res = computeManualSplit(data.total, data.members, manual.split, manual.values)
    return { memberTotals: res.memberTotals, memberLines: {}, unpaid: res.unpaid, settledCount }
  }

  const split = computeSplit(data.items, data.fees, data.total, data.members, data.assignments)
  const memberIds = data.members.map((m) => m.id)
  const weights = memberIds.map((id) => split.memberItems[id] ?? 0)

  const components: Array<{ label: string; amount: number; kind: 'discount' | 'fee' }> = []
  const { fees } = data
  if (fees.discount) components.push({ label: 'Diskon', amount: -fees.discount, kind: 'discount' })
  if (fees.service) components.push({ label: 'Service', amount: fees.service, kind: 'fee' })
  for (const f of fees.other) if (f.amount) components.push({ label: f.name, amount: f.amount, kind: 'fee' })
  if (fees.tax && !fees.tax_included) components.push({ label: 'Pajak', amount: fees.tax, kind: 'fee' })
  if (fees.rounding) components.push({ label: 'Pembulatan', amount: fees.rounding, kind: 'fee' })
  if (fees.adjustment) components.push({ label: 'Penyesuaian', amount: fees.adjustment, kind: 'fee' })

  const componentShares = components.map((c) => largestRemainder(c.amount, weights))

  const memberLines: Record<string, BreakdownLine[]> = {}
  memberIds.forEach((id, idx) => {
    const lines: BreakdownLine[] = []

    for (const item of data.items) {
      const share = split.memberItemDetails[id]?.[item.id]
      if (share === undefined) continue
      const net = item.line_total - item.discount
      const discountShare = net > 0 ? Math.round((item.discount * share) / net) : 0
      const assigned = data.assignments[item.id] ?? []
      const mine = assigned.find((a) => a.member_id === id)
      let note: string | undefined
      if (mine?.units) note = `${mine.units} dari ${item.qty} porsi`
      else if (assigned.length > 1) note = `dibagi ${assigned.length}`
      lines.push({ label: item.name, note, amount: share + discountShare, kind: 'item' })
      if (discountShare) lines.push({ label: 'Diskon', amount: -discountShare, kind: 'discount' })
    }

    const feeLines: BreakdownLine[] = []
    components.forEach((c, ci) => {
      const amount = componentShares[ci][idx]
      if (amount) feeLines.push({ label: c.label, amount, kind: c.kind })
    })
    // Components are rounded one by one; fold the last rupiah of drift into the
    // largest line so the breakdown matches the member's allocated fees exactly.
    const drift = (split.memberFees[id] ?? 0) - feeLines.reduce((s, l) => s + l.amount, 0)
    if (drift !== 0) {
      if (feeLines.length === 0) {
        feeLines.push({ label: 'Pembulatan', amount: drift, kind: 'fee' })
      } else {
        const target = feeLines.reduce((a, b) => (Math.abs(b.amount) > Math.abs(a.amount) ? b : a))
        target.amount += drift
      }
    }

    memberLines[id] = [...lines, ...feeLines.filter((l) => l.amount !== 0)]
  })

  return { memberTotals: split.memberTotals, memberLines, unpaid: split.unpaid, settledCount }
}
