'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/supabase/server'
import { validateBill } from '@/lib/bill-validate'
import {
  QRIS_BUCKET,
  expiryFromNow,
  findBill,
  listBillsByIds,
  manageAccess,
  removeQris,
  toBillView,
  type BillListItem,
  type BillRow,
  type BillView,
} from '@/lib/bills'
import { clientIp, rateLimitDb } from '@/lib/rate-limit'
import { BillDataSchema, type BillData } from '@/lib/schemas'
import { generateShortId, generateToken, hashToken } from '@/lib/security'

const QRIS_MAX_BYTES = 1_000_000
const CREATE_PER_HOUR_IP = 30
const MANAGE_PER_MIN_IP = 100
const STATUS_PER_MIN_IP = 60
const MINUTE_SECONDS = 60

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

/**
 * Per-IP throttle shared by the manage actions. Deliberately loose: a creator
 * may mark a dozen members paid in a row without tripping it. The manage
 * actions share one counter (`manage:<ip>`); the status poller has its own
 * (`status:<ip>`).
 */
async function manageRateOk(prefix: string): Promise<boolean> {
  const ip = clientIp(await headers())
  const limit = prefix === 'status' ? STATUS_PER_MIN_IP : MANAGE_PER_MIN_IP
  return rateLimitDb(`${prefix}:${ip}`, limit, MINUTE_SECONDS)
}

const TOO_MANY = 'Terlalu banyak permintaan, coba lagi sebentar.'

/** Detect the real image type from its first bytes; the client's MIME is not trusted. */
function sniffImage(bytes: Uint8Array): { ext: string; type: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { ext: 'png', type: 'image/png' }
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { ext: 'webp', type: 'image/webp' }
  return null
}

/**
 * Shape + cross-field validation. Fields the server owns (paid status, QRIS
 * path, edit marker) are reset so a client cannot set them.
 */
function parseBill(input: unknown): { bill: BillData } | { error: string } {
  const parsed = BillDataSchema.safeParse(input)
  if (!parsed.success) return { error: 'Data bill tidak valid: ' + (parsed.error.issues[0]?.message ?? '') }

  const bill: BillData = {
    ...parsed.data,
    merchant: parsed.data.merchant.trim(),
    members: parsed.data.members.map((m) => ({ ...m, name: m.name.trim(), paid_at: null })),
    payment: {
      ...parsed.data.payment,
      methods: parsed.data.payment.methods
        .map((m) => ({ ...m, provider: m.provider.trim(), number: m.number.trim(), holder: m.holder.trim() }))
        .filter((m) => m.provider || m.number),
      note: parsed.data.payment.note.trim(),
      qris_path: null,
    },
    updated_at: null,
  }
  if (!bill.merchant) return { error: 'Nama tempat wajib diisi' }
  if (bill.members.some((m) => !m.name)) return { error: 'Nama anggota tidak boleh kosong' }

  const problem = validateBill(bill)
  if (problem) return { error: problem }
  return { bill }
}

async function uploadQris(billId: string, form: FormData | undefined): Promise<ActionResult<{ path: string | null }>> {
  const file = form?.get('qris')
  if (!file || typeof file === 'string' || file.size === 0) return { ok: true, path: null }
  if (file.size > QRIS_MAX_BYTES) return { ok: false, error: 'Gambar QRIS terlalu besar' }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniffImage(bytes)
  if (!kind) return { ok: false, error: 'Gambar QRIS harus JPEG, PNG, atau WebP' }

  // Random suffix: replacing the image yields a new object, so old signed URLs die.
  const path = `${billId}-${generateShortId(6)}.${kind.ext}`
  const { error } = await createAdminClient()
    .storage.from(QRIS_BUCKET)
    .upload(path, bytes, { contentType: kind.type, upsert: false })
  if (error) {
    console.error('[uploadQris]', error.message)
    return { ok: false, error: 'Gagal mengunggah gambar QRIS' }
  }
  return { ok: true, path }
}

/**
 * Create a bill. Guests get a secret manage token; signed-in users own the
 * bill through their account and get no token.
 */
export async function createBillAction(
  data: BillData,
  qris?: FormData,
): Promise<ActionResult<{ id: string; editToken: string | null }>> {
  const parsed = parseBill(data)
  if ('error' in parsed) return { ok: false, error: parsed.error }

  const ip = clientIp(await headers())
  if (!(await rateLimitDb(`bill:create:${ip}`, CREATE_PER_HOUR_IP, 3600))) {
    return { ok: false, error: 'Terlalu banyak split bill dibuat. Coba lagi nanti.' }
  }

  try {
    const user = await getUser()
    const id = generateShortId(10)
    const editToken = user ? null : generateToken()

    const upload = await uploadQris(id, qris)
    if (!upload.ok) return upload

    const bill: BillData = { ...parsed.bill, payment: { ...parsed.bill.payment, qris_path: upload.path } }
    const { error } = await createAdminClient().from('bills').insert({
      id,
      owner_id: user?.id ?? null,
      edit_token_hash: editToken ? hashToken(editToken) : null,
      data: bill,
      expires_at: expiryFromNow(),
    })
    if (error) {
      console.error('[createBillAction]', error.message)
      await removeQris([upload.path])
      return { ok: false, error: 'Gagal menyimpan split bill' }
    }
    return { ok: true, id, editToken }
  } catch (err) {
    console.error('[createBillAction]', err instanceof Error ? err.message : err)
    return { ok: false, error: 'Terjadi kesalahan pada server' }
  }
}

/** Load a bill for managing and check the caller may manage it. */
async function authorize(
  id: string,
  token: string | null,
): Promise<{ row: BillRow; access: 'token' | 'owner'; userId: string | null } | { error: string }> {
  const found = await findBill(id)
  if (found.status !== 'ok') return { error: 'Split bill tidak ditemukan atau sudah kedaluwarsa' }
  const user = await getUser()
  const access = manageAccess(found.row, token, user?.id)
  if (!access) return { error: 'Kamu tidak punya akses ke split bill ini' }
  return { row: found.row, access, userId: user?.id ?? null }
}

/** Mark a member paid or unpaid. Returns the new timestamp (null = unpaid). */
export async function togglePaidStatusAction(
  id: string,
  token: string | null,
  memberId: string,
): Promise<ActionResult<{ paidAt: string | null }>> {
  if (!(await manageRateOk('manage'))) return { ok: false, error: TOO_MANY }
  const auth = await authorize(id, token)
  if ('error' in auth) return { ok: false, error: auth.error }

  const member = auth.row.data.members.find((m) => m.id === memberId)
  if (!member) return { ok: false, error: 'Anggota tidak ditemukan' }
  if (member.is_payer) return { ok: false, error: 'Yang nalangin otomatis lunas' }

  const paidAt = member.paid_at ? null : new Date().toISOString()
  const data: BillData = {
    ...auth.row.data,
    members: auth.row.data.members.map((m) => (m.id === memberId ? { ...m, paid_at: paidAt } : m)),
  }
  const { error } = await createAdminClient().from('bills').update({ data }).eq('id', id)
  if (error) return { ok: false, error: 'Gagal memperbarui status lunas' }
  return { ok: true, paidAt }
}

/**
 * Replace a bill's contents after an edit. Paid marks survive for members who
 * are still on the bill. `qris` uploads a new image; `keepQris` keeps the old.
 */
export async function updateBillAction(
  id: string,
  token: string | null,
  data: BillData,
  keepQris: boolean,
  qris?: FormData,
): Promise<ActionResult> {
  if (!(await manageRateOk('manage'))) return { ok: false, error: TOO_MANY }
  const parsed = parseBill(data)
  if ('error' in parsed) return { ok: false, error: parsed.error }
  const auth = await authorize(id, token)
  if ('error' in auth) return { ok: false, error: auth.error }

  const upload = await uploadQris(id, qris)
  if (!upload.ok) return upload

  const previous = auth.row.data
  const paidById = new Map(previous.members.map((m) => [m.id, m.paid_at]))
  const oldPath = previous.payment.qris_path
  const qrisPath = upload.path ?? (keepQris ? oldPath : null)

  const bill: BillData = {
    ...parsed.bill,
    members: parsed.bill.members.map((m) => ({
      ...m,
      paid_at: m.is_payer ? null : (paidById.get(m.id) ?? null),
    })),
    payment: { ...parsed.bill.payment, qris_path: qrisPath },
    updated_at: new Date().toISOString(),
  }

  const { error } = await createAdminClient().from('bills').update({ data: bill }).eq('id', id)
  if (error) {
    await removeQris([upload.path])
    return { ok: false, error: 'Gagal menyimpan perubahan' }
  }
  if (oldPath && oldPath !== qrisPath) await removeQris([oldPath])
  return { ok: true }
}

export async function extendBillAction(
  id: string,
  token: string | null,
): Promise<ActionResult<{ expiresAt: string }>> {
  if (!(await manageRateOk('manage'))) return { ok: false, error: TOO_MANY }
  const auth = await authorize(id, token)
  if ('error' in auth) return { ok: false, error: auth.error }
  const expiresAt = expiryFromNow()
  const { error } = await createAdminClient().from('bills').update({ expires_at: expiresAt }).eq('id', id)
  if (error) return { ok: false, error: 'Gagal memperpanjang masa berlaku' }
  return { ok: true, expiresAt }
}

export async function deleteBillAction(id: string, token: string | null): Promise<ActionResult> {
  if (!(await manageRateOk('manage'))) return { ok: false, error: TOO_MANY }
  const auth = await authorize(id, token)
  if ('error' in auth) return { ok: false, error: auth.error }
  const { error } = await createAdminClient().from('bills').delete().eq('id', id)
  if (error) return { ok: false, error: 'Gagal menghapus split bill' }
  await removeQris([auth.row.data.payment.qris_path])
  return { ok: true }
}

/**
 * Move a guest bill into the signed-in account. Needs the secret manage token.
 * The token is retired afterwards: the account is now the only key.
 */
export async function claimBillAction(id: string, token: string): Promise<ActionResult> {
  if (!(await manageRateOk('manage'))) return { ok: false, error: TOO_MANY }
  const user = await getUser()
  if (!user) return { ok: false, error: 'Masuk dulu untuk menyimpan split bill ke akunmu' }

  const found = await findBill(id)
  if (found.status !== 'ok') return { ok: false, error: 'Split bill tidak ditemukan atau sudah kedaluwarsa' }
  if (found.row.owner_id === user.id) return { ok: true }
  if (found.row.owner_id) return { ok: false, error: 'Split bill ini sudah ada di akun lain' }
  if (manageAccess(found.row, token, null) !== 'token') {
    return { ok: false, error: 'Link kelola tidak valid' }
  }

  const { error } = await createAdminClient()
    .from('bills')
    .update({ owner_id: user.id, edit_token_hash: null })
    .eq('id', id)
    .is('owner_id', null)
  if (error) return { ok: false, error: 'Gagal menyimpan ke akun' }
  return { ok: true }
}

/** Full bill for the edit wizard. Same authorization as every manage action. */
export async function getEditableBillAction(
  id: string,
  token: string | null,
): Promise<ActionResult<{ bill: BillView }>> {
  if (!(await manageRateOk('manage'))) return { ok: false, error: TOO_MANY }
  const auth = await authorize(id, token)
  if ('error' in auth) return { ok: false, error: auth.error }
  return { ok: true, bill: await toBillView(auth.row) }
}

/** Live status for the bills remembered in this browser (public data only). */
export async function getBillStatusesAction(ids: string[]): Promise<BillListItem[]> {
  if (!(await manageRateOk('status'))) return []
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) return []
  return listBillsByIds(ids)
}
