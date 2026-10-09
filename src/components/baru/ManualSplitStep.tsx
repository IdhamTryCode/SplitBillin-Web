'use client'

import React from 'react'
import { MoneyInput } from './MoneyInput'
import { formatIDR } from '@/lib/money'
import type { BillMember, ManualSplit } from '@/lib/schemas'

interface ManualSplitStepProps {
  total: number
  members: BillMember[]
  manual: ManualSplit
  onManualChange: (manual: ManualSplit) => void
  onContinue: () => void
  onBack: () => void
}

export function ManualSplitStep({
  total,
  members,
  manual,
  onManualChange,
  onContinue,
  onBack,
}: ManualSplitStepProps) {
  const setValue = (memberId: string, value: number) => {
    onManualChange({ ...manual, values: { ...manual.values, [memberId]: value } })
  }

  const sumAmounts = members.reduce((s, m) => s + (manual.values[m.id] ?? 0), 0)
  const remaining = total - sumAmounts
  const percentTotal = members.reduce((s, m) => s + (manual.values[m.id] ?? 0), 0)

  const amountInvalid = manual.split === 'amount' && sumAmounts !== total
  const percentInvalid = manual.split === 'percent' && percentTotal !== 100
  const canContinue = !amountInvalid && !percentInvalid

  return (
    <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
      <h1 className="text-lg font-bold text-on-surface">Cara Membagi</h1>

      <div className="flex rounded-xl bg-surface-container-low p-1 gap-1">
        {(['equal', 'amount', 'percent'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onManualChange({ ...manual, split: mode })}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold ${
              manual.split === mode ? 'bg-white dark:bg-dark-card shadow text-primary' : 'text-on-surface-variant'
            }`}
          >
            {mode === 'equal' ? 'Bagi Rata' : mode === 'amount' ? 'Nominal' : 'Persen'}
          </button>
        ))}
      </div>

      {manual.split === 'equal' && (
        <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl">
          Total {formatIDR(total)} dibagi rata ke {members.length} orang (
          {formatIDR(Math.floor(total / Math.max(1, members.length)))} / orang).
        </p>
      )}

      {manual.split !== 'equal' && (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-on-surface">{m.name}</span>
              {manual.split === 'amount' ? (
                <MoneyInput
                  value={manual.values[m.id] ?? 0}
                  onChange={(v) => setValue(m.id, v)}
                  placeholder="0"
                  className="w-32 p-2 rounded-lg bg-surface-container-low border border-slate-200 dark:border-slate-800 text-right text-xs"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={manual.values[m.id] ?? ''}
                    onChange={(e) => setValue(m.id, Number(e.target.value))}
                    placeholder="0"
                    className="w-20 p-2 rounded-lg bg-surface-container-low border border-slate-200 dark:border-slate-800 text-right font-mono text-xs"
                  />
                  <span className="text-xs text-on-surface-variant">%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {manual.split === 'amount' && (
        <p className={`text-xs font-mono ${remaining === 0 ? 'text-primary' : 'text-error'}`}>
          {remaining === 0 ? 'Terbagi pas.' : `Sisa belum terbagi: ${formatIDR(remaining)}`}
        </p>
      )}
      {manual.split === 'percent' && (
        <p className={`text-xs font-mono ${percentTotal === 100 ? 'text-primary' : 'text-error'}`}>
          Total persen: {percentTotal}% (harus 100%)
        </p>
      )}

      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
        >
          ← Kembali
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm disabled:opacity-50"
        >
          Lanjut Info Bayar →
        </button>
      </div>
    </div>
  )
}
