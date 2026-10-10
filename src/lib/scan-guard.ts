/**
 * Abuse prevention for `POST /api/scan` (plan.md §4.4): Turnstile fail-closed,
 * then per-IP/minute, per-IP or per-account/day, and a global daily cap. Every
 * check runs before the LLM is called.
 */

import { clientIp, rateLimitDb } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import type { ScanGuardFailure } from '@/lib/scan-types'

export type { ScanGuardFailure }

export type ScanGuardResult =
  | { ok: true }
  | { ok: false; code: ScanGuardFailure; retryAfter?: number; status?: number }

const DAY_SECONDS = 86_400

function envInt(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? '', 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export function scanQuotas() {
  return {
    perMinIp: envInt('SCAN_PER_MIN_IP', 5),
    perDayGuest: envInt('SCAN_PER_DAY_GUEST', 10),
    perDayUser: envInt('SCAN_PER_DAY_USER', 25),
    perDayGlobal: envInt('SCAN_PER_DAY_GLOBAL', 200),
  }
}

/** Calendar day in WIB, so daily quotas reset at local midnight. */
function today(): string {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
}

function secondsUntilTomorrow(): number {
  const nowWib = Date.now() + 7 * 3600_000
  return DAY_SECONDS - (Math.floor(nowWib / 1000) % DAY_SECONDS)
}

/**
 * The caller's IP. On Vercel `x-real-ip` is a single client IP set by the
 * platform and cannot be spoofed by the caller; `x-forwarded-for` is a list the
 * client can append to, so it is only a fallback. Delegates to the shared
 * `clientIp` helper so the scan guard and the rate limiter agree on one source.
 */
export function getClientIp(req: Request): string {
  return clientIp(req.headers)
}

export async function checkScanGuard(req: {
  ip: string
  turnstileToken?: string
  userId?: string | null
}): Promise<ScanGuardResult> {
  const turnstile = await verifyTurnstile(req.turnstileToken, req.ip)
  if (!turnstile.ok) {
    return {
      ok: false,
      code: 'bot_check_failed',
      status: turnstile.reason === 'misconfigured' ? 503 : 403,
    }
  }

  const quotas = scanQuotas()
  const day = today()

  if (!(await rateLimitDb(`scan:min:${req.ip}`, quotas.perMinIp, 60))) {
    return { ok: false, code: 'rate_limited', retryAfter: 60 }
  }

  const withinDaily = req.userId
    ? await rateLimitDb(`scan:day:user:${req.userId}:${day}`, quotas.perDayUser, DAY_SECONDS)
    : await rateLimitDb(`scan:day:ip:${req.ip}:${day}`, quotas.perDayGuest, DAY_SECONDS)
  if (!withinDaily) {
    return { ok: false, code: 'rate_limited', retryAfter: secondsUntilTomorrow() }
  }

  if (!(await rateLimitDb(`scan:day:global:${day}`, quotas.perDayGlobal, DAY_SECONDS))) {
    return { ok: false, code: 'quota_exceeded' }
  }

  return { ok: true }
}
