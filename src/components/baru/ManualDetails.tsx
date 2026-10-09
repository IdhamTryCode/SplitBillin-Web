'use client'

import React from 'react'
import { MoneyInput } from './MoneyInput'

interface ManualDetailsProps {
  merchant: string
  total: number
  date: string
  error: string | null
  onMerchantChange: (value: string) => void
  onTotalChange: (value: number) => void
  onDateChange: (value: string) => void
  onContinue: () => void
  onBack: () => void
}

export function ManualDetails({
  merchant,
  total,
  date,
  error,
  onMerchantChange,
  onTotalChange,
  onDateChange,
  onContinue,
  onBack,
}: ManualDetailsProps) {
  return (
    <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
      <h1 className="text-lg font-bold text-on-surface">Total Tagihan &amp; Keterangan</h1>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-on-surface-variant font-medium">Nama Tempat / Acara</label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => onMerchantChange(e.target.value)}
          placeholder="misal: Makan Siang Warung Bu Tini"
          className="p-3 rounded-xl bg-surface-container-low dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-on-surface focus:outline-primary"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-on-surface-variant font-medium">Total Yang Dibayar (Rp)</label>
        <MoneyInput
          value={total}
          onChange={onTotalChange}
          placeholder="55.700"
          className="p-3 rounded-xl bg-surface-container-low dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-lg font-bold text-primary focus:outline-primary"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-on-surface-variant font-medium">Tanggal</label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="p-3 rounded-xl bg-surface-container-low dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-on-surface focus:outline-primary"
        />
      </div>

      {error && <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">{error}</div>}

      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
        >
          ←
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm"
        >
          Lanjut Pilih Anggota →
        </button>
      </div>
    </div>
  )
}
