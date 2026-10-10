import { describe, it, expect } from 'vitest'
import { getClientIp } from './scan-guard'

function req(headers: Record<string, string>) {
  return new Request('https://example.test/', { headers })
}

describe('getClientIp', () => {
  it('prefers x-real-ip (platform-set single client IP)', () => {
    expect(getClientIp(req({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '10.0.0.1, 203.0.113.7' }))).toBe(
      '203.0.113.7',
    )
  })

  it('falls back to the first hop of x-forwarded-for', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '198.51.100.9, 10.0.0.1' }))).toBe('198.51.100.9')
  })

  it('trims whitespace around the x-forwarded-for hop', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '  198.51.100.9 , 10.0.0.1' }))).toBe('198.51.100.9')
  })

  it('returns "unknown" when no IP header is present', () => {
    expect(getClientIp(req({}))).toBe('unknown')
  })
})
