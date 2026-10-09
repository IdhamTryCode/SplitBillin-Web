'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { BottomSheet } from '@/components/baru/BottomSheet'
import {
  addFriendsAction,
  deleteAccountAction,
  removeFriendAction,
  type Friend,
} from '@/lib/actions/account-actions'
import { clearLocalData } from '@/lib/local-store'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface AccountViewProps {
  profile: { name: string | null; email: string | null; billCount: number } | null
  initialFriends: Friend[]
  guestQuota: number
  userQuota: number
}

const THEMES = [
  { key: 'light', label: 'Terang' },
  { key: 'dark', label: 'Gelap' },
  { key: 'system', label: 'Ikuti perangkat' },
]

const CARD = 'bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3'

export function AccountView({ profile, initialFriends, guestQuota, userQuota }: AccountViewProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [friends, setFriends] = useState(initialFriends)
  const [newFriend, setNewFriend] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'account' | 'local' | null>(null)

  useEffect(() => setMounted(true), [])

  const addFriend = async () => {
    const name = newFriend.trim()
    if (!name) return
    setBusy('friend')
    setError(null)
    const res = await addFriendsAction([name])
    setBusy(null)
    if (!res.ok) return setError(res.error)
    setFriends(res.friends)
    setNewFriend('')
  }

  const removeFriend = async (id: string) => {
    setBusy(id)
    setError(null)
    const res = await removeFriendAction(id)
    setBusy(null)
    if (!res.ok) return setError(res.error)
    setFriends((prev) => prev.filter((f) => f.id !== id))
  }

  const signOut = async () => {
    setBusy('signout')
    await createClient().auth.signOut()
    router.replace('/')
    router.refresh()
  }

  const deleteAccount = async () => {
    setBusy('delete')
    setError(null)
    const res = await deleteAccountAction()
    if (!res.ok) {
      setBusy(null)
      setConfirm(null)
      return setError(res.error)
    }
    await createClient().auth.signOut({ scope: 'local' })
    router.replace('/')
    router.refresh()
  }

  const wipeLocal = () => {
    clearLocalData()
    setConfirm(null)
    setNotice('Data di perangkat ini sudah dihapus.')
  }

  return (
    <div className="flex flex-col gap-4">
      {profile ? (
        <section className={CARD}>
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center text-lg font-bold shrink-0">
              {(profile.name ?? profile.email ?? '?')[0]?.toUpperCase()}
            </span>
            <div className="min-w-0">
              <span className="text-sm font-bold text-on-surface block truncate">{profile.name ?? 'Akun Google'}</span>
              <span className="text-xs text-on-surface-variant block truncate">{profile.email}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Link href="/riwayat" className="bg-surface-container-low rounded-xl p-3">
              <span className="font-mono text-lg font-bold text-on-surface block">{profile.billCount}</span>
              <span className="text-[11px] text-on-surface-variant">split bill aktif</span>
            </Link>
            <div className="bg-surface-container-low rounded-xl p-3">
              <span className="font-mono text-lg font-bold text-on-surface block">{userQuota}</span>
              <span className="text-[11px] text-on-surface-variant">scan struk per hari</span>
            </div>
          </div>
        </section>
      ) : (
        <section className={CARD}>
          <h2 className="text-sm font-bold text-on-surface">Kamu memakai mode tamu</h2>
          <p className="text-xs text-on-surface-variant">
            Semua fitur tetap bisa dipakai. Dengan akun, riwayatmu tersimpan lintas perangkat dan kuota scan naik dari{' '}
            {guestQuota} jadi {userQuota} per hari.
          </p>
          <Link
            href="/masuk?next=/akun"
            className="self-start px-4 h-11 flex items-center bg-primary text-on-primary rounded-xl text-xs font-semibold"
          >
            Masuk dengan Google
          </Link>
        </section>
      )}

      {error && (
        <div role="alert" className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="bg-secondary-container/50 text-on-secondary-container p-3 rounded-xl text-xs">
          {notice}
        </div>
      )}

      <section className={CARD}>
        <h2 className="text-sm font-bold text-on-surface">Tampilan</h2>
        <div className="flex rounded-xl bg-surface-container-low p-1 gap-1" role="radiogroup" aria-label="Tema">
          {THEMES.map((t) => {
            const active = mounted && theme === t.key
            return (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(t.key)}
                className={cn(
                  'flex-1 h-10 rounded-lg text-xs font-semibold',
                  active ? 'bg-surface-container-lowest shadow text-primary' : 'text-on-surface-variant',
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </section>

      {profile && (
        <section className={CARD}>
          <div>
            <h2 className="text-sm font-bold text-on-surface">Teman tersimpan</h2>
            <p className="text-xs text-on-surface-variant">
              Muncul sebagai saran saat menambah anggota. Hanya nama yang disimpan.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFriend}
              maxLength={60}
              onChange={(e) => setNewFriend(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void addFriend()}
              placeholder="Nama teman"
              aria-label="Nama teman"
              className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm text-on-surface"
            />
            <button
              type="button"
              onClick={addFriend}
              disabled={busy !== null || !newFriend.trim()}
              className="px-4 h-11 bg-primary text-on-primary rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              Tambah
            </button>
          </div>
          {friends.length === 0 ? (
            <p className="text-xs text-on-surface-variant">Belum ada teman tersimpan.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {friends.map((f) => (
                <li
                  key={f.id}
                  className="inline-flex items-center gap-1 pl-3 pr-1 h-11 rounded-full bg-surface-container text-xs font-semibold text-on-surface"
                >
                  {f.name}
                  <button
                    type="button"
                    onClick={() => removeFriend(f.id)}
                    disabled={busy !== null}
                    aria-label={`Hapus ${f.name}`}
                    className="w-11 h-11 rounded-full text-on-surface-variant"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className={CARD}>
        <h2 className="text-sm font-bold text-on-surface">Informasi</h2>
        <nav className="flex flex-col text-sm">
          {[
            { href: '/tentang', label: 'Tentang & cara kerja' },
            { href: '/privasi', label: 'Kebijakan privasi' },
            { href: '/ketentuan', label: 'Ketentuan penggunaan' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="h-11 flex items-center justify-between text-on-surface border-b border-outline-variant/30 last:border-b-0"
            >
              {l.label}
              <span aria-hidden className="text-on-surface-variant">
                ›
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <section className={CARD}>
        <h2 className="text-sm font-bold text-on-surface">Data</h2>
        <button
          type="button"
          onClick={() => setConfirm('local')}
          className="h-11 text-left text-sm text-on-surface"
        >
          Hapus riwayat & draf di perangkat ini
        </button>
        {profile && (
          <>
            <button
              type="button"
              onClick={signOut}
              disabled={busy !== null}
              className="h-11 rounded-xl bg-surface-container text-on-surface text-sm font-semibold disabled:opacity-60"
            >
              {busy === 'signout' ? 'Keluar…' : 'Keluar'}
            </button>
            <button
              type="button"
              onClick={() => setConfirm('account')}
              className="h-11 text-sm text-error font-semibold"
            >
              Hapus akun beserta semua datanya
            </button>
          </>
        )}
      </section>

      <BottomSheet
        open={confirm === 'account'}
        title="Hapus akun beserta semua datanya?"
        onClose={() => setConfirm(null)}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-on-surface">
            Akunmu, <strong>{profile?.billCount ?? 0} split bill</strong> di dalamnya, gambar QRIS yang kamu unggah, dan
            daftar teman tersimpan akan dihapus permanen. Link yang sudah dibagikan ke teman tidak bisa dibuka lagi.
            Ini tidak bisa dibatalkan.
          </p>
          <button
            type="button"
            onClick={deleteAccount}
            disabled={busy !== null}
            className="w-full py-3 bg-error text-on-error font-semibold rounded-xl text-sm disabled:opacity-60"
          >
            {busy === 'delete' ? 'Menghapus…' : 'Ya, hapus akun dan semua data'}
          </button>
          <button
            type="button"
            onClick={() => setConfirm(null)}
            className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
          >
            Batal
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={confirm === 'local'} title="Hapus data di perangkat ini?" onClose={() => setConfirm(null)}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-on-surface">
            Riwayat, draf, dan saran nama di browser ini akan dihapus. Split bill tamu yang link kelolanya belum kamu
            simpan di tempat lain <strong>tidak bisa dikelola lagi</strong>. Split bill-nya sendiri tetap ada sampai
            kedaluwarsa.
          </p>
          <button
            type="button"
            onClick={wipeLocal}
            className="w-full py-3 bg-error text-on-error font-semibold rounded-xl text-sm"
          >
            Ya, hapus
          </button>
          <button
            type="button"
            onClick={() => setConfirm(null)}
            className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
          >
            Batal
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
