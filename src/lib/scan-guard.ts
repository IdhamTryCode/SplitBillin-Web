/**
 * Abuse-prevention seam for `POST /api/scan`.
 *
 * Step 4 ships the interface only — the guard always passes so the scan flow
 * can be built and tested end to end. Step 5 fills in Cloudflare Turnstile
 * (fail-closed) and the `rate_limits` RPC quotas here.
 */

import type { ScanGuardFailure } from '@/lib/scan-types'

export type { ScanGuardFailure }

export type ScanGuardResult =
  | { ok: true }
  | { ok: false; code: ScanGuardFailure; retryAfter?: number }

/**
 * Resolve the caller's IP from proxy headers (first hop of x-forwarded-for).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? '0.0.0.0'
}

/**
 * Gate a scan request. Currently a no-op.
 *
 * TODO(Step 5):
 *   - Cloudflare Turnstile fail-closed via `src/lib/turnstile.ts`
 *     (empty secret in production → 503; unreachable Cloudflare → reject;
 *     only bypass when TURNSTILE_BYPASS=1 and NODE_ENV !== 'production').
 *   - Per-IP/minute, per-IP/day (guest), per-account/day, and global daily
 *     quotas through the `check_rate_limit` RPC + memory fallback.
 */
export async function checkScanGuard(_req: {
  ip: string
  turnstileToken?: string
}): Promise<ScanGuardResult> {
  return { ok: true }
}
