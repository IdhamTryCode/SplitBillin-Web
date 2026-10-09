'use client'

import React from 'react'
import Link from 'next/link'
import { HistoryList, HistoryRow, HistorySkeleton, useLocalHistory } from '@/components/HistoryList'

/** Riwayat for guests: the bills remembered in this browser, plus a soft sign-in nudge. */
export function GuestHistory() {
  const { entries, loading } = useLocalHistory()

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2">
        <p className="text-sm font-semibold text-on-surface">Riwayat ini hanya ada di perangkat ini</p>
        <p className="text-xs text-on-surface-variant">
          Kalau data browser dihapus, daftarnya ikut hilang. Masuk dengan Google biar tersimpan dan bisa dibuka di
          perangkat lain. Gak wajib kok.
        </p>
        <Link
          href="/masuk?next=/riwayat"
          className="self-start px-4 h-11 flex items-center bg-primary text-on-primary rounded-xl text-xs font-semibold"
        >
          Masuk dengan Google
        </Link>
      </div>

      {loading ? (
        <HistorySkeleton rows={3} />
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant p-8 text-center flex flex-col items-center gap-2">
          <span className="text-3xl" aria-hidden>
            🧾
          </span>
          <p className="text-sm font-semibold text-on-surface">Belum ada split bill</p>
          <Link href="/" className="text-xs text-primary font-semibold underline underline-offset-2 py-1">
            Buat yang pertama
          </Link>
        </div>
      ) : (
        <HistoryList entries={entries} />
      )}
    </div>
  )
}

/** Shown to signed-in users who still have guest bills in this browser. */
export function LocalClaimHint() {
  const { entries } = useLocalHistory()
  const guestBills = entries.filter((e) => e.href.split('/').length > 4)
  if (guestBills.length === 0) return null

  return (
    <section className="mb-5 flex flex-col gap-3">
      <div className="bg-amber-100/70 dark:bg-amber-950/40 rounded-2xl p-4 text-xs text-on-surface">
        <strong>Ada {guestBills.length} split bill tamu di perangkat ini.</strong> Buka, lalu pilih “Simpan ke akunku”
        supaya masuk ke riwayat akunmu.
      </div>
      {guestBills.map((e) => (
        <HistoryRow key={e.id} entry={e} />
      ))}
    </section>
  )
}
