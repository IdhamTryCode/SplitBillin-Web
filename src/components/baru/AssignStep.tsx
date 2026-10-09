'use client'

import React, { useMemo, useState } from 'react'
import { MemberAvatar, MemberChip } from './MemberChip'
import { formatIDR } from '@/lib/money'
import { withAdjustment } from '@/lib/receipt'
import { computeSplit } from '@/lib/split'
import type { BillFees, BillItem, BillMember, ItemAssignment } from '@/lib/schemas'

interface AssignStepProps {
  items: BillItem[]
  fees: BillFees
  total: number
  members: BillMember[]
  assignments: Record<string, ItemAssignment[]>
  onAssignmentsChange: (assignments: Record<string, ItemAssignment[]>) => void
  onContinue: () => void
  onBack: () => void
}

export function AssignStep({
  items,
  fees,
  total,
  members,
  assignments,
  onAssignmentsChange,
  onContinue,
  onBack,
}: AssignStepProps) {
  // Items restored from a draft or an edit may already be split per portion.
  const [unitsMode, setUnitsMode] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      items
        .filter((it) => (assignments[it.id] ?? []).some((a) => a.units !== undefined))
        .map((it) => [it.id, true]),
    ),
  )

  const setItemAssignments = (itemId: string, list: ItemAssignment[]) => {
    const next = { ...assignments }
    if (list.length) next[itemId] = list
    else delete next[itemId]
    onAssignmentsChange(next)
  }

  const toggleMember = (item: BillItem, memberId: string) => {
    const current = assignments[item.id] ?? []
    const exists = current.some((a) => a.member_id === memberId)
    let list = exists
      ? current.filter((a) => a.member_id !== memberId)
      : [...current, { member_id: memberId }]
    if (unitsMode[item.id]) list = list.map((a) => ({ member_id: a.member_id, units: a.units ?? 1 }))
    setItemAssignments(item.id, list)
  }

  const setUnits = (itemId: string, memberId: string, units: number) => {
    const current = assignments[itemId] ?? []
    setItemAssignments(
      itemId,
      current.map((a) => (a.member_id === memberId ? { ...a, units: Math.max(1, units) } : a)),
    )
  }

  // Switching modes rewrites the item's assignments so the maths matches the UI:
  // per-portion needs units on everyone, equal split needs none.
  const toggleUnitsMode = (item: BillItem) => {
    const next = !unitsMode[item.id]
    setUnitsMode((prev) => ({ ...prev, [item.id]: next }))
    const current = assignments[item.id] ?? []
    setItemAssignments(
      item.id,
      current.map((a) => (next ? { member_id: a.member_id, units: a.units ?? 1 } : { member_id: a.member_id })),
    )
  }

  const itemStatus = (item: BillItem): { complete: boolean; unitsSum: number } => {
    const a = assignments[item.id] ?? []
    if (a.length === 0) return { complete: false, unitsSum: 0 }
    if (unitsMode[item.id]) {
      const unitsSum = a.reduce((s, x) => s + (x.units ?? 0), 0)
      return { complete: unitsSum === item.qty && a.every((x) => (x.units ?? 0) > 0), unitsSum }
    }
    return { complete: true, unitsSum: 0 }
  }

  const incomplete = items.filter((it) => !itemStatus(it).complete)

  const assignAll = () => {
    const next: Record<string, ItemAssignment[]> = {}
    for (const item of items) next[item.id] = members.map((m) => ({ member_id: m.id }))
    setUnitsMode({})
    onAssignmentsChange(next)
  }

  const clearAll = () => {
    setUnitsMode({})
    onAssignmentsChange({})
  }

  const result = useMemo(
    () => computeSplit(items, withAdjustment(items, fees, total), total, members, assignments),
    [items, fees, total, members, assignments],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-bold text-on-surface">Bagi Pesanan</h1>
        <p className="text-sm text-on-surface-variant">
          Tandai siapa yang ikut tiap item. Diskon, pajak, dan biaya lain dibagi sesuai porsi pesananmu.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={assignAll}
          className="flex-1 h-11 bg-surface-container text-primary font-semibold rounded-xl text-xs"
        >
          Semua ikut
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="flex-1 h-11 bg-surface-container text-on-surface-variant font-semibold rounded-xl text-xs"
        >
          Kosongkan
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const assigned = assignments[item.id] ?? []
          const assignedIds = assigned.map((a) => a.member_id)
          const status = itemStatus(item)
          const usesUnits = !!unitsMode[item.id]

          return (
            <div
              key={item.id}
              className={`bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-3.5 shadow-sm border ${
                status.complete ? 'border-slate-100 dark:border-slate-800' : 'border-amber-300 dark:border-amber-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-on-surface truncate">{item.name}</span>
                  <span className="font-mono text-[11px] text-on-surface-variant">
                    {item.qty} × {formatIDR(item.unit_price)} · net {formatIDR(item.line_total - item.discount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleUnitsMode(item)}
                  aria-pressed={usesUnits}
                  disabled={item.qty < 2}
                  className={`shrink-0 h-11 px-3 rounded-lg text-[11px] font-semibold ${
                    usesUnits ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                  } ${item.qty < 2 ? 'opacity-40' : ''}`}
                >
                  Atur per porsi
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {members.map((m) => (
                  <MemberChip
                    key={m.id}
                    member={m}
                    selected={assignedIds.includes(m.id)}
                    onClick={() => toggleMember(item, m.id)}
                  />
                ))}
              </div>

              {usesUnits && (
                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                  {assigned.map((a) => {
                    const member = members.find((m) => m.id === a.member_id)
                    if (!member) return null
                    return (
                      <div key={a.member_id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 text-xs text-on-surface flex items-center gap-1.5">
                          <MemberAvatar member={member} className="w-4 h-4 text-[9px]" />
                          <span className="truncate">{member.name}</span>
                        </span>
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Kurangi porsi ${member.name}`}
                            onClick={() => setUnits(item.id, a.member_id, (a.units ?? 1) - 1)}
                            className="w-11 h-11 rounded-lg bg-surface-container text-on-surface font-bold"
                          >
                            −
                          </button>
                          <span className="font-mono text-sm w-6 text-center">{a.units ?? 0}</span>
                          <button
                            type="button"
                            aria-label={`Tambah porsi ${member.name}`}
                            onClick={() => setUnits(item.id, a.member_id, (a.units ?? 1) + 1)}
                            className="w-11 h-11 rounded-lg bg-surface-container text-on-surface font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <span
                    className={`text-[11px] font-mono ${
                      status.unitsSum === item.qty ? 'text-primary' : 'text-error'
                    }`}
                  >
                    Terbagi {status.unitsSum} dari {item.qty} porsi
                  </span>
                </div>
              )}

              {assigned.length === 0 && (
                <span className="block mt-2 text-[11px] text-error font-medium">Belum ditandai</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Live summary */}
      <div className="sticky bottom-3 lg:top-20 lg:bottom-auto z-10 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-outline-variant/40 flex flex-col gap-2 max-h-[40dvh] lg:max-h-none overflow-y-auto">
        <span className="text-xs font-bold text-on-surface">Perkiraan per orang</span>
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-on-surface">
              <MemberAvatar member={m} className="w-4 h-4 text-[9px]" />
              {m.name}
              {m.is_payer && <span className="text-[10px] text-on-surface-variant">(nalangin)</span>}
            </span>
            <span className="font-mono font-semibold text-on-surface">{formatIDR(result.memberTotals[m.id] ?? 0)}</span>
          </div>
        ))}
      </div>

      </div>

      {incomplete.length > 0 && (
        <p className="text-xs text-error font-medium">
          {incomplete.length} item belum dibagi. Tandai dulu sebelum lanjut.
        </p>
      )}

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
          disabled={incomplete.length > 0}
          className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm disabled:opacity-50"
        >
          Lanjut Info Bayar →
        </button>
      </div>
    </div>
  )
}
