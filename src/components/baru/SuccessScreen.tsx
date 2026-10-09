'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CreatedBill } from './types'

interface SuccessScreenProps {
  created: CreatedBill
  merchant: string
  onNew: () => void
}

export function SuccessScreen({ created, merchant, onNew }: SuccessScreenProps) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState<'share' | 'manage' | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const shareUrl = `${origin}/b/${created.id}`
  const manageUrl = `${origin}/b/${created.id}/kelola/${created.editToken}`

  const copy = (which: 'share' | 'manage', text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  const whatsapp = () => {
    const text = encodeURIComponent(
      `Aku udah bagi tagihan ${merchant || 'kita'} pake SplitBillin. Cek bagianmu di sini: ${shareUrl}`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Split bill ${merchant || ''}`, url: shareUrl })
      } catch {
        /* user cancelled */
      }
    } else {
      copy('share', shareUrl)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center flex flex-col items-center gap-2 py-4">
        <div className="w-16 h-16 rounded-full bg-secondary-container text-primary flex items-center justify-center text-3xl">
          🎉
        </div>
        <h1 className="text-xl font-bold text-on-surface">Split bill siap dibagikan!</h1>
        <p className="text-sm text-on-surface-variant">Kirim link di bawah ke teman-temanmu.</p>
      </div>

      {/* Share link */}
      <div className="bg-secondary-container/30 rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-xs font-bold text-on-secondary-container uppercase tracking-wide">
          Link untuk dibagikan
        </span>
        <p className="text-[11px] font-mono text-on-surface break-all bg-surface-container-lowest rounded-lg p-2">
          {shareUrl}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => copy('share', shareUrl)}
            className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-semibold"
          >
            {copied === 'share' ? 'Tersalin ✓' : 'Salin Link'}
          </button>
          <button
            type="button"
            onClick={whatsapp}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={nativeShare}
            className="flex-1 py-2.5 bg-surface-container-lowest text-on-surface rounded-xl text-xs font-semibold"
          >
            Bagikan
          </button>
        </div>
      </div>

      {/* Manage link */}
      <div className="bg-amber-100/70 dark:bg-amber-950/40 rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
          Link kelola — rahasia
        </span>
        <p className="text-[11px] font-mono text-on-surface break-all bg-surface-container-lowest rounded-lg p-2">
          {manageUrl}
        </p>
        <p className="text-[11px] text-amber-800 dark:text-amber-300">
          Hanya kamu yang boleh pegang ini. Dengan link ini kamu bisa mengubah dan menandai lunas. Jangan kirim ke grup.
        </p>
        <button
          type="button"
          onClick={() => copy('manage', manageUrl)}
          className="py-2.5 bg-surface-container-lowest text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold"
        >
          {copied === 'manage' ? 'Tersalin ✓' : 'Salin Link Kelola'}
        </button>
      </div>

      <Link
        href={`/b/${created.id}/kelola/${created.editToken}`}
        className="w-full py-3 text-center bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md"
      >
        Lihat Halaman Kelola
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
