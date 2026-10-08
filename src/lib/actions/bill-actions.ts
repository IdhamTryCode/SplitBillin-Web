'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { BillDataSchema, type BillData } from '@/lib/schemas'
import { generateShortId, generateToken, hashToken, safeEqual } from '@/lib/security'

export interface CreateBillResponse {
  ok: boolean
  id?: string
  editToken?: string
  error?: string
}

/**
 * Server action: Create a new bill (manual or receipt).
 */
export async function createBillAction(data: BillData): Promise<CreateBillResponse> {
  const parsed = BillDataSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: 'Data bill tidak valid: ' + parsed.error.issues[0]?.message }
  }

  const bill = parsed.data
  const id = generateShortId(8)
  const editToken = generateToken()
  const editTokenHash = hashToken(editToken)

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('bills').insert({
      id,
      edit_token_hash: editTokenHash,
      data: bill,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (error) {
      console.error('[createBillAction] Supabase error:', error)
      return { ok: false, error: 'Gagal menyimpan bill ke database' }
    }

    return { ok: true, id, editToken }
  } catch (err) {
    console.error('[createBillAction] Server error:', err)
    return { ok: false, error: 'Terjadi kesalahan pada server' }
  }
}

export interface GetBillResponse {
  ok: boolean
  bill?: {
    id: string
    created_at: string
    expires_at: string
    data: BillData
  }
  error?: string
}

/**
 * Server action: Get public bill details for members.
 */
export async function getBillAction(id: string): Promise<GetBillResponse> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('bills')
      .select('id, created_at, expires_at, data')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { ok: false, error: 'Split bill tidak ditemukan atau sudah kedaluwarsa' }
    }

    // Check expiration
    if (new Date(data.expires_at).getTime() < Date.now()) {
      return { ok: false, error: 'Split bill ini sudah kedaluwarsa (lebih dari 90 hari)' }
    }

    return {
      ok: true,
      bill: {
        id: data.id,
        created_at: data.created_at,
        expires_at: data.expires_at,
        data: data.data as BillData,
      },
    }
  } catch (err) {
    console.error('[getBillAction] Error:', err)
    return { ok: false, error: 'Gagal mengambil data bill' }
  }
}

/**
 * Server action: Get management bill details for creator (validates edit token).
 */
export async function getManageBillAction(id: string, token: string): Promise<GetBillResponse> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('bills')
      .select('id, edit_token_hash, created_at, expires_at, data')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { ok: false, error: 'Split bill tidak ditemukan' }
    }

    if (!data.edit_token_hash || !safeEqual(hashToken(token), data.edit_token_hash)) {
      return { ok: false, error: 'Token kelola tidak valid atau tidak cocok' }
    }

    return {
      ok: true,
      bill: {
        id: data.id,
        created_at: data.created_at,
        expires_at: data.expires_at,
        data: data.data as BillData,
      },
    }
  } catch (err) {
    console.error('[getManageBillAction] Error:', err)
    return { ok: false, error: 'Gagal mengautentikasi halaman kelola' }
  }
}

/**
 * Server action: Toggle paid status of a member.
 */
export async function togglePaidStatusAction(
  id: string,
  token: string,
  memberId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('bills')
      .select('id, edit_token_hash, data')
      .eq('id', id)
      .single()

    if (error || !data) return { ok: false, error: 'Bill tidak ditemukan' }
    if (!data.edit_token_hash || !safeEqual(hashToken(token), data.edit_token_hash)) {
      return { ok: false, error: 'Token tidak valid' }
    }

    const billData = data.data as BillData
    const memberIndex = billData.members.findIndex((m) => m.id === memberId)
    if (memberIndex === -1) return { ok: false, error: 'Anggota tidak ditemukan' }

    // Toggle paid_at
    const currentPaid = billData.members[memberIndex].paid_at
    billData.members[memberIndex].paid_at = currentPaid ? null : new Date().toISOString()

    const { error: updateErr } = await supabase
      .from('bills')
      .update({ data: billData })
      .eq('id', id)

    if (updateErr) return { ok: false, error: 'Gagal memperbarui status lunas' }

    return { ok: true }
  } catch (err) {
    console.error('[togglePaidStatusAction] Error:', err)
    return { ok: false, error: 'Gagal memperbarui status' }
  }
}
