/**
 * Pure helpers for receipt-scan results.
 *
 * Mirror of the `arithmetic()` scorer in `scripts/ocr-test.mjs`: the server
 * always recomputes from the items instead of trusting the model's subtotal.
 */

import type { ReceiptData, BillItem, BillFees } from './schemas'

export interface RecomputeResult {
  /** Sum of net line totals (line_total − discount) across items. */
  net: number
  /** Total computed from items + receipt-level fees (without adjustment). */
  computed: number
  /** total − computed. Non-zero means a discrepancy the user must resolve. */
  diff: number
  consistent: boolean
}

/**
 * Recompute a receipt's total from its items and fees.
 */
export function recomputeReceipt(r: ReceiptData): RecomputeResult {
  const net = r.items.reduce((sum, item) => sum + item.line_total - item.discount, 0)
  const otherTotal = r.other_fees.reduce((sum, fee) => sum + fee.amount, 0)
  const computed =
    net - r.discount + r.service_charge + otherTotal + (r.tax_included ? 0 : r.tax) + r.rounding
  const diff = r.total - computed
  return { net, computed, diff, consistent: diff === 0 }
}

/**
 * Machine-readable warnings surfaced to the correction screen.
 */
export function buildScanWarnings(r: ReceiptData): string[] {
  const warnings: string[] = []
  const { net, consistent } = recomputeReceipt(r)
  if (!consistent) warnings.push('total_mismatch')
  if (r.subtotal !== 0 && r.subtotal !== net) warnings.push('subtotal_mismatch')
  return warnings
}

/**
 * Totals for an editable bill draft (items + receipt-level fees), excluding
 * `adjustment`. `computed` is what the items add up to before the user pins the
 * printed total.
 */
export function computeDraftTotals(
  items: BillItem[],
  fees: BillFees,
): { net: number; computed: number } {
  const net = items.reduce((sum, item) => sum + item.line_total - item.discount, 0)
  const otherTotal = fees.other.reduce((sum, fee) => sum + fee.amount, 0)
  const computed =
    net - fees.discount + fees.service + otherTotal + (fees.tax_included ? 0 : fees.tax) + fees.rounding
  return { net, computed }
}

/**
 * Fees with `adjustment` pinned to whatever makes items + fees equal `total`
 * (§4.3 step 5), so Σ member totals always equals the confirmed total.
 */
export function withAdjustment(items: BillItem[], fees: BillFees, total: number): BillFees {
  return { ...fees, adjustment: total - computeDraftTotals(items, fees).computed }
}

export interface ReceiptBillDraft {
  merchant: string
  date: string | null
  items: BillItem[]
  fees: BillFees
  total: number
}

/**
 * Map a validated receipt into the bill data model (items get fresh ids).
 */
export function receiptToBillDraft(r: ReceiptData, idFactory: () => string): ReceiptBillDraft {
  return {
    merchant: r.merchant,
    date: r.date,
    items: r.items.map((it) => ({
      id: idFactory(),
      name: it.name,
      qty: it.qty,
      unit_price: it.unit_price,
      line_total: it.line_total,
      discount: it.discount,
    })),
    fees: {
      discount: r.discount,
      service: r.service_charge,
      other: r.other_fees,
      tax: r.tax,
      tax_included: r.tax_included,
      rounding: r.rounding,
      adjustment: 0,
    },
    total: r.total,
  }
}
