'use client'

import React from 'react'
import { MemberAvatar } from './MemberChip'
import { TicketCard, TicketNotchDivider } from '@/components/TicketCard'
import { formatDate } from '@/lib/format'
import { formatIDR } from '@/lib/money'
import { withAdjustment } from '@/lib/receipt'
import { computeManualSplit, computeSplit } from '@/lib/split'
import type { BillFees, BillItem, BillMember, ItemAssignment, ManualSplit, PaymentInfo } from '@/lib/schemas'

interface ReviewStepProps {
  mode: 'receipt' | 'manual'
  editing: boolean
  merchant: string
  date: string
  total: number
  items: BillItem[]
  fees: BillFees
  members: BillMember[]
  assignments: Record<string, ItemAssignment[]>
  manual: ManualSplit | null
  payment: PaymentInfo
  hasQris: boolean
  submitting: boolean
  error: string | null
  onSubmit: () => void
  onBack: () => void
}

export function ReviewStep({
  mode,
  editing,
  merchant,
  date,
  total,
  items,
  fees,
  members,
  assignments,
  manual,
  payment,
  hasQris,
  submitting,
  error,
  onSubmit,
  onBack,
}: ReviewStepProps) {
  const payer = members.find((m) => m.is_payer) ?? members[0]

  let memberTotals: Record<string, number> = {}
  if (mode === 'receipt') {
    memberTotals = computeSplit(items, withAdjustment(items, fees, total), total, members, assignments).memberTotals
  } else if (manual) {
    memberTotals = computeManualSplit(total, members, manual.split, manual.values).memberTotals
  }

  const methods = payment.methods.filter((m) => m.provider.trim() || m.number.trim())
  const paymentSummary = [
    methods.length > 0 ? `${methods.length} cara bayar` : null,
    hasQris ? 'QRIS' : null,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-on-surface">{editing ? 'Tinjau perubahan' : 'Tinjau dan buat'}</h1>

      <TicketCard>
        <div className="px-5 pt-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-on-surface break-words">{merchant.trim() || 'Tanpa nama'}</h2>
            {date && <p className="text-xs text-on-surface-variant">{formatDate(date)}</p>}
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-on-surface-variant block">Total</span>
            <span className="font-mono text-xl font-bold text-on-surface">{formatIDR(total)}</span>
          </div>
        </div>

        <TicketNotchDivider />

        <div className="px-5 pb-6 flex flex-col gap-2.5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-on-surface min-w-0">
                <MemberAvatar member={m} />
                <span className="truncate">{m.name}</span>
                {m.is_payer && <span className="text-[10px] text-on-surface-variant shrink-0">(nalangin)</span>}
              </span>
              <span className="font-mono font-semibold text-on-surface shrink-0">
                {formatIDR(memberTotals[m.id] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </TicketCard>

      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 text-xs text-on-surface-variant flex flex-col gap-1.5">
        <p>
          Dibayar ke <strong className="text-on-surface">{payer?.name}</strong>
          {paymentSummary.length > 0 ? ` lewat ${paymentSummary.join(' + ')}.` : '. Info bayar belum diisi.'}
        </p>
        <p>{mode === 'receipt' ? `${items.length} item dari struk.` : 'Dibagi manual, tanpa rincian item.'}</p>
        <p>Split bill ini aktif 90 hari.</p>
      </div>

      {error && (
        <div role="alert" className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">
          {error} {!editing && 'Drafmu tetap aman, coba lagi.'}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm disabled:opacity-60"
        >
          ← Kembali
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md disabled:opacity-60"
        >
          {submitting ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat split bill'}
        </button>
      </div>
    </div>
  )
}
