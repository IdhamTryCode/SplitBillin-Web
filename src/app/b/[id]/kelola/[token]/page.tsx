'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { formatIDR } from '@/lib/money'
import { computeSplit, computeManualSplit } from '@/lib/split'
import { getManageBillAction, togglePaidStatusAction } from '@/lib/actions/bill-actions'
import type { BillData } from '@/lib/schemas'

export default function CreatorManagePage({ params }: { params: Promise<{ id: string; token: string }> }) {
  const { id, token } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bill, setBill] = useState<{ id: string; created_at: string; expires_at: string; data: BillData } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    getManageBillAction(id, token).then((res) => {
      setLoading(false)
      if (!res.ok || !res.bill) {
        setError(res.error || 'Token kelola tidak valid')
      } else {
        setBill(res.bill)
      }
    })
  }, [id, token])

  if (loading) {
    return (
      <main className="min-h-screen bg-surface dark:bg-dark-canvas p-4 flex flex-col items-center justify-center">
        <div className="max-w-[480px] w-full bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4 animate-pulse">
          <div className="h-6 w-3/4 bg-surface-container rounded" />
          <div className="h-4 w-1/2 bg-surface-container rounded" />
        </div>
      </main>
    )
  }

  if (error || !bill) {
    return (
      <main className="min-h-screen bg-surface dark:bg-dark-canvas p-4 flex flex-col items-center justify-center text-center">
        <div className="max-w-[480px] w-full bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-on-surface">Akses Ditolak</h1>
          <p className="text-sm text-on-surface-variant">{error}</p>
          <Link href="/" className="mt-4 px-6 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm">
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    )
  }

  const { data } = bill
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/b/${id}`

  let memberTotals: Record<string, number> = {}
  let unpaid = 0

  if (data.mode === 'receipt') {
    const res = computeSplit(data.items, data.fees, data.total, data.members, data.assignments)
    memberTotals = res.memberTotals
    unpaid = res.unpaid
  } else if (data.manual) {
    const res = computeManualSplit(data.total, data.members, data.manual.split, data.manual.values)
    memberTotals = res.memberTotals
    unpaid = res.unpaid
  }

  const handleTogglePaid = async (memberId: string) => {
    setTogglingId(memberId)
    const res = await togglePaidStatusAction(id, token, memberId)
    setTogglingId(null)
    if (res.ok) {
      setBill((prev) => {
        if (!prev) return prev
        const updatedMembers = prev.data.members.map((m) =>
          m.id === memberId ? { ...m, paid_at: m.paid_at ? null : new Date().toISOString() } : m,
        )
        return { ...prev, data: { ...prev.data, members: updatedMembers } }
      })
    }
  }

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const settledCount = data.members.filter((m) => m.is_payer || m.paid_at).length

  return (
    <main className="min-h-screen bg-surface dark:bg-dark-canvas pb-20 pt-4 px-4 flex flex-col items-center">
      <div className="max-w-[480px] w-full flex flex-col gap-4">
        {/* Creator Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <span>🔒 <strong>Halaman Kelola (Pembuat)</strong> — Jangan bagikan link ini ke grup!</span>
        </div>

        {/* Bill Summary Ticket */}
        <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-3 mb-3">
            <div>
              <h1 className="text-xl font-bold text-on-surface">{data.merchant}</h1>
              <span className="text-xs text-on-surface-variant">Progress: {settledCount}/{data.members.length} Lunas</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant block">Total Struk</span>
              <span className="font-mono text-lg font-bold text-on-surface">{formatIDR(data.total)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Sisa belum masuk:</span>
            <span className="font-mono text-sm font-bold text-error">{formatIDR(unpaid)}</span>
          </div>
        </div>

        {/* Member Management List */}
        <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-on-surface">Daftar Anggota & Status Lunas</h2>

          {data.members.map((m) => {
            const amount = memberTotals[m.id] || 0
            const isSettled = m.is_payer || !!m.paid_at
            const waText = encodeURIComponent(`Hai ${m.name}, bagianmu di ${data.merchant} adalah ${formatIDR(amount)}. Rincian: ${publicUrl}`)

            return (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low dark:bg-slate-900"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.name[0]?.toUpperCase()}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-on-surface block">{m.name} {m.is_payer && '(Penalang)'}</span>
                    <span className="font-mono text-xs text-primary font-bold">{formatIDR(amount)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!m.is_payer && !isSettled && (
                    <a
                      href={`https://wa.me/?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium"
                    >
                      Tagih WA
                    </a>
                  )}

                  {!m.is_payer && (
                    <button
                      onClick={() => handleTogglePaid(m.id)}
                      disabled={togglingId === m.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSettled
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container dark:bg-slate-800 text-on-surface'
                      }`}
                    >
                      {togglingId === m.id ? '...' : isSettled ? 'Lunas ✓' : 'Tandai Lunas'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Share buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={copyPublicLink}
            className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md"
          >
            {copiedLink ? 'Link Anggota Tersalin! ✓' : 'Salin Link untuk Anggota'}
          </button>
          <Link href={publicUrl} className="w-full py-2.5 text-center text-xs text-primary font-medium hover:underline">
            Buka Tampilan Anggota →
          </Link>
        </div>
      </div>
    </main>
  )
}
