'use client'

import React from 'react'
import { MemberAvatar } from './MemberChip'
import { TicketCard, TicketNotchDivider } from '@/components/TicketCard'
import { formatIDR } from '@/lib/money'
import { computeDraftTotals } from '@/lib/receipt'
import { computeManualSplit, computeSplit } from '@/lib/split'
import type { BillFees, BillItem, BillMember, ItemAssignment, ManualSplit, PaymentInfo } from '@/lib/schemas'

interface ReviewStepProps {
  mode: 'receipt' | 'manual'
  merchant: string
  date: string
  total: number
  items: BillItem[]
  fees: BillFees
  members: BillMember[]
  assignments: Record<string, ItemAssignment[]>
  manual: ManualSplit | null
  payment: PaymentInfo
  submitting: boolean
  error: string | null
  onAdjust: (diff: number) => void
  onSubmit: () => void
  onBack: () => void
}

export function ReviewStep({
  mode,
  merchant,
  date,
  total,
  items,
  fees,
  members,
  assignments,
  manual,
  payment,
  submitting,
  error,
  onAdjust,
  onSubmit,
  onBack,
}: ReviewStepProps) {
  const payer = members.find((m) => m.is_payer) ?? members[0]

  let memberTotals: Record<string, number> = {}
  if (mode === 'receipt') {
    memberTotals = computeSplit(items, fees, total, members, assignments).memberTotals
  } else if (manual) {
    memberTotals = computeManualSplit(total, members, manual.split, manual.values).memberTotals
  }

  const { computed } = computeDraftTotals(items, fees)
  const diff = mode === 'receipt' && fees.adjustment === 0 ? total - computed : 0

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-on-surface">Tinjau Split Bill</h1>

      <TicketCard className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-on-surface">{merchant || 'Tanpa nama'}</h2>
            {date && <p className="text-xs text-on-surface-variant">{date}</p>}
          </div>
          <div className="text-right">
            <span className="text-[11px] text-on-surface-variant block">Total</span>
            <span className="font-mono text-lg font-bold text-on-surface">{formatIDR(total)}</span>
          </div>
        </div>

        <TicketNotchDivider />

        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-on-surface">
                <MemberAvatar member={m} />
                {m.name}
                {m.is_payer && <span className="text-[10px] text-on-surface-variant">(penalang)</span>}
              </span>
              <span className="font-mono font-semibold text-on-surface">
                {formatIDR(memberTotals[m.id] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </TicketCard>

      {diff !== 0 && (
        <div className="bg-amber-100 dark:bg-amber-950/40 rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs text-on-surface">
            Masih ada selisih <span className="font-mono font-bold">{formatIDR(Math.abs(diff))}</span> yang belum
            teralokasi ke siapa pun.
          </p>
          <button
            type="button"
            onClick={() => onAdjust(diff)}
            className="self-start px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary text-xs font-semibold shadow-sm"
          >
            Selaraskan ke total
          </button>
        </div>
      )}

      <p className="text-xs text-on-surface-variant text-center">
        Dibayar ke <strong className="text-on-surface">{payer.name}</strong>. Split bill ini aktif 90 hari.
      </p>

      {error && <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">{error}</div>}

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
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md disabled:opacity-60"
        >
          {submitting ? 'Membuat…' : 'Buat Split Bill ✓'}
        </button>
      </div>

      <div className="text-[11px] text-outline text-center">
        {payment.methods.length} cara bayar · {mode === 'receipt' ? `${items.length} item` : 'mode manual'}
      </div>
    </div>
  )
}
