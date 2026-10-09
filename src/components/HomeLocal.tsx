'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { HistoryRow, HistorySkeleton, useLocalHistory } from '@/components/HistoryList'
import { clearDraft, getDraft } from '@/lib/local-store'
import { useUser } from '@/lib/use-user'

interface DraftPeek {
  merchant?: string
  branch?: string
}

/** Unfinished wizard run kept in this browser. */
export function DraftChip() {
  const [draft, setDraft] = useState<DraftPeek | null>(null)

  useEffect(() => setDraft(getDraft<DraftPeek>()), [])

  if (!draft) return null
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-lg" aria-hidden>
        📝
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-bold text-on-surface block truncate">
          Draf: {draft.merchant?.trim() || 'Tanpa nama'}
        </span>
        <span className="text-[11px] text-on-surface-variant">Belum selesai, tersimpan di perangkat ini.</span>
      </div>
      <button
        type="button"
        onClick={() => {
          clearDraft()
          setDraft(null)
        }}
        className="px-2 h-11 text-xs text-on-surface-variant font-semibold"
      >
        Buang
      </button>
      <Link
        href="/baru?draft=1"
        className="px-3 h-11 flex items-center bg-primary text-on-primary rounded-xl text-xs font-semibold"
      >
        Lanjutkan
      </Link>
    </div>
  )
}

/** Beranda: recent bills from this browser (guest) or a pointer to Riwayat (account). */
export function HomeHistory() {
  const { user, ready } = useUser()
  const { entries, loading } = useLocalHistory()

  if (ready && user) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-on-surface">Riwayat</h2>
        <Link
          href="/riwayat"
          className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 text-sm font-semibold text-primary"
        >
          Lihat semua split bill di akunmu →
        </Link>
        {entries.length > 0 && (
          <p className="text-[11px] text-on-surface-variant">
            Ada {entries.length} split bill tamu di perangkat ini. Buka dari{' '}
            <Link href="/riwayat" className="underline">
              Riwayat
            </Link>{' '}
            untuk memasukkannya ke akunmu.
          </p>
        )}
      </section>
    )
  }

  if (loading) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-on-surface">Split bill di perangkat ini</h2>
        <HistorySkeleton rows={2} />
      </section>
    )
  }

  if (entries.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-outline-variant p-6 text-center flex flex-col items-center gap-2">
        <span className="text-3xl" aria-hidden>
          🧾
        </span>
        <p className="text-sm font-semibold text-on-surface">Belum ada split bill</p>
        <p className="text-xs text-on-surface-variant">
          Split bill yang kamu buat dari perangkat ini akan muncul di sini.
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-on-surface">Split bill di perangkat ini</h2>
        {entries.length > 4 && (
          <Link href="/riwayat" className="text-xs text-primary font-semibold py-1">
            Lihat semua
          </Link>
        )}
      </div>
      {entries.slice(0, 4).map((e) => (
        <HistoryRow key={e.id} entry={e} />
      ))}
      <p className="text-[11px] text-on-surface-variant">
        Hanya ada di perangkat ini.{' '}
        <Link href="/masuk" className="text-primary font-semibold underline underline-offset-2">
          Masuk
        </Link>{' '}
        biar riwayatmu gak hilang dan bisa dibuka di perangkat lain.
      </p>
    </section>
  )
}
