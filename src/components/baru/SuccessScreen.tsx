'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCopied } from '@/components/bill/parts'
import type { CreatedBill } from './types'

interface SuccessScreenProps {
  created: CreatedBill
  merchant: string
  onNew: () => void
}

export function SuccessScreen({ created, merchant, onNew }: SuccessScreenProps) {
  const [origin, setOrigin] = useState('')
  const [canShare, setCanShare] = useState(false)
  const [copied, copy] = useCopied()

  useEffect(() => {
    setOrigin(window.location.origin)
    setCanShare(typeof navigator.share === 'function')
  }, [])

  const isGuest = created.editToken !== null
  const managePath = isGuest ? `/b/${created.id}/kelola/${created.editToken}` : `/b/${created.id}/kelola`
  const shareUrl = `${origin}/b/${created.id}`
  const manageUrl = `${origin}${managePath}`
  const shareText = `Aku udah bagi tagihan ${merchant || 'kita'} pake SplitBillin. Cek bagianmu di sini: ${shareUrl}`

  const nativeShare = async () => {
    try {
      await navigator.share({ title: `Split bill ${merchant}`.trim(), text: shareText })
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center flex flex-col items-center gap-2 py-4">
        <div
          className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-3xl"
          aria-hidden
        >
          🎉
        </div>
        <h1 className="text-xl font-bold text-on-surface">Split bill siap dibagikan!</h1>
        <p className="text-sm text-on-surface-variant">Kirim link di bawah ke teman-temanmu.</p>
      </div>

      {/* Share link */}
      <section className="bg-secondary-container/40 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="text-xs font-bold text-on-secondary-container uppercase tracking-wide">Link untuk dibagikan</h2>
        <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg p-2">
          <span className="flex-1 min-w-0 px-1 text-xs font-mono text-on-surface break-all">{shareUrl}</span>
          <button
            type="button"
            onClick={() => copy('share', shareUrl)}
            aria-label="Salin link untuk dibagikan"
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-surface-container text-on-surface active:scale-95 transition-transform"
          >
            {copied === 'share' ? <CheckIcon className="w-4 h-4 text-primary" /> : <CopyIcon className="w-4 h-4" />}
          </button>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 flex items-center justify-center bg-primary text-on-primary rounded-xl text-sm font-semibold"
        >
          Kirim lewat WhatsApp
        </a>
        {canShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="h-11 bg-surface-container-lowest text-on-surface rounded-xl text-xs font-semibold"
          >
            Bagikan…
          </button>
        )}
      </section>

      {isGuest ? (
        <>
          {/* Manage link — guests only */}
          <section className="bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
              🔒 Link kelola — rahasia
            </h2>
            <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg p-2">
              <span className="flex-1 min-w-0 px-1 text-xs font-mono text-on-surface break-all">{manageUrl}</span>
              <button
                type="button"
                onClick={() => copy('manage', manageUrl)}
                aria-label="Salin link kelola"
                className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-surface-container text-on-surface active:scale-95 transition-transform"
              >
                {copied === 'manage' ? <CheckIcon className="w-4 h-4 text-primary" /> : <CopyIcon className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200">
              Hanya kamu yang boleh memegang ini. Dengan link ini kamu bisa mengubah dan menandai lunas. Jangan kirim
              ke grup.
            </p>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80">
              ✓ Sudah disimpan di perangkat ini, bisa dibuka lagi dari Beranda.
            </p>
          </section>

          <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex items-center justify-between gap-3">
            <p className="text-xs text-on-surface-variant">
              <strong className="text-on-surface block">Simpan di akunmu biar gak hilang</strong>
              Gak perlu simpan link rahasia lagi.
            </p>
            <Link
              href={`/masuk?next=${encodeURIComponent(managePath)}`}
              className="shrink-0 px-3 h-11 flex items-center bg-surface-container text-on-surface rounded-xl text-xs font-semibold"
            >
              Masuk
            </Link>
          </section>
        </>
      ) : (
        <p className="text-xs text-on-surface-variant text-center bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30">
          ✓ Tersimpan di akunmu. Buka kapan saja dari <strong className="text-on-surface">Riwayat</strong>.
        </p>
      )}

      <Link
        href={managePath}
        className="w-full py-3 text-center bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md"
      >
        Lihat halaman kelola
      </Link>
      <button
        type="button"
        onClick={onNew}
        className="w-full py-3 text-center bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
      >
        Buat split bill lagi
      </button>
    </div>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
