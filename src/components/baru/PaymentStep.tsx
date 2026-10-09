'use client'

import React, { useRef, useState } from 'react'
import { compressImage } from '@/lib/image'
import type { PaymentInfo } from '@/lib/schemas'
import type { QrisDraft } from './types'

type PaymentMethod = PaymentInfo['methods'][number]

interface PaymentStepProps {
  payment: PaymentInfo
  qris: QrisDraft | null
  /** Signed URL of the image already stored on the bill (edit mode). */
  existingQrisUrl: string | null
  onPaymentChange: (payment: PaymentInfo) => void
  onQrisChange: (qris: QrisDraft | null) => void
  onRemoveExistingQris: () => void
  onContinue: () => void
  onBack: () => void
}

const QRIS_MAX_BYTES = 900_000

const PROVIDERS: Record<PaymentMethod['kind'], string[]> = {
  bank: ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Permata', 'Jago', 'SeaBank', 'Blu'],
  ewallet: ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'],
  other: [],
}

const KINDS: Array<{ key: PaymentMethod['kind']; label: string }> = [
  { key: 'bank', label: 'Bank' },
  { key: 'ewallet', label: 'E-wallet' },
  { key: 'other', label: 'Lainnya' },
]

function emptyMethod(): PaymentMethod {
  return { kind: 'bank', provider: '', number: '', holder: '' }
}

const FIELD = 'w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface'

export function PaymentStep({
  payment,
  qris,
  existingQrisUrl,
  onPaymentChange,
  onQrisChange,
  onRemoveExistingQris,
  onContinue,
  onBack,
}: PaymentStepProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [qrisError, setQrisError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const setMethod = (idx: number, patch: Partial<PaymentMethod>) => {
    onPaymentChange({
      ...payment,
      methods: payment.methods.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    })
  }
  const addMethod = () => onPaymentChange({ ...payment, methods: [...payment.methods, emptyMethod()] })
  const removeMethod = (idx: number) =>
    onPaymentChange({ ...payment, methods: payment.methods.filter((_, i) => i !== idx) })

  const pickQris = async (file: File | undefined) => {
    if (!file) return
    setQrisError(null)
    setBusy(true)
    try {
      const compressed = await compressImage(file, QRIS_MAX_BYTES)
      if (qris) URL.revokeObjectURL(qris.previewUrl)
      onQrisChange({ blob: compressed.blob, previewUrl: compressed.previewUrl })
    } catch {
      setQrisError('Gambar tidak didukung. Pakai JPEG, PNG, atau WebP.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeQris = () => {
    if (qris) {
      URL.revokeObjectURL(qris.previewUrl)
      onQrisChange(null)
    } else {
      onRemoveExistingQris()
    }
  }

  const shownQris = qris?.previewUrl ?? existingQrisUrl
  const incomplete = payment.methods.some((m) => (m.provider.trim() || m.holder.trim()) && !m.number.trim())

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-bold text-on-surface">Info pembayaran</h1>
        <p className="text-xs text-on-surface-variant">
          Temanmu transfer ke sini. Boleh dikosongkan kalau bayar tunai.
        </p>
      </div>

      <p className="text-xs text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/40 rounded-lg p-3">
        Siapa pun yang punya link bisa melihat info ini. Jangan isi data yang tidak mau dibagikan.
      </p>

      {payment.methods.map((method, idx) => (
        <fieldset key={idx} className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2">
          <legend className="sr-only">Cara bayar {idx + 1}</legend>
          <div className="flex items-center gap-1">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                aria-pressed={method.kind === k.key}
                onClick={() => setMethod(idx, { kind: k.key })}
                className={`px-3 h-9 rounded-full text-xs font-semibold ${
                  method.kind === k.key
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant'
                }`}
              >
                {k.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => removeMethod(idx)}
              aria-label={`Hapus cara bayar ${idx + 1}`}
              className="ml-auto w-9 h-9 text-error text-sm"
            >
              ✕
            </button>
          </div>

          {PROVIDERS[method.kind].length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {PROVIDERS[method.kind].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMethod(idx, { provider: p })}
                  className={`shrink-0 px-2.5 h-8 rounded-lg text-[11px] font-semibold ${
                    method.provider === p
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <input
            type="text"
            value={method.provider}
            maxLength={60}
            onChange={(e) => setMethod(idx, { provider: e.target.value })}
            placeholder={method.kind === 'bank' ? 'Nama bank' : method.kind === 'ewallet' ? 'Nama e-wallet' : 'Nama layanan'}
            aria-label="Nama bank atau e-wallet"
            className={FIELD}
          />
          <input
            type="text"
            inputMode="numeric"
            value={method.number}
            maxLength={40}
            onChange={(e) => setMethod(idx, { number: e.target.value })}
            placeholder={method.kind === 'bank' ? 'Nomor rekening' : 'Nomor HP / akun'}
            aria-label="Nomor rekening atau HP"
            className={`${FIELD} font-mono`}
          />
          <input
            type="text"
            value={method.holder}
            maxLength={80}
            onChange={(e) => setMethod(idx, { holder: e.target.value })}
            placeholder="Atas nama"
            aria-label="Atas nama"
            className={FIELD}
          />
        </fieldset>
      ))}

      <button type="button" onClick={addMethod} className="self-start h-11 text-sm text-primary font-semibold">
        + Tambah cara bayar
      </button>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-on-surface-variant font-medium">Gambar QRIS (opsional)</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => pickQris(e.target.files?.[0])}
        />
        {shownQris ? (
          <div className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownQris} alt="Pratinjau QRIS" className="w-20 h-20 rounded-lg object-contain bg-white" />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-10 text-left text-xs text-primary font-semibold"
              >
                Ganti gambar
              </button>
              <button type="button" onClick={removeQris} className="h-10 text-left text-xs text-error font-semibold">
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="h-12 rounded-xl border border-dashed border-outline-variant text-sm text-on-surface-variant font-semibold disabled:opacity-60"
          >
            {busy ? 'Menyiapkan gambar…' : 'Pilih gambar QRIS'}
          </button>
        )}
        {qrisError && (
          <p role="alert" className="text-xs text-error">
            {qrisError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sb-note" className="text-xs text-on-surface-variant font-medium">
          Catatan untuk teman (opsional)
        </label>
        <textarea
          id="sb-note"
          value={payment.note}
          maxLength={500}
          onChange={(e) => onPaymentChange({ ...payment, note: e.target.value })}
          placeholder="misal: Transfer sebelum Jumat ya"
          rows={2}
          className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm text-on-surface"
        />
      </div>

      {incomplete && <p className="text-xs text-error">Ada cara bayar yang nomornya belum diisi.</p>}

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
          disabled={incomplete || busy}
          className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm disabled:opacity-50"
        >
          Lanjut Tinjau →
        </button>
      </div>
    </div>
  )
}
