'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { MemberAvatar } from '@/components/baru/MemberChip'
import { summarizeBill } from '@/lib/breakdown'
import type { BillView as BillViewData } from '@/lib/bills'
import { formatDate } from '@/lib/format'
import { getPickedMember, setPickedMember } from '@/lib/local-store'
import { formatIDR } from '@/lib/money'
import { cn } from '@/lib/utils'
import { BillTicket, BreakdownList, PaymentCard, StatusChip, useCopied } from './parts'

export function BillView({ bill }: { bill: BillViewData }) {
  const { data } = bill
  const summary = useMemo(() => summarizeBill(data), [data])
  const payer = data.members.find((m) => m.is_payer) ?? data.members[0]

  const [meId, setMeId] = useState<string | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [copied, copy] = useCopied()

  useEffect(() => {
    const saved = getPickedMember(bill.id)
    if (saved && data.members.some((m) => m.id === saved)) setMeId(saved)
  }, [bill.id, data.members])

  const pick = (id: string) => {
    setMeId(id)
    setPickedMember(bill.id, id)
    setOpen((prev) => ({ ...prev, [id]: true }))
  }

  const me = data.members.find((m) => m.id === meId) ?? null
  const myAmount = me ? (summary.memberTotals[me.id] ?? 0) : 0
  const mySettled = !!me && (me.is_payer || !!me.paid_at)
  const hasDetails = data.mode === 'receipt'
  const firstMethod = data.payment.methods[0]
  const allSettled = summary.unpaid === 0

  const copyPayment = () => {
    if (!me || !firstMethod) return
    const lines = [
      `Bayar split bill ${data.merchant}`,
      `Nominal: ${formatIDR(myAmount)}`,
      `${firstMethod.provider} ${firstMethod.number}`.trim() +
        (firstMethod.holder ? ` a.n. ${firstMethod.holder}` : ''),
    ]
    copy('pay', lines.join('\n'))
  }

  const reportIssue = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    copy(
      'issue',
      `Hai ${payer.name}, sepertinya ada yang perlu dicek di split bill ${data.merchant}${
        me ? ` (bagian ${me.name})` : ''
      }: ${url}`,
    )
  }

  const showStickyBar = !!me && !mySettled && !!firstMethod

  return (
    <div className={cn('lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start', showStickyBar && 'pb-20 lg:pb-0')}>
      <div className="flex flex-col gap-4">
        <BillTicket data={data} unpaid={summary.unpaid} />

        {allSettled && (
          <div className="bg-secondary-container/50 text-on-secondary-container rounded-2xl p-4 text-sm font-semibold text-center">
            🎉 Semua sudah lunas. Makasih ya!
          </div>
        )}

        {me && (
          <section
            aria-live="polite"
            className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border-2 border-primary/40 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <span className="text-xs text-on-surface-variant block">
                {me.is_payer
                  ? 'Kamu yang nalangin. Bagianmu sendiri'
                  : mySettled
                    ? `${me.name}, bagianmu sudah lunas`
                    : `${me.name}, kamu perlu bayar`}
              </span>
              <span className="font-mono text-3xl font-bold text-primary">{formatIDR(myAmount)}</span>
              {!me.is_payer && !mySettled && (
                <span className="text-xs text-on-surface-variant block mt-0.5">ke {payer.name}</span>
              )}
            </div>
            <StatusChip settled={mySettled} payer={me.is_payer} />
          </section>
        )}

        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-on-surface">Kamu yang mana?</h2>
          <div className="flex flex-wrap gap-2">
            {data.members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pick(m.id)}
                aria-pressed={m.id === meId}
                className={cn(
                  'inline-flex items-center gap-1.5 pl-1.5 pr-3 h-10 rounded-full text-xs font-semibold transition-colors',
                  m.id === meId ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface',
                )}
              >
                <MemberAvatar member={m} />
                {m.name}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-2xl p-2 shadow-sm border border-outline-variant/30 flex flex-col">
          {data.members.map((m) => {
            const amount = summary.memberTotals[m.id] ?? 0
            const settled = m.is_payer || !!m.paid_at
            const isMe = m.id === meId
            const expanded = !!open[m.id]
            return (
              <div key={m.id} className={cn('rounded-xl px-3 py-2.5', isMe && 'bg-secondary-container/30')}>
                <div className="flex items-center gap-3">
                  <MemberAvatar member={m} className="w-8 h-8 text-sm" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-on-surface block truncate">
                      {m.name}
                      {isMe && <span className="text-primary"> (Kamu)</span>}
                    </span>
                    {hasDetails && (
                      <button
                        type="button"
                        onClick={() => setOpen((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                        aria-expanded={expanded}
                        className="text-[11px] text-on-surface-variant underline underline-offset-2 py-1"
                      >
                        Rincian pesanan {expanded ? '▴' : '▾'}
                      </button>
                    )}
                  </div>
                  <span className="font-mono text-sm font-bold text-on-surface shrink-0">{formatIDR(amount)}</span>
                  <StatusChip settled={settled} payer={m.is_payer} />
                </div>
                {hasDetails && expanded && (
                  <div className="mt-2 ml-11 bg-surface-container-low rounded-xl p-3">
                    <BreakdownList lines={summary.memberLines[m.id] ?? []} total={amount} />
                  </div>
                )}
              </div>
            )
          })}
          {hasDetails && (
            <p className="text-[11px] text-on-surface-variant px-3 py-2">
              Diskon, pajak, dan biaya lain dibagi sesuai porsi pesanan masing-masing.
              {data.fees.tax_included && data.fees.tax > 0 && ' Harga sudah termasuk pajak.'}
            </p>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-4 mt-4 lg:mt-0">
        <PaymentCard payment={data.payment} qrisUrl={bill.qrisUrl} masked />

        <div className="text-[11px] text-on-surface-variant text-center flex flex-col gap-1 px-2">
          <p>Pembayaran dilakukan di luar aplikasi ini. Status lunas ditandai oleh pembuat.</p>
          <p>Berlaku sampai {formatDate(bill.expires_at)}.</p>
          <button
            type="button"
            onClick={reportIssue}
            className="self-center text-primary font-semibold py-2 underline underline-offset-2"
          >
            {copied === 'issue' ? 'Pesan tersalin, kirim ke pembuat ya' : 'Ada yang salah? Hubungi pembuat'}
          </button>
        </div>

        {showStickyBar && (
          <button
            type="button"
            onClick={copyPayment}
            className="hidden lg:block w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md"
          >
            {copied === 'pay' ? 'Tersalin ✓' : `Salin nomor & nominal ${formatIDR(myAmount)}`}
          </button>
        )}
      </div>

      {showStickyBar && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-outline-variant/40 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto max-w-[480px] p-3">
            <button
              type="button"
              onClick={copyPayment}
              className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md"
            >
              {copied === 'pay' ? 'Tersalin ✓' : `Salin nomor & nominal ${formatIDR(myAmount)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
