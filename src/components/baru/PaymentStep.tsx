'use client'

import React from 'react'
import type { PaymentInfo } from '@/lib/schemas'

type PaymentMethod = PaymentInfo['methods'][number]

interface PaymentStepProps {
  payment: PaymentInfo
  onPaymentChange: (payment: PaymentInfo) => void
  onContinue: () => void
  onBack: () => void
}

const PROVIDERS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'GoPay', 'OVO', 'DANA', 'ShopeePay']

function emptyMethod(): PaymentMethod {
  return { kind: 'bank', provider: '', number: '', holder: '' }
}

export function PaymentStep({ payment, onPaymentChange, onContinue, onBack }: PaymentStepProps) {
  const setMethod = (idx: number, patch: Partial<PaymentMethod>) => {
    onPaymentChange({
      ...payment,
      methods: payment.methods.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    })
  }
  const addMethod = () => onPaymentChange({ ...payment, methods: [...payment.methods, emptyMethod()] })
  const removeMethod = (idx: number) =>
    onPaymentChange({ ...payment, methods: payment.methods.filter((_, i) => i !== idx) })

  return (
    <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-bold text-on-surface">Info Pembayaran (Opsional)</h1>
        <p className="text-xs text-on-surface-variant">
          Temanmu transfer ke sini. Bisa dikosongkan kalau bayar tunai.
        </p>
      </div>

      {payment.methods.map((method, idx) => (
        <div key={idx} className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <select
              value={method.kind}
              onChange={(e) => setMethod(idx, { kind: e.target.value as PaymentMethod['kind'] })}
              className="p-2 rounded-lg bg-surface-container-lowest text-xs text-on-surface"
            >
              <option value="bank">Bank</option>
              <option value="ewallet">E-Wallet</option>
              <option value="other">Lainnya</option>
            </select>
            <input
              type="text"
              list="sb-providers"
              value={method.provider}
              onChange={(e) => setMethod(idx, { provider: e.target.value })}
              placeholder="BCA / GoPay"
              className="flex-1 p-2 rounded-lg bg-surface-container-lowest text-xs text-on-surface"
            />
            <button type="button" onClick={() => removeMethod(idx)} className="text-error text-xs p-1">
              ✕
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={method.number}
            onChange={(e) => setMethod(idx, { number: e.target.value })}
            placeholder="Nomor rekening / HP"
            className="p-2.5 rounded-lg bg-surface-container-lowest font-mono text-xs text-on-surface"
          />
          <input
            type="text"
            value={method.holder}
            onChange={(e) => setMethod(idx, { holder: e.target.value })}
            placeholder="Atas nama"
            className="p-2.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface"
          />
        </div>
      ))}

      <datalist id="sb-providers">
        {PROVIDERS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <button
        type="button"
        onClick={addMethod}
        className="self-start text-xs text-primary font-semibold py-1"
      >
        + Tambah Cara Bayar
      </button>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-on-surface-variant font-medium">Catatan Untuk Teman</label>
        <textarea
          value={payment.note}
          onChange={(e) => onPaymentChange({ ...payment, note: e.target.value })}
          placeholder="misal: Transfer sebelum hari Jumat ya..."
          rows={2}
          className="p-2.5 rounded-xl bg-surface-container-low border border-slate-200 dark:border-slate-800 text-xs text-on-surface"
        />
      </div>

      <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/30 rounded-lg p-2.5">
        Siapa pun yang punya link bisa melihat info ini. Jangan isi data yang tidak mau dibagikan.
      </p>

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
          className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm"
        >
          Lanjut Tinjau →
        </button>
      </div>
    </div>
  )
}
