'use client'

import React, { useEffect, useState } from 'react'
import { ScanErrorState } from './ScanErrorState'
import type { ScanFailure } from './types'

interface ScanLoadingProps {
  previewUrl: string
  failure: ScanFailure | null
  onRetry: () => void
  onRescan: () => void
  onManual: () => void
  onCancel: () => void
}

const PHRASES = [
  'Membaca struk…',
  'Mengenali item…',
  'Mendeteksi subtotal…',
  'Menghitung pajak & servis…',
  'Menghitung total akhir…',
]

export function ScanLoading({
  previewUrl,
  failure,
  onRetry,
  onRescan,
  onManual,
  onCancel,
}: ScanLoadingProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (failure) return
    const phraseTimer = setInterval(() => setPhraseIndex((i) => (i + 1) % PHRASES.length), 2400)
    const clockTimer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => {
      clearInterval(phraseTimer)
      clearInterval(clockTimer)
    }
  }, [failure])

  if (failure) {
    return (
      <ScanErrorState
        failure={failure}
        onRetry={onRetry}
        onRescan={onRescan}
        onManual={onManual}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="relative w-full aspect-[3/4] bg-surface-container overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Struk sedang dipindai" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/20 pointer-events-none" />
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-fixed to-transparent shadow-[0_0_15px_3px_rgba(0,105,72,0.65)] animate-scan-line" />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
            <p className="text-sm font-semibold text-on-surface">{PHRASES[phraseIndex]}</p>
          </div>
          <span className="font-mono text-xs text-on-surface-variant font-semibold">
            00:{String(seconds).padStart(2, '0')}s
          </span>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant text-center">
        Biasanya cuma beberapa detik. Jangan tutup halaman ini ya.
      </p>

      {seconds >= 15 && (
        <div className="bg-surface-container-high rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-lg shrink-0">
              ⌛
            </span>
            <div>
              <h4 className="text-sm font-semibold text-on-surface">Lebih lama dari biasanya…</h4>
              <p className="text-xs text-on-surface-variant">
                Kamu bisa menunggu, atau langsung isi manual saja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onManual}
            className="w-full py-2.5 bg-surface-container-lowest text-primary font-semibold rounded-xl text-sm shadow-sm"
          >
            Isi manual saja
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
      >
        Batal Scan
      </button>
    </div>
  )
}
