'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getBillStatusesAction } from '@/lib/actions/bill-actions'
import type { BillListItem } from '@/lib/bills'
import { formatDate } from '@/lib/format'
import { getLocalBills, type LocalBill } from '@/lib/local-store'
import { formatIDR } from '@/lib/money'
import { cn } from '@/lib/utils'

export type HistoryEntry = BillListItem & { href: string }

type Filter = 'all' | 'unpaid' | 'paid'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Semua' },
  { key: 'unpaid', label: 'Belum lunas' },
  { key: 'paid', label: 'Lunas' },
]

export function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const paid = entry.unpaid === 0
  return (
    <Link
      href={entry.href}
      className="flex items-center gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 active:scale-[0.99] transition-transform"
    >
      <div className="min-w-0 flex-1">
        <span className="text-sm font-bold text-on-surface block truncate">{entry.merchant}</span>
        <span className="text-[11px] text-on-surface-variant block">
          {formatDate(entry.date ?? entry.created_at)} · {entry.settledCount} dari {entry.memberCount} lunas
        </span>
      </div>
      <div className="text-right shrink-0">
        <span className="font-mono text-sm font-bold text-on-surface block">{formatIDR(entry.total)}</span>
        <span
          className={cn(
            'inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
            paid
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-error-container text-on-error-container',
          )}
        >
          {paid ? 'Semua lunas' : `Belum lunas ${formatIDR(entry.unpaid)}`}
        </span>
      </div>
    </Link>
  )
}

export function HistorySkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-[74px] rounded-2xl bg-surface-container animate-pulse" />
      ))}
    </div>
  )
}

/** Filterable, searchable list. Used for account history and the guest's local history. */
export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (filter === 'unpaid' && e.unpaid === 0) return false
      if (filter === 'paid' && e.unpaid !== 0) return false
      return !q || e.merchant.toLowerCase().includes(q)
    })
  }, [entries, filter, query])

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama tempat"
        aria-label="Cari nama tempat"
        className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface"
      />
      <div className="flex gap-2" role="tablist" aria-label="Filter status">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 h-9 rounded-full text-xs font-semibold',
              filter === f.key ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-8">Tidak ada split bill yang cocok.</p>
      ) : (
        visible.map((e) => <HistoryRow key={e.id} entry={e} />)
      )}
    </div>
  )
}

function hrefFor(local: LocalBill): string {
  return local.token ? `/b/${local.id}/kelola/${local.token}` : `/b/${local.id}/kelola`
}

/**
 * Bills remembered in this browser, with live status from the server. Entries
 * whose bill no longer exists (deleted or expired) are dropped from the view.
 */
export function useLocalHistory(): { entries: HistoryEntry[]; loading: boolean } {
  const [state, setState] = useState<{ entries: HistoryEntry[]; loading: boolean }>({ entries: [], loading: true })

  useEffect(() => {
    let cancelled = false
    const local = getLocalBills()
    if (local.length === 0) {
      setState({ entries: [], loading: false })
      return
    }
    getBillStatusesAction(local.map((b) => b.id))
      .then((rows) => {
        if (cancelled) return
        const byId = new Map(rows.map((r) => [r.id, r]))
        const entries = local
          .map((l) => {
            const row = byId.get(l.id)
            return row ? { ...row, href: hrefFor(l) } : null
          })
          .filter((e): e is HistoryEntry => e !== null)
        setState({ entries, loading: false })
      })
      .catch(() => {
        if (!cancelled) setState({ entries: [], loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
