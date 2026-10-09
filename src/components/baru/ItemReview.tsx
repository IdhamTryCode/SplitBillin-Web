'use client'

import React, { useId, useState } from 'react'
import { ItemEditorSheet } from './ItemEditorSheet'
import { useDialog } from '@/lib/use-dialog'
import { MoneyInput } from './MoneyInput'
import { formatIDR } from '@/lib/money'
import { computeDraftTotals } from '@/lib/receipt'
import type { BillFees, BillItem } from '@/lib/schemas'

interface ItemReviewProps {
  previewUrl: string | null
  merchant: string
  date: string
  items: BillItem[]
  fees: BillFees
  total: number
  onMerchantChange: (value: string) => void
  onDateChange: (value: string) => void
  onItemsChange: (items: BillItem[]) => void
  onFeesChange: (fees: BillFees) => void
  onTotalChange: (total: number) => void
  onContinue: () => void
  onManual: () => void
  onBack: () => void
}

function newBlankItem(): BillItem {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
  return { id, name: 'Item baru', qty: 1, unit_price: 0, line_total: 0, discount: 0 }
}

export function ItemReview({
  previewUrl,
  merchant,
  date,
  items,
  fees,
  total,
  onMerchantChange,
  onDateChange,
  onItemsChange,
  onFeesChange,
  onTotalChange,
  onContinue,
  onManual,
  onBack,
}: ItemReviewProps) {
  const [editing, setEditing] = useState<BillItem | null>(null)
  const [showZoom, setShowZoom] = useState(false)
  const zoomTitleId = useId()
  const zoomPanelRef = useDialog(showZoom, () => setShowZoom(false))

  const { net, computed } = computeDraftTotals(items, fees)
  const diff = total - computed
  const diffResolved = diff !== 0 && fees.adjustment === diff
  const merchantMissing = merchant.trim() === ''
  const blocked = items.length === 0 || merchantMissing || (diff !== 0 && !diffResolved)

  const updateFee = (patch: Partial<BillFees>) => onFeesChange({ ...fees, ...patch })

  const saveItem = (updated: BillItem) => {
    onItemsChange(items.map((it) => (it.id === updated.id ? updated : it)))
    setEditing(null)
  }
  const deleteItem = (id: string) => {
    onItemsChange(items.filter((it) => it.id !== id))
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-on-surface">Periksa &amp; Koreksi Item</h1>
        <p className="text-sm text-on-surface-variant">
          OCR bisa keliru. Ketuk baris untuk memperbaiki sebelum lanjut.
        </p>
      </div>

      {/* Receipt thumbnail + merchant/date */}
      <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-3 shadow-sm">
        {previewUrl && (
          <button
            type="button"
            onClick={() => setShowZoom(true)}
            className="relative w-14 h-18 rounded-lg overflow-hidden shrink-0 bg-surface-container-highest"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Foto struk asli" className="w-full h-full object-cover" />
            <span className="absolute inset-0 bg-primary/20 flex items-center justify-center text-white text-sm">
              🔍
            </span>
          </button>
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <input
            type="text"
            value={merchant}
            onChange={(e) => onMerchantChange(e.target.value)}
            placeholder="Nama tempat"
            aria-label="Nama tempat"
            aria-invalid={merchantMissing}
            className="bg-transparent font-bold text-sm text-on-surface w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {merchantMissing && <span className="text-[11px] text-error">Nama tempat wajib diisi dulu.</span>}
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            aria-label="Tanggal struk"
            className="bg-transparent text-xs text-on-surface-variant w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Reconciliation banner */}
      {diff === 0 ? (
        <div className="bg-secondary-container/30 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm shrink-0">
            ✓
          </span>
          <p className="text-xs text-on-surface">
            Hitungan cocok dengan total di struk:{' '}
            <span className="font-mono font-bold">{formatIDR(total)}</span>
          </p>
        </div>
      ) : diffResolved ? (
        <div className="bg-secondary-container/30 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
          <p className="text-xs text-on-surface">
            Pakai total dari struk <span className="font-mono font-bold">{formatIDR(total)}</span>. Selisih{' '}
            <span className="font-mono font-bold">{formatIDR(Math.abs(diff))}</span> dibagi sesuai porsi tiap orang.
          </p>
          <button
            type="button"
            onClick={() => updateFee({ adjustment: 0 })}
            className="self-start text-xs text-primary font-semibold"
          >
            Batalkan
          </button>
        </div>
      ) : (
        <div className="bg-amber-100 dark:bg-amber-950/40 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
          <p className="text-xs text-on-surface">
            Ada selisih <span className="font-mono font-bold">{formatIDR(Math.abs(diff))}</span> antara item (
            <span className="font-mono">{formatIDR(computed)}</span>) dan total di struk (
            <span className="font-mono">{formatIDR(total)}</span>). Cek item atau biaya di bawah.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateFee({ adjustment: diff })}
              className="px-4 h-11 rounded-lg bg-surface-container-lowest text-primary text-xs font-semibold shadow-sm"
            >
              Pakai total dari struk
            </button>
            <button
              type="button"
              onClick={() => {
                updateFee({ adjustment: 0 })
                onTotalChange(computed)
              }}
              className="px-4 h-11 rounded-lg text-on-surface-variant text-xs font-semibold"
            >
              Pakai total terhitung
            </button>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-bold text-on-surface">Daftar Item</h2>
          <span className="font-mono text-[11px] bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-md font-bold">
            {items.length} item
          </span>
        </div>

        <div className="px-2 pb-2 flex flex-col">
          {items.map((item) => {
            const itemNet = item.line_total - item.discount
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setEditing(item)}
                className="text-left flex items-start justify-between gap-2 p-2.5 rounded-xl hover:bg-surface-container-low transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-on-surface truncate">{item.name}</span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                      {item.qty} × {formatIDR(item.unit_price)}
                    </span>
                    {item.discount > 0 && (
                      <span className="font-mono text-[10px] font-bold bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-full">
                        Diskon −{formatIDR(item.discount)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm text-on-surface block">{formatIDR(item.line_total)}</span>
                  {item.discount > 0 && (
                    <span className="font-mono text-[11px] text-primary">Net {formatIDR(itemNet)}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="p-3 pt-1">
          <button
            type="button"
            onClick={() => setEditing(newBlankItem())}
            className="w-full h-11 rounded-xl bg-surface-container-low text-primary text-sm font-semibold"
          >
            + Tambah Item
          </button>
        </div>
      </div>

      {/* Receipt-level fees */}
      <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-on-surface">Biaya &amp; Potongan Tambahan</h2>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-on-surface">Diskon / Voucher Struk</span>
          <MoneyInput
            value={fees.discount}
            onChange={(v) => updateFee({ discount: v })}
            ariaLabel="Diskon atau voucher struk"
            className="w-28 p-2 rounded-lg bg-surface-container text-right text-sm"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-on-surface">Service</span>
          <MoneyInput
            value={fees.service}
            onChange={(v) => updateFee({ service: v })}
            ariaLabel="Service charge"
            className="w-28 p-2 rounded-lg bg-surface-container text-right text-sm"
          />
        </div>

        <div className="rounded-xl bg-surface-container-low p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-on-surface font-medium">Pajak PB1 / PPN</span>
            <MoneyInput
              value={fees.tax}
              onChange={(v) => updateFee({ tax: v })}
              ariaLabel="Pajak PB1 atau PPN"
              className="w-28 p-2 rounded-lg bg-surface-container-lowest text-right text-sm"
            />
          </div>
          <label className="flex items-center justify-between cursor-pointer text-[11px] text-on-surface-variant border-t border-surface-container pt-2">
            Sudah termasuk di dalam harga item
            <input
              type="checkbox"
              checked={fees.tax_included}
              onChange={(e) => updateFee({ tax_included: e.target.checked })}
              className="accent-primary w-4 h-4"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          {fees.other.map((fee, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={fee.name}
                onChange={(e) =>
                  updateFee({ other: fees.other.map((f, i) => (i === idx ? { ...f, name: e.target.value } : f)) })
                }
                aria-label="Nama biaya lain"
                className="flex-1 p-2 rounded-lg bg-surface-container text-xs text-on-surface"
              />
              <MoneyInput
                value={fee.amount}
                onChange={(v) =>
                  updateFee({ other: fees.other.map((f, i) => (i === idx ? { ...f, amount: v } : f)) })
                }
                ariaLabel="Jumlah biaya lain"
                className="w-24 p-2 rounded-lg bg-surface-container text-right text-sm"
              />
              <button
                type="button"
                onClick={() => updateFee({ other: fees.other.filter((_, i) => i !== idx) })}
                className="text-error text-xs p-1"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateFee({ other: [...fees.other, { name: 'Biaya lain', amount: 0 }] })}
            className="self-start h-11 text-xs text-primary font-semibold"
          >
            + Tambah Biaya Lain
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-on-surface">Pembulatan</span>
          <MoneyInput
            value={fees.rounding}
            onChange={(v) => updateFee({ rounding: v })}
            allowNegative
            ariaLabel="Pembulatan kasir"
            className="w-28 p-2 rounded-lg bg-surface-container text-right text-sm"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-surface-container/60 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span>Subtotal item</span>
          <span className="font-mono font-medium">{formatIDR(net)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span>Total dihitung</span>
          <span className="font-mono font-medium">{formatIDR(computed)}</span>
        </div>
        <div className="pt-2 border-t border-surface-container-highest flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-on-surface">Total di struk</span>
          <MoneyInput
            value={total}
            onChange={onTotalChange}
            ariaLabel="Total di struk"
            className="w-32 text-right text-lg font-bold text-primary bg-transparent rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-2">
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
          disabled={blocked}
          className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm disabled:opacity-50"
        >
          {merchantMissing
            ? 'Isi nama tempat dulu'
            : diff !== 0 && !diffResolved
              ? 'Selesaikan selisih dulu'
              : 'Lanjut →'}
        </button>
      </div>
      <button type="button" onClick={onManual} className="h-11 text-xs text-primary font-medium hover:underline">
        Ganti ke isi manual
      </button>

      <ItemEditorSheet
        open={editing !== null}
        item={editing}
        onSave={saveItem}
        onDelete={deleteItem}
        onClose={() => setEditing(null)}
      />

      {showZoom && previewUrl && (
        <div
          ref={zoomPanelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={zoomTitleId}
          tabIndex={-1}
          className="fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id={zoomTitleId} className="text-sm font-bold text-on-surface">
                Foto Struk Asli
              </h2>
              <button
                type="button"
                onClick={() => setShowZoom(false)}
                aria-label="Tutup"
                className="w-11 h-11 -mr-2 rounded-full bg-surface-container text-on-surface-variant"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full h-80 rounded-xl overflow-hidden bg-surface-container-highest">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Foto struk" className="w-full h-full object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setShowZoom(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold"
            >
              Tutup &amp; Lanjutkan Edit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
