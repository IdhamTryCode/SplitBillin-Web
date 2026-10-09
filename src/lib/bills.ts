/**
 * Server-side bill access. Every read and write of `bills` and the private
 * `qris` bucket goes through here with the service-role client.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { summarizeBill } from '@/lib/breakdown'
import { BillDataSchema, type BillData } from '@/lib/schemas'
import { hashToken, safeEqual } from '@/lib/security'

export const BILL_TTL_DAYS = 90
export const QRIS_BUCKET = 'qris'
const QRIS_URL_TTL_SECONDS = 3600
const ID_PATTERN = /^[a-z0-9]{6,16}$/

export interface BillRow {
  id: string
  owner_id: string | null
  edit_token_hash: string | null
  data: BillData
  created_at: string
  expires_at: string
}

/** What a page receives. Never includes the token hash or the owner id. */
export interface BillView {
  id: string
  created_at: string
  expires_at: string
  data: BillData
  /** Short-lived signed URL for the QRIS image, if one was uploaded. */
  qrisUrl: string | null
}

export type BillLookup =
  | { status: 'ok'; row: BillRow }
  | { status: 'not_found' | 'expired' | 'error' }

export function expiryFromNow(): string {
  return new Date(Date.now() + BILL_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

export async function findBill(id: string): Promise<BillLookup> {
  if (!ID_PATTERN.test(id)) return { status: 'not_found' }
  try {
    const { data, error } = await createAdminClient()
      .from('bills')
      .select('id, owner_id, edit_token_hash, data, created_at, expires_at')
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('[findBill]', error.message)
      return { status: 'error' }
    }
    if (!data) return { status: 'not_found' }
    if (new Date(data.expires_at).getTime() < Date.now()) return { status: 'expired' }

    const parsed = BillDataSchema.safeParse(data.data)
    if (!parsed.success) {
      console.error('[findBill] stored bill failed validation', id)
      return { status: 'error' }
    }
    return { status: 'ok', row: { ...data, data: parsed.data } }
  } catch (err) {
    console.error('[findBill]', err instanceof Error ? err.message : err)
    return { status: 'error' }
  }
}

/** How the caller may manage this bill: secret link, account ownership, or not at all. */
export function manageAccess(
  row: BillRow,
  token: string | null | undefined,
  userId: string | null | undefined,
): 'token' | 'owner' | null {
  if (userId && row.owner_id && row.owner_id === userId) return 'owner'
  if (token && row.edit_token_hash && safeEqual(hashToken(token), row.edit_token_hash)) return 'token'
  return null
}

export async function signQrisUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  try {
    const { data, error } = await createAdminClient()
      .storage.from(QRIS_BUCKET)
      .createSignedUrl(path, QRIS_URL_TTL_SECONDS)
    if (error) return null
    return data.signedUrl
  } catch {
    return null
  }
}

export async function toBillView(row: BillRow): Promise<BillView> {
  return {
    id: row.id,
    created_at: row.created_at,
    expires_at: row.expires_at,
    data: row.data,
    qrisUrl: await signQrisUrl(row.data.payment.qris_path),
  }
}

export async function removeQris(paths: Array<string | null | undefined>): Promise<void> {
  const list = paths.filter((p): p is string => !!p)
  if (list.length === 0) return
  const { error } = await createAdminClient().storage.from(QRIS_BUCKET).remove(list)
  if (error) console.error('[removeQris]', error.message)
}

/** One row of a history list (Riwayat, or the local list on Beranda). */
export interface BillListItem {
  id: string
  merchant: string
  date: string | null
  created_at: string
  total: number
  unpaid: number
  settledCount: number
  memberCount: number
}

export function toListItem(row: Pick<BillRow, 'id' | 'data' | 'created_at'>): BillListItem | null {
  const parsed = BillDataSchema.safeParse(row.data)
  if (!parsed.success) return null
  const summary = summarizeBill(parsed.data)
  return {
    id: row.id,
    merchant: parsed.data.merchant,
    date: parsed.data.date,
    created_at: row.created_at,
    total: parsed.data.total,
    unpaid: summary.unpaid,
    settledCount: summary.settledCount,
    memberCount: parsed.data.members.length,
  }
}

export async function listBillsByOwner(userId: string): Promise<BillListItem[]> {
  const { data, error } = await createAdminClient()
    .from('bills')
    .select('id, data, created_at')
    .eq('owner_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) {
    console.error('[listBillsByOwner]', error.message)
    return []
  }
  return (data ?? []).map((r) => toListItem(r as BillRow)).filter((r): r is BillListItem => r !== null)
}

export async function listBillsByIds(ids: string[]): Promise<BillListItem[]> {
  const clean = [...new Set(ids)].filter((id) => ID_PATTERN.test(id)).slice(0, 30)
  if (clean.length === 0) return []
  const { data, error } = await createAdminClient()
    .from('bills')
    .select('id, data, created_at')
    .in('id', clean)
    .gt('expires_at', new Date().toISOString())
  if (error) {
    console.error('[listBillsByIds]', error.message)
    return []
  }
  return (data ?? []).map((r) => toListItem(r as BillRow)).filter((r): r is BillListItem => r !== null)
}
