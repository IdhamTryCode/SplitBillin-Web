'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { formatIDR } from '@/lib/money'
import { computeSplit, computeManualSplit } from '@/lib/split'
import { getBillAction } from '@/lib/actions/bill-actions'
import type { BillData } from '@/lib/schemas'

export default function MemberBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bill, setBill] = useState<{ id: string; created_at: string; expires_at: string; data: BillData } | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showFullAccount, setShowFullAccount] = useState<Record<number, boolean>>({})

  useEffect(() => {
    getBillAction(id).then((res) => {
      setLoading(false)
      if (!res.ok || !res.bill) {
        setError(res.error || 'Gagal memuat split bill')
      } else {
        setBill(res.bill)
        // Select first non-payer member by default
        const nonPayer = res.bill.data.members.find((m) => !m.is_payer)
        if (nonPayer) setSelectedMemberId(nonPayer.id)
        else if (res.bill.data.members[0]) setSelectedMemberId(res.bill.data.members[0].id)
      }
    })
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-surface dark:bg-dark-canvas p-4 flex flex-col items-center justify-center">
        <div className="max-w-[480px] w-full bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-surface-container" />
          <div className="h-6 w-3/4 bg-surface-container rounded" />
          <div className="h-4 w-1/2 bg-surface-container rounded" />
          <div className="h-20 w-full bg-surface-container rounded-xl mt-4" />
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
          <h1 className="text-xl font-bold text-on-surface">Link Tidak Valid</h1>
          <p className="text-sm text-on-surface-variant">{error || 'Split bill tidak ditemukan'}</p>
          <Link
            href="/"
            className="mt-4 px-6 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    )
  }

  const { data } = bill
  const payer = data.members.find((m) => m.is_payer) || data.members[0]

  // Compute split totals
  let memberTotals: Record<string, number> = {}
  let unpaid = 0
  let memberItemDetails: Record<string, Record<string, number>> = {}

  if (data.mode === 'receipt') {
    const res = computeSplit(data.items, data.fees, data.total, data.members, data.assignments)
    memberTotals = res.memberTotals
    unpaid = res.unpaid
    memberItemDetails = res.memberItemDetails
  } else if (data.manual) {
    const res = computeManualSplit(data.total, data.members, data.manual.split, data.manual.values)
    memberTotals = res.memberTotals
    unpaid = res.unpaid
  }

  const selectedMember = data.members.find((m) => m.id === selectedMemberId)
  const selectedAmount = selectedMemberId ? memberTotals[selectedMemberId] || 0 : 0
  const isSettled = selectedMember?.paid_at || selectedMember?.is_payer

  const handleCopy = () => {
    if (!payer || !data.payment.methods[0]) return
    const method = data.payment.methods[0]
    const text = `Bayar ${data.merchant}\nNominal: ${formatIDR(selectedAmount)}\nTransfer ke ${method.provider} ${method.number} a.n. ${method.holder}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-dark-canvas pb-28 pt-4 px-4 flex flex-col items-center">
      <div className="max-w-[480px] w-full flex flex-col gap-4">
        {/* Header Ticket Card */}
        <div className="relative bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-3 mb-3">
            <div>
              <span className="text-xs font-mono text-primary font-bold uppercase">Split Bill</span>
              <h1 className="text-xl font-bold text-on-surface">{data.merchant}</h1>
              {data.date && <p className="text-xs text-on-surface-variant">{data.date}</p>}
            </div>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant block">Total Struk</span>
              <span className="font-mono text-lg font-bold text-on-surface">{formatIDR(data.total)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Ditalangin oleh: <strong className="text-on-surface">{payer.name}</strong></span>
            {unpaid > 0 ? (
              <span className="text-error font-medium font-mono">Belum lunas: {formatIDR(unpaid)}</span>
            ) : (
              <span className="text-primary font-medium font-mono">Semua Lunas 🎉</span>
            )}
          </div>
        </div>

        {/* Member Selector: "Kamu yang mana?" */}
        <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Kamu yang mana?
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {data.members.map((m) => {
              const isSelected = m.id === selectedMemberId
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container dark:bg-slate-800 text-on-surface'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.name[0]?.toUpperCase()}
                  </span>
                  <span>{m.name}</span>
                  {m.is_payer && <span className="text-[10px] opacity-75">(Penalang)</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Member Pay Card */}
        {selectedMember && (
          <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-on-surface-variant">
                  {selectedMember.is_payer ? 'Bagianmu (Penalang):' : `${selectedMember.name}, kamu perlu bayar:`}
                </span>
                <div className="font-mono text-2xl font-bold text-primary">
                  {formatIDR(selectedAmount)}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isSettled
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-error-container text-on-error-container'
                }`}
              >
                {selectedMember.is_payer ? 'Penalang' : isSettled ? 'Lunas' : 'Belum Lunas'}
              </span>
            </div>

            {/* Breakdown for receipt mode */}
            {data.mode === 'receipt' && (
              <div className="bg-surface-container-low dark:bg-slate-900 rounded-xl p-3 text-xs flex flex-col gap-1.5">
                <span className="font-semibold text-on-surface-variant">Rincian Pesanan:</span>
                {data.items.map((item) => {
                  const itemShare = memberItemDetails[selectedMember.id]?.[item.id] || 0
                  if (itemShare === 0) return null
                  return (
                    <div key={item.id} className="flex justify-between font-mono text-on-surface">
                      <span>{item.name}</span>
                      <span>{formatIDR(itemShare)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Payment Methods */}
        {data.payment.methods.length > 0 && (
          <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-on-surface">Info Pembayaran</h3>
            {data.payment.methods.map((pm, idx) => {
              const isRevealed = showFullAccount[idx]
              const maskedNumber = pm.number.length > 4 ? `•••• •••• ${pm.number.slice(-4)}` : pm.number
              return (
                <div key={idx} className="bg-surface-container-low dark:bg-slate-900 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-on-surface uppercase block">{pm.provider} ({pm.kind})</span>
                    <button
                      onClick={() => setShowFullAccount((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                      className="font-mono text-primary font-medium hover:underline text-left"
                    >
                      {isRevealed ? pm.number : maskedNumber} <span className="text-[10px] opacity-70">(Ketuk untuk {isRevealed ? 'tutup' : 'buka'})</span>
                    </button>
                    <span className="text-on-surface-variant block">a.n. {pm.holder}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pm.number)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="px-3 py-1.5 bg-surface-container text-on-surface rounded-lg font-medium hover:bg-surface-container-high"
                  >
                    Salin No
                  </button>
                </div>
              )
            })}
            {data.payment.note && (
              <p className="text-xs text-on-surface-variant italic bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                Catatan: {data.payment.note}
              </p>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="text-[11px] text-center text-outline">
          Pembayaran dilakukan di luar aplikasi ini. Status lunas ditandai oleh pembuat.
        </p>
      </div>

      {/* Sticky Bottom Bar */}
      {selectedMember && !selectedMember.is_payer && (
        <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-surface/90 dark:bg-dark-canvas/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex gap-2 z-30">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
          >
            {copied ? 'Tersalin! ✓' : `Salin Transfer ${formatIDR(selectedAmount)}`}
          </button>
        </div>
      )}
    </main>
  )
}
