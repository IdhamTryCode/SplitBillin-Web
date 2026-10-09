import { NextResponse } from 'next/server'
import { scanReceipt } from '@/lib/llm/scan-receipt'
import { buildScanWarnings } from '@/lib/receipt'
import { checkScanGuard, getClientIp } from '@/lib/scan-guard'
import type { ScanApiResponse, ScanErrorResponseCode } from '@/lib/scan-types'

export const runtime = 'nodejs'
export const maxDuration = 45

const MAX_BYTES = 1_500_000
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const STATUS_BY_CODE: Record<ScanErrorResponseCode, number> = {
  not_receipt: 422,
  unreadable: 422,
  upstream_error: 502,
  rate_limited: 429,
  quota_exceeded: 429,
  bot_check_failed: 403,
}

function errorResponse(code: ScanErrorResponseCode, retryAfter?: number) {
  const res = NextResponse.json({ ok: false, code, retryAfter }, { status: STATUS_BY_CODE[code] })
  if (retryAfter) res.headers.set('Retry-After', String(retryAfter))
  return res
}

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return errorResponse('unreadable')
  }

  const tokenEntry = form.get('turnstileToken')
  const turnstileToken = typeof tokenEntry === 'string' ? tokenEntry : undefined

  const guard = await checkScanGuard({ ip: getClientIp(req), turnstileToken })
  if (!guard.ok) return errorResponse(guard.code, guard.retryAfter)

  const image = form.get('image')
  if (!image || typeof image === 'string') return errorResponse('unreadable')
  if (!ALLOWED_TYPES.has(image.type)) return errorResponse('unreadable')
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, code: 'unreadable' }, { status: 413 })
  }

  const buffer = Buffer.from(await image.arrayBuffer())
  const dataUrl = `data:${image.type};base64,${buffer.toString('base64')}`

  const outcome = await scanReceipt(dataUrl)
  if (!outcome.ok) return errorResponse(outcome.code)

  return NextResponse.json({
    ok: true,
    receipt: outcome.receipt,
    warnings: buildScanWarnings(outcome.receipt),
  } satisfies ScanApiResponse)
}
