import { createAdminClient } from '@/lib/supabase/admin'

/**
 * In-memory limiter (sliding window per key). State lives per serverless
 * instance, so it is only a fallback for when the database limiter is down.
 */
const hits = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  }
  return true
}

/**
 * Database-backed limiter (`check_rate_limit`, atomic in Postgres) — consistent
 * across serverless instances. Returns true while the attempt is within limit.
 * Falls back to the memory limiter if the RPC fails.
 */
export async function rateLimitDb(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (limit <= 0) return false
  try {
    const { data, error } = await createAdminClient().rpc('check_rate_limit', {
      p_key: key,
      p_max: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) throw error
    return data === true
  } catch (err) {
    console.error('[rateLimitDb] falling back to memory:', err instanceof Error ? err.message : err)
    return rateLimit(key, limit, windowSeconds * 1000)
  }
}

/** Client IP from the headers Vercel fills in (not from the client directly). */
export function clientIp(h: Headers): string {
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
