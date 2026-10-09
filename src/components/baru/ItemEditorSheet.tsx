'use client'

import React, { useEffect, useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { MoneyInput } from './MoneyInput'
import { formatIDR } from '@/lib/money'
import type { BillItem } from '@/lib/schemas'

interface ItemEditorSheetProps {
  open: boolean
  item: BillItem | null
  onSave: (item: BillItem) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function ItemEditorSheet({ open, item, onSave, onDelete, onClose }: ItemEditorSheetProps) {
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    if (!item) return
    setName(item.name)
    setQty(item.qty)
    setUnitPrice(item.unit_price)
    setDiscount(item.discount)
  }, [item])

  if (!item) return null

  const lineTotal = qty * unitPrice
  const net = lineTotal - discount

  return (
    <BottomSheet open={open} title="Ubah Item" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">Nama Item</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-3 rounded-xl bg-surface-container-low border border-slate-200 dark:border-slate-800 text-sm text-on-surface"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">Jumlah</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-xl bg-surface-container text-on-surface text-lg font-bold"
            >
              −
            </button>
            <span className="flex-1 text-center font-mono text-lg font-bold text-on-surface">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="w-10 h-10 rounded-xl bg-surface-container text-on-surface text-lg font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-medium text-on-surface-variant">Harga Satuan</label>
          <MoneyInput
            value={unitPrice}
            onChange={setUnitPrice}
            placeholder="0"
            className="w-32 p-2.5 rounded-xl bg-surface-container-low border border-slate-200 dark:border-slate-800 text-right text-sm"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-medium text-on-surface-variant">Potongan Item</label>
          <MoneyInput
            value={discount}
            onChange={setDiscount}
            placeholder="0"
            className="w-32 p-2.5 rounded-xl bg-surface-container-low border border-slate-200 dark:border-slate-800 text-right text-sm"
          />
        </div>

        <div className="flex items-center justify-between text-sm bg-surface-container-low rounded-xl p-3">
          <span className="text-on-surface-variant">Total baris</span>
          <span className="font-mono font-bold text-on-surface">{formatIDR(lineTotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-xs -mt-2">
            <span className="text-on-surface-variant">Net setelah potongan</span>
            <span className="font-mono font-semibold text-primary">{formatIDR(net)}</span>
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-semibold"
          >
            Hapus
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() =>
              onSave({
                ...item,
                name: name.trim(),
                qty,
                unit_price: unitPrice,
                line_total: lineTotal,
                discount,
              })
            }
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold disabled:opacity-60"
          >
            Simpan
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
