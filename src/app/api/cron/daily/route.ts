import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { removeQris } from '@/lib/bills'
import { safeEqual } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BATCH = 500
const RATE_LIMIT_KEEP_MS = 2 * 24 * 60 * 60 * 1000

/**
 * Only `Authorization: Bearer <CRON_SECRET>` is accepted. Vercel Cron sends it
 * automatically when CRON_SECRET is set. The `x-vercel-cron` header is not
 * proof: anyone can send it.
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return safeEqual(req.headers.get('authorization') ?? '', `Bearer ${secret}`)
}

/**
 * GET /api/cron/daily — deletes expired bills with their QRIS images, and
 * rate-limit rows older than two days.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const now = new Date()
  const results = { bills_deleted: 0, qris_deleted: 0, rate_limits_deleted: 0, errors: [] as string[] }

  const { data: expired, error: listError } = await supabase
    .from('bills')
    .select('id, data')
    .lt('expires_at', now.toISOString())
    .limit(BATCH)

  if (listError) {
    results.errors.push(`list_expired: ${listError.message}`)
  } else if (expired && expired.length > 0) {
    const paths = expired
      .map((b) => (b.data as { payment?: { qris_path?: string | null } })?.payment?.qris_path)
      .filter((p): p is string => !!p)
    await removeQris(paths)
    results.qris_deleted = paths.length

    const { error: deleteError, count } = await supabase
      .from('bills')
      .delete({ count: 'exact' })
      .in(
        'id',
        expired.map((b) => b.id),
      )
    if (deleteError) results.errors.push(`delete_expired: ${deleteError.message}`)
    else results.bills_deleted = count ?? 0
  }

  const { error: rateError, count: rateCount } = await supabase
    .from('rate_limits')
    .delete({ count: 'exact' })
    .lt('window_start', new Date(now.getTime() - RATE_LIMIT_KEEP_MS).toISOString())
  if (rateError) results.errors.push(`rate_limits: ${rateError.message}`)
  else results.rate_limits_deleted = rateCount ?? 0

  console.log('[cron/daily]', results)
  const hasErrors = results.errors.length > 0
  return NextResponse.json({ ok: !hasErrors, ...results }, { status: hasErrors ? 207 : 200 })
}
