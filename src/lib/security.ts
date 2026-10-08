import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Compare two secret strings in constant time.
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/**
 * Hash secret edit token with SHA-256 for database storage.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Generate a short random alphanumeric ID for bills (e.g. 8 chars like "k9x2m4p7").
 */
export function generateShortId(length = 8): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz' // exclude confusing chars like 0, O, 1, l, i
  const bytes = randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

/**
 * Generate a cryptographically secure random token for managing bills (32 chars hex).
 */
export function generateToken(): string {
  return randomBytes(16).toString('hex')
}
