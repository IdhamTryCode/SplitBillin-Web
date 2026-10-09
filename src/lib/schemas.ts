/**
 * Zod schemas for SplitBillin data model.
 * Semua nominal bilangan bulat rupiah.
 */
import { z } from 'zod'

// ── Receipt scan output schema (from LLM) ──

export const ReceiptItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1),
  unit_price: z.number().int().min(0),
  line_total: z.number().int().min(0),
  discount: z.number().int().min(0).default(0),
})

export const OtherFeeSchema = z.object({
  name: z.string().min(1),
  amount: z.number().int(),
})

export const ReceiptSchema = z.object({
  is_receipt: z.literal(true),
  // Merchant can be unreadable on some receipts; the user fills it in on the
  // correction screen (falls back to "Tanpa nama").
  merchant: z.string().max(80).default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  items: z.array(ReceiptItemSchema).min(1),
  subtotal: z.number().int().default(0),
  discount: z.number().int().default(0),
  service_charge: z.number().int().default(0),
  other_fees: z.array(OtherFeeSchema).default([]),
  tax: z.number().int().default(0),
  tax_included: z.boolean().default(false),
  rounding: z.number().int().default(0),
  total: z.number().int().min(0),
})

export const NotReceiptSchema = z.object({
  is_receipt: z.literal(false),
})

export const ScanResultSchema = z.discriminatedUnion('is_receipt', [
  ReceiptSchema,
  NotReceiptSchema,
])

export type ReceiptData = z.infer<typeof ReceiptSchema>
export type ScanResult = z.infer<typeof ScanResultSchema>

// ── Bill data schema (stored in bills.data JSONB) ──

export const BillItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  qty: z.number().int().min(1),
  unit_price: z.number().int().min(0),
  line_total: z.number().int().min(0),
  discount: z.number().int().min(0).default(0),
})

export const BillFeesSchema = z.object({
  discount: z.number().int().default(0),
  service: z.number().int().default(0),
  other: z.array(OtherFeeSchema).default([]),
  tax: z.number().int().default(0),
  tax_included: z.boolean().default(false),
  rounding: z.number().int().default(0),
  adjustment: z.number().int().default(0),
})

export const BillMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  color: z.string(),
  is_payer: z.boolean().default(false),
  paid_at: z.string().nullable().default(null),
})

export const ItemAssignmentSchema = z.object({
  member_id: z.string(),
  units: z.number().int().min(1).optional(),
})

export const PaymentMethodSchema = z.object({
  kind: z.enum(['bank', 'ewallet', 'other']),
  provider: z.string().max(60).default(''),
  number: z.string().max(40).default(''),
  holder: z.string().max(80).default(''),
})

export const PaymentInfoSchema = z.object({
  methods: z.array(PaymentMethodSchema).default([]),
  qris_path: z.string().nullable().default(null),
  note: z.string().max(500).default(''),
})

export const ManualSplitSchema = z.object({
  split: z.enum(['equal', 'amount', 'percent']),
  values: z.record(z.string(), z.number()),
})

export const BillDataSchema = z.object({
  version: z.literal(1).default(1),
  mode: z.enum(['receipt', 'manual']),
  merchant: z.string().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  items: z.array(BillItemSchema).default([]),
  fees: BillFeesSchema.default(() => BillFeesSchema.parse({})),
  total: z.number().int().min(0),
  members: z.array(BillMemberSchema).min(2),
  assignments: z.record(z.string(), z.array(ItemAssignmentSchema)).default({}),
  manual: ManualSplitSchema.nullable().default(null),
  payment: PaymentInfoSchema.default(() => PaymentInfoSchema.parse({})),
})

export type BillItem = z.infer<typeof BillItemSchema>
export type BillFees = z.infer<typeof BillFeesSchema>
export type BillMember = z.infer<typeof BillMemberSchema>
export type ItemAssignment = z.infer<typeof ItemAssignmentSchema>
export type BillData = z.infer<typeof BillDataSchema>
export type ManualSplit = z.infer<typeof ManualSplitSchema>
export type PaymentInfo = z.infer<typeof PaymentInfoSchema>
