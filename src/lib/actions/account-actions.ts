'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient, getUser } from '@/lib/supabase/server'
import { removeQris } from '@/lib/bills'

const MAX_FRIENDS = 100

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

export interface Friend {
  id: string
  name: string
}

/** Saved friend names of the signed-in user (names only, by design). */
export async function listFriendsAction(): Promise<Friend[]> {
  const user = await getUser()
  if (!user) return []
  const { data, error } = await createAdminClient()
    .from('friends')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')
  if (error) {
    console.error('[listFriendsAction]', error.message)
    return []
  }
  return data ?? []
}

/** Save names as friends. Existing names are skipped, so this is safe to repeat. */
export async function addFriendsAction(names: string[]): Promise<ActionResult<{ friends: Friend[] }>> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Masuk dulu untuk menyimpan teman' }
  if (!Array.isArray(names)) return { ok: false, error: 'Nama tidak valid' }

  const clean = [
    ...new Set(
      names
        .filter((n): n is string => typeof n === 'string')
        .map((n) => n.trim().slice(0, 60))
        .filter(Boolean),
    ),
  ]
  if (clean.length === 0) return { ok: false, error: 'Nama tidak boleh kosong' }

  const admin = createAdminClient()
  const { count } = await admin.from('friends').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  if ((count ?? 0) + clean.length > MAX_FRIENDS) {
    return { ok: false, error: `Maksimal ${MAX_FRIENDS} teman tersimpan` }
  }

  const { error } = await admin
    .from('friends')
    .upsert(
      clean.map((name) => ({ user_id: user.id, name })),
      { onConflict: 'user_id,name', ignoreDuplicates: true },
    )
  if (error) {
    console.error('[addFriendsAction]', error.message)
    return { ok: false, error: 'Gagal menyimpan teman' }
  }
  return { ok: true, friends: await listFriendsAction() }
}

export async function removeFriendAction(id: string): Promise<ActionResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Masuk dulu' }
  const { error } = await createAdminClient().from('friends').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { ok: false, error: 'Gagal menghapus teman' }
  return { ok: true }
}

/**
 * Delete the account and everything it owns. Bills and friends go with the
 * user row (ON DELETE CASCADE); QRIS images are removed from storage first.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Masuk dulu' }

  const admin = createAdminClient()
  const { data: bills, error: listError } = await admin.from('bills').select('data').eq('owner_id', user.id)
  if (listError) return { ok: false, error: 'Gagal menghapus akun. Coba lagi.' }

  await removeQris(
    (bills ?? []).map((b) => (b.data as { payment?: { qris_path?: string | null } })?.payment?.qris_path),
  )

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[deleteAccountAction]', error.message)
    return { ok: false, error: 'Gagal menghapus akun. Coba lagi.' }
  }

  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  return { ok: true }
}
