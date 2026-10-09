import { describe, it, expect } from 'vitest'
import { ReceiptSchema, ScanResultSchema, type ReceiptData } from './schemas'
import { buildScanWarnings, computeDraftTotals, receiptToBillDraft, recomputeReceipt } from './receipt'

// Sample-warung fixture (mirrors results-kenari-lite/kenari-sample-warung.json).
const RAW = {
  is_receipt: true,
  merchant: 'WARUNG BU TINI',
  date: '2026-09-12',
  items: [
    { name: 'NASI GORENG SPESIAL', qty: 2, unit_price: 28000, line_total: 56000, discount: 0 },
    { name: 'ES TEH MANIS', qty: 2, unit_price: 8000, line_total: 16000, discount: 0 },
    { name: 'AYAM BAKAR', qty: 1, unit_price: 35000, line_total: 35000, discount: 5000 },
    { name: 'KERUPUK', qty: 1, unit_price: 5000, line_total: 5000, discount: 0 },
  ],
  subtotal: 107000,
  discount: 0,
  service_charge: 5350,
  tax: 11235,
  rounding: 15,
  total: 123600,
}

const receipt: ReceiptData = ReceiptSchema.parse(RAW)

describe('receipt.ts', () => {
  describe('recomputeReceipt', () => {
    it('recomputes the sample total from items and fees', () => {
      const res = recomputeReceipt(receipt)
      expect(res.net).toBe(107000)
      expect(res.computed).toBe(123600)
      expect(res.diff).toBe(0)
      expect(res.consistent).toBe(true)
    })

    it('flags a mismatch when the printed total differs', () => {
      const res = recomputeReceipt({ ...receipt, total: 120000 })
      expect(res.diff).toBe(-3600)
      expect(res.consistent).toBe(false)
    })

    it('never adds tax when tax_included is true', () => {
      const res = recomputeReceipt({ ...receipt, tax_included: true })
      // tax 11235 is dropped from the computed total
      expect(res.computed).toBe(123600 - 11235)
    })
  })

  describe('buildScanWarnings', () => {
    it('returns no warnings for a consistent sample', () => {
      expect(buildScanWarnings(receipt)).toEqual([])
    })

    it('warns on total mismatch', () => {
      expect(buildScanWarnings({ ...receipt, total: 120000 })).toContain('total_mismatch')
    })

    it('warns when a printed subtotal disagrees with items', () => {
      expect(buildScanWarnings({ ...receipt, subtotal: 100000 })).toContain('subtotal_mismatch')
    })
  })

  describe('receiptToBillDraft', () => {
    it('maps receipt fields into the bill model', () => {
      const draft = receiptToBillDraft(receipt, (() => {
        let n = 0
        return () => `item-${n++}`
      })())

      expect(draft.merchant).toBe('WARUNG BU TINI')
      expect(draft.date).toBe('2026-09-12')
      expect(draft.total).toBe(123600)
      expect(draft.fees.service).toBe(5350)
      expect(draft.fees.tax).toBe(11235)
      expect(draft.fees.tax_included).toBe(false)
      expect(draft.fees.rounding).toBe(15)
      expect(draft.fees.other).toEqual([])
      expect(draft.fees.adjustment).toBe(0)
      expect(draft.items).toHaveLength(4)
      expect(new Set(draft.items.map((i) => i.id)).size).toBe(4)
    })

    it('draft totals match the recomputed receipt', () => {
      const draft = receiptToBillDraft(receipt, () => 'x')
      expect(computeDraftTotals(draft.items, draft.fees).computed).toBe(123600)
    })
  })

  describe('ScanResultSchema', () => {
    it('accepts a not-a-receipt payload', () => {
      const parsed = ScanResultSchema.safeParse({ is_receipt: false })
      expect(parsed.success).toBe(true)
    })

    it('accepts an empty merchant (unreadable on the receipt)', () => {
      const parsed = ScanResultSchema.safeParse({ ...RAW, merchant: '' })
      expect(parsed.success).toBe(true)
    })

    it('rejects a payload with no items', () => {
      expect(ScanResultSchema.safeParse({ is_receipt: true, merchant: 'X', items: [] }).success).toBe(false)
    })
  })
})
