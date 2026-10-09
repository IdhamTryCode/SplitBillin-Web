'use client'

import React, { useState } from 'react'
import { TicketCard, TicketNotchDivider } from '@/components/TicketCard'
import type { BreakdownLine } from '@/lib/breakdown'
import { formatDate } from '@/lib/format'
import { formatIDR } from '@/lib/money'
import type { BillData, PaymentInfo } from '@/lib/schemas'
import { cn } from '@/lib/utils'

/** Copy to the clipboard; falls back to a hidden textarea on older browsers. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      el.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** Short-lived "Tersalin" feedback keyed by whatever was copied. */
export function useCopied(): [string | null, (key: string, text: string) => void] {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (key: string, text: string) => {
    void copyText(text).then((ok) => {
      if (!ok) return
      setCopied(key)
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 2000)
    })
  }
  return [copied, copy]
}

export function maskNumber(number: string): string {
  const compact = number.replace(/\s+/g, '')
  return compact.length > 4 ? `•••• •••• ${compact.slice(-4)}` : compact
}

const KIND_LABEL: Record<PaymentInfo['methods'][number]['kind'], string> = {
  bank: 'Bank',
  ewallet: 'E-wallet',
  other: 'Lainnya',
}

export function StatusChip({ settled, payer }: { settled: boolean; payer?: boolean }) {
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0',
        payer
          ? 'bg-surface-container text-on-surface-variant'
          : settled
            ? 'bg-secondary-container text-on-secondary-container'
            : 'bg-error-container text-on-error-container',
      )}
    >
      {payer ? 'Nalangin' : settled ? 'Lunas' : 'Belum'}
    </span>
  )
}

interface BillTicketProps {
  data: BillData
  unpaid: number
  children?: React.ReactNode
}

/** Ticket header shared by the member page and the manage page. */
export function BillTicket({ data, unpaid, children }: BillTicketProps) {
  const payer = data.members.find((m) => m.is_payer) ?? data.members[0]
  return (
    <TicketCard>
      <div className="px-5 pt-5 flex items-start gap-3">
        <span
          className="w-11 h-11 rounded-2xl bg-secondary-container/60 flex items-center justify-center text-xl shrink-0"
          aria-hidden
        >
          {data.mode === 'receipt' ? '🧾' : '🧮'}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-on-surface leading-tight break-words">{data.merchant}</h1>
          {data.date && <p className="text-xs text-on-surface-variant mt-0.5">{formatDate(data.date)}</p>}
        </div>
      </div>

      <TicketNotchDivider />

      <div className="px-5 pb-5 flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-xs text-on-surface-variant block">Total split bill</span>
            <span className="font-mono text-2xl font-bold text-on-surface">{formatIDR(data.total)}</span>
          </div>
          {unpaid > 0 ? (
            <span className="text-right text-xs font-semibold text-error">
              <span className="font-mono text-sm block">{formatIDR(unpaid)}</span>
              belum dibayar
            </span>
          ) : (
            <span className="text-xs font-semibold text-primary">Semua sudah lunas</span>
          )}
        </div>
        <p className="text-xs text-on-surface-variant">
          Dibayar ke: <strong className="text-on-surface">{payer.name}</strong>
        </p>
        {data.updated_at && (
          <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-lg px-2.5 py-1.5">
            Split bill ini diperbarui sama yang bikin ({formatDate(data.updated_at)}).
          </p>
        )}
        {children}
      </div>
    </TicketCard>
  )
}

/** "Rincian pesanan" for one member. Lines add up to `total`. */
export function BreakdownList({ lines, total }: { lines: BreakdownLine[]; total: number }) {
  if (lines.length === 0) {
    return <p className="text-xs text-on-surface-variant">Tidak ada pesanan yang ditandai untuk orang ini.</p>
  }
  return (
    <div className="flex flex-col gap-1.5 text-xs">
      {lines.map((line, idx) => (
        <div key={idx} className="flex items-start justify-between gap-3">
          <span className={cn('min-w-0', line.kind === 'item' ? 'text-on-surface' : 'text-on-surface-variant')}>
            <span className="break-words">{line.label}</span>
            {line.note && <span className="text-on-surface-variant"> · {line.note}</span>}
          </span>
          <span
            className={cn(
              'font-mono shrink-0',
              line.amount < 0 ? 'text-primary' : line.kind === 'item' ? 'text-on-surface' : 'text-on-surface-variant',
            )}
          >
            {formatIDR(line.amount)}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-dashed border-outline-variant font-semibold text-on-surface">
        <span>Jumlah</span>
        <span className="font-mono">{formatIDR(total)}</span>
      </div>
    </div>
  )
}

interface PaymentCardProps {
  payment: PaymentInfo
  qrisUrl: string | null
  /** The manage page shows numbers in full; the member page masks them until tapped. */
  masked: boolean
}

export function PaymentCard({ payment, qrisUrl, masked }: PaymentCardProps) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [zoom, setZoom] = useState(false)
  const [copied, copy] = useCopied()

  if (payment.methods.length === 0 && !qrisUrl && !payment.note) {
    return (
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30">
        <h2 className="text-sm font-bold text-on-surface">Cara bayar</h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Pembuat belum mengisi info pembayaran. Tanyakan langsung ke yang nalangin.
        </p>
      </section>
    )
  }

  return (
    <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
      <h2 className="text-sm font-bold text-on-surface">Cara bayar</h2>

      {payment.methods.map((pm, idx) => {
        const show = !masked || revealed[idx]
        return (
          <div key={idx} className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold text-on-surface block">
                {pm.provider || KIND_LABEL[pm.kind]}
                <span className="font-normal text-on-surface-variant"> · {KIND_LABEL[pm.kind]}</span>
              </span>
              {masked ? (
                <button
                  type="button"
                  onClick={() => setRevealed((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                  aria-label={show ? 'Sembunyikan nomor' : 'Tampilkan nomor lengkap'}
                  className="font-mono text-sm text-on-surface py-1.5 text-left"
                >
                  {show ? pm.number : maskNumber(pm.number)}{' '}
                  <span className="font-sans text-[11px] text-primary font-semibold">{show ? 'Tutup' : 'Lihat'}</span>
                </button>
              ) : (
                <span className="font-mono text-sm text-on-surface block py-1">{pm.number}</span>
              )}
              {pm.holder && <span className="text-[11px] text-on-surface-variant block">a.n. {pm.holder}</span>}
            </div>
            <button
              type="button"
              onClick={() => copy(`n${idx}`, pm.number)}
              className="shrink-0 px-3 h-10 bg-surface-container text-on-surface rounded-lg text-xs font-semibold"
            >
              {copied === `n${idx}` ? 'Tersalin' : 'Salin nomor'}
            </button>
          </div>
        )
      })}

      {qrisUrl && (
        <div className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
          <button
            type="button"
            onClick={() => setZoom(true)}
            aria-label="Perbesar QRIS"
            className="w-20 h-20 rounded-lg overflow-hidden bg-white shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
          </button>
          <div className="flex flex-col gap-1.5 text-xs">
            <span className="font-bold text-on-surface">QRIS</span>
            <button type="button" onClick={() => setZoom(true)} className="text-primary font-semibold text-left py-1">
              Perbesar
            </button>
            <a href={qrisUrl} download="qris" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold py-1">
              Unduh gambar
            </a>
          </div>
        </div>
      )}

      {payment.note && (
        <p className="text-xs text-on-surface bg-amber-100/70 dark:bg-amber-950/40 rounded-xl p-3 whitespace-pre-wrap break-words">
          <span className="font-semibold">Catatan: </span>
          {payment.note}
        </p>
      )}

      {zoom && qrisUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QRIS"
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4 gap-4"
        >
          <button type="button" aria-label="Tutup" onClick={() => setZoom(false)} className="absolute inset-0" />
          <div className="relative bg-white rounded-2xl p-3 max-w-sm w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrisUrl} alt="QRIS" className="w-full h-auto max-h-[70dvh] object-contain" />
          </div>
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="relative px-6 py-3 rounded-xl bg-surface-container-lowest text-on-surface text-sm font-semibold"
          >
            Tutup
          </button>
        </div>
      )}
    </section>
  )
}
