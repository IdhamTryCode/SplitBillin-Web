'use client'

import React from 'react'
import type { Branch } from './types'

interface ModeChooserProps {
  onSelect: (branch: Branch) => void
}

export function ModeChooser({ onSelect }: ModeChooserProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-on-surface">Mau bagi tagihan apa?</h1>
        <p className="text-sm text-on-surface-variant">
          Pilih cara cepat biar SplitBillin bantu itungin.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onSelect('scan')}
        className="text-left bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4 active:scale-[0.99] transition-transform"
      >
        <span className="w-12 h-12 rounded-2xl bg-secondary-container/50 flex items-center justify-center text-2xl shrink-0">
          📸
        </span>
        <span className="flex-1">
          <span className="block font-bold text-on-surface">Hitung otomatis pake struk</span>
          <span className="block text-xs text-on-surface-variant mt-1">
            Foto struk atau ambil dari galeri, biar kami bantu itungin.
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onSelect('manual')}
        className="text-left bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4 active:scale-[0.99] transition-transform"
      >
        <span className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-2xl shrink-0">
          🧮
        </span>
        <span className="flex-1">
          <span className="block font-bold text-on-surface">Atur jumlahnya sendiri</span>
          <span className="block text-xs text-on-surface-variant mt-1">
            Lebih cepat buat bagi rata, gak usah pake struk.
          </span>
        </span>
      </button>
    </div>
  )
}
