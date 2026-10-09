import type { BillFees } from '@/lib/schemas'
import type { ScanErrorResponseCode } from '@/lib/scan-types'

export type Branch = 'scan' | 'manual'

export type Phase =
  | 'choose'
  | 'details'
  | 'capture'
  | 'loading'
  | 'review'
  | 'anggota'
  | 'bagi'
  | 'bayar'
  | 'tinjau'
  | 'sukses'

export interface ScanFailure {
  code: ScanErrorResponseCode
  retryAfter?: number
}

export interface CreatedBill {
  id: string
  /** Null when the bill belongs to a signed-in account (no secret link). */
  editToken: string | null
}

/** QRIS image picked in the wizard; uploaded together with the bill. */
export interface QrisDraft {
  blob: Blob
  previewUrl: string
}

export const DEFAULT_COLORS = [
  '#7e22ce',
  '#2563eb',
  '#059669',
  '#d97706',
  '#db2777',
  '#0891b2',
  '#dc2626',
  '#4f46e5',
  '#65a30d',
  '#c026d3',
  '#0d9488',
  '#ea580c',
]

export function emptyFees(): BillFees {
  return { discount: 0, service: 0, other: [], tax: 0, tax_included: false, rounding: 0, adjustment: 0 }
}
