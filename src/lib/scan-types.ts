import type { ReceiptData } from './schemas'

export type ScanErrorCode = 'not_receipt' | 'unreadable' | 'upstream_error'

export type ScanGuardFailure = 'rate_limited' | 'quota_exceeded' | 'bot_check_failed'

export type ScanErrorResponseCode = ScanErrorCode | ScanGuardFailure

export type ScanApiResponse =
  | { ok: true; receipt: ReceiptData; warnings: string[] }
  | { ok: false; code: ScanErrorResponseCode; retryAfter?: number }
