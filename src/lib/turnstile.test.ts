import { describe, it, expect, vi } from 'vitest'
import { verifyTurnstile } from './turnstile'

const okFetch = (success: boolean) =>
  vi.fn(async () => new Response(JSON.stringify({ success }), { status: 200 })) as unknown as typeof fetch

describe('verifyTurnstile', () => {
  it('production tanpa secret → ditolak', async () => {
    const fetchImpl = okFetch(true)
    const res = await verifyTurnstile('tok', '1.1.1.1', { env: { NODE_ENV: 'production' }, fetchImpl })
    expect(res).toEqual({ ok: false, reason: 'misconfigured' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('production dengan bypass → tetap ditolak', async () => {
    const res = await verifyTurnstile(undefined, '1.1.1.1', {
      env: { NODE_ENV: 'production', TURNSTILE_BYPASS: '1' },
      fetchImpl: okFetch(true),
    })
    expect(res.ok).toBe(false)
  })

  it('production dengan bypass dan secret tapi tanpa token → ditolak', async () => {
    const res = await verifyTurnstile(undefined, '1.1.1.1', {
      env: { NODE_ENV: 'production', TURNSTILE_BYPASS: '1', TURNSTILE_SECRET_KEY: 's' },
      fetchImpl: okFetch(true),
    })
    expect(res).toEqual({ ok: false, reason: 'missing_token' })
  })

  it('development dengan bypass → lolos tanpa memanggil Cloudflare', async () => {
    const fetchImpl = okFetch(false)
    const res = await verifyTurnstile(undefined, undefined, {
      env: { NODE_ENV: 'development', TURNSTILE_BYPASS: '1' },
      fetchImpl,
    })
    expect(res).toEqual({ ok: true })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('development tanpa bypass dan tanpa secret → ditolak', async () => {
    const res = await verifyTurnstile('tok', undefined, { env: { NODE_ENV: 'development' }, fetchImpl: okFetch(true) })
    expect(res).toEqual({ ok: false, reason: 'misconfigured' })
  })

  it('Cloudflare tak terjangkau → ditolak', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network')
    }) as unknown as typeof fetch
    const res = await verifyTurnstile('tok', '1.1.1.1', {
      env: { NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 's' },
      fetchImpl,
    })
    expect(res).toEqual({ ok: false, reason: 'unreachable' })
  })

  it('Cloudflare membalas 5xx → ditolak', async () => {
    const fetchImpl = vi.fn(async () => new Response('oops', { status: 500 })) as unknown as typeof fetch
    const res = await verifyTurnstile('tok', '1.1.1.1', {
      env: { NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 's' },
      fetchImpl,
    })
    expect(res).toEqual({ ok: false, reason: 'unreachable' })
  })

  it('token ditolak Cloudflare → ditolak', async () => {
    const res = await verifyTurnstile('tok', '1.1.1.1', {
      env: { NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 's' },
      fetchImpl: okFetch(false),
    })
    expect(res).toEqual({ ok: false, reason: 'rejected' })
  })

  it('token valid → lolos, secret dan token dikirim ke Cloudflare', async () => {
    const fetchImpl = okFetch(true)
    const res = await verifyTurnstile('tok', '1.1.1.1', {
      env: { NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 's' },
      fetchImpl,
    })
    expect(res).toEqual({ ok: true })
    const body = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body as URLSearchParams
    expect(body.get('secret')).toBe('s')
    expect(body.get('response')).toBe('tok')
    expect(body.get('remoteip')).toBe('1.1.1.1')
  })
})
