import { NextResponse } from 'next/server'
import { scanReceipt } from '@/lib/llm/scan-receipt'
import { buildScanWarnings } from '@/lib/receipt'
import { checkScanGuard, getClientIp } from '@/lib/scan-guard'
import { getUser } from '@/lib/supabase/server'
import type { ScanApiResponse, ScanErrorResponseCode } from '@/lib/scan-types'

export const runtime = 'nodejs'
export const maxDuration = 30

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

function errorResponse(code: ScanErrorResponseCode, retryAfter?: number, status?: number) {
  const res = NextResponse.json({ ok: false, code, retryAfter }, { status: status ?? STATUS_BY_CODE[code] })
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

  const image = form.get('image')
  if (!image || typeof image === 'string') return errorResponse('unreadable')
  if (!ALLOWED_TYPES.has(image.type)) return errorResponse('unreadable')
  if (image.size > MAX_BYTES) return errorResponse('unreadable', undefined, 413)

  // Every guard runs before the LLM is called.
  const tokenEntry = form.get('turnstileToken')
  const turnstileToken = typeof tokenEntry === 'string' && tokenEntry ? tokenEntry : undefined
  const user = await getUser()

  const guard = await checkScanGuard({ ip: getClientIp(req), turnstileToken, userId: user?.id })
  if (!guard.ok) return errorResponse(guard.code, guard.retryAfter, guard.status)

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
