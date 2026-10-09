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
  editToken: string
}

export const DEFAULT_COLORS = ['#7e22ce', '#2563eb', '#059669', '#d97706', '#db2777', '#0891b2']

export function emptyFees(): BillFees {
  return { discount: 0, service: 0, other: [], tax: 0, tax_included: false, rounding: 0, adjustment: 0 }
}
