/**
 * Cloudflare Turnstile verification — fail-closed (plan.md §4.4).
 *
 * A request passes only when Cloudflare confirms the token. The single way
 * through without a token is `TURNSTILE_BYPASS=1` outside production.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TIMEOUT_MS = 8_000

export type TurnstileFailure = 'misconfigured' | 'missing_token' | 'rejected' | 'unreachable'

export type TurnstileResult = { ok: true } | { ok: false; reason: TurnstileFailure }

interface TurnstileDeps {
  env?: Record<string, string | undefined>
  fetchImpl?: typeof fetch
}

export async function verifyTurnstile(
  token: string | undefined,
  ip: string | undefined,
  deps: TurnstileDeps = {},
): Promise<TurnstileResult> {
  const env = deps.env ?? process.env
  const fetchImpl = deps.fetchImpl ?? fetch
  const isProduction = env.NODE_ENV === 'production'

  if (env.TURNSTILE_BYPASS === '1' && !isProduction) return { ok: true }

  const secret = env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY is not set; rejecting scan requests')
    return { ok: false, reason: 'misconfigured' }
  }
  if (!token) return { ok: false, reason: 'missing_token' }

  const body = new URLSearchParams({ secret, response: token })
  if (ip && ip !== 'unknown') body.set('remoteip', ip)

  try {
    const res = await fetchImpl(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return { ok: false, reason: 'unreachable' }
    const json = (await res.json()) as { success?: boolean }
    return json.success === true ? { ok: true } : { ok: false, reason: 'rejected' }
  } catch {
    return { ok: false, reason: 'unreachable' }
  }
}
