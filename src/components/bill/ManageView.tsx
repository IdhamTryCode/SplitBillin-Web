'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BottomSheet } from '@/components/baru/BottomSheet'
import { MemberAvatar } from '@/components/baru/MemberChip'
import {
  claimBillAction,
  deleteBillAction,
  extendBillAction,
  togglePaidStatusAction,
} from '@/lib/actions/bill-actions'
import { summarizeBill } from '@/lib/breakdown'
import type { BillView } from '@/lib/bills'
import { formatDate, formatDateTime } from '@/lib/format'
import { removeLocalBill, saveLocalBill } from '@/lib/local-store'
import { formatIDR } from '@/lib/money'
import { useUser } from '@/lib/use-user'
import { BillTicket, BreakdownList, PaymentCard, useCopied } from './parts'

interface ManageViewProps {
  bill: BillView
  /** Secret manage token (guest link), or null when managing through the account. */
  token: string | null
}

export function ManageView({ bill: initial, token }: ManageViewProps) {
  const router = useRouter()
  const { user, ready } = useUser()
  const [bill, setBill] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [origin, setOrigin] = useState('')
  const [copied, copy] = useCopied()

  useEffect(() => setOrigin(window.location.origin), [])

  // Keep this bill reachable from Beranda on the device that opened the secret link.
  useEffect(() => {
    if (!token) return
    saveLocalBill({
      id: initial.id,
      token,
      merchant: initial.data.merchant,
      total: initial.data.total,
      createdAt: initial.created_at,
    })
  }, [initial, token])

  const { data } = bill
  const summary = useMemo(() => summarizeBill(data), [data])
  const publicUrl = `${origin}/b/${bill.id}`
  const hasDetails = data.mode === 'receipt'

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    setError(null)
    setNotice(null)
    try {
      await fn()
    } catch {
      setError('Koneksi bermasalah. Coba lagi.')
    } finally {
      setBusy(null)
    }
  }

  const togglePaid = (memberId: string) =>
    run(`paid:${memberId}`, async () => {
      const res = await togglePaidStatusAction(bill.id, token, memberId)
      if (!res.ok) return setError(res.error)
      setBill((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          members: prev.data.members.map((m) => (m.id === memberId ? { ...m, paid_at: res.paidAt } : m)),
        },
      }))
    })

  const extend = () =>
    run('extend', async () => {
      const res = await extendBillAction(bill.id, token)
      if (!res.ok) return setError(res.error)
      setBill((prev) => ({ ...prev, expires_at: res.expiresAt }))
      setNotice(`Diperpanjang sampai ${formatDate(res.expiresAt)}.`)
    })

  const remove = () =>
    run('delete', async () => {
      const res = await deleteBillAction(bill.id, token)
      if (!res.ok) {
        setConfirmDelete(false)
        return setError(res.error)
      }
      removeLocalBill(bill.id)
      router.replace('/')
    })

  const claim = () =>
    run('claim', async () => {
      if (!token) return
      const res = await claimBillAction(bill.id, token)
      if (!res.ok) return setError(res.error)
      removeLocalBill(bill.id)
      router.replace(`/b/${bill.id}/kelola`)
    })

  const edit = () => {
    try {
      window.sessionStorage.setItem('sb:edit', JSON.stringify({ id: bill.id, token }))
    } catch {
      /* the wizard falls back to account access */
    }
    router.push(`/baru?edit=${bill.id}`)
  }

  const managePath = token ? `/b/${bill.id}/kelola/${token}` : `/b/${bill.id}/kelola`

  return (
    <div className="flex flex-col gap-4">
      {token ? (
        <div className="bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200">
          🔒 <strong>Kamu sedang di halaman kelola.</strong> Jangan bagikan link ini.
        </div>
      ) : (
        <div className="bg-secondary-container/40 rounded-xl p-3 text-xs text-on-secondary-container">
          ✓ Split bill ini tersimpan di akunmu.
        </div>
      )}

      {token && ready && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2">
          <h2 className="text-sm font-bold text-on-surface">Masukkan split bill ini ke akunmu</h2>
          <p className="text-xs text-on-surface-variant">
            Biar gak perlu simpan link rahasia ini dan bisa dibuka dari perangkat mana pun.
            {user && ' Setelah itu link rahasia ini tidak berlaku lagi.'}
          </p>
          {user ? (
            <button
              type="button"
              onClick={claim}
              disabled={busy !== null}
              className="self-start px-4 h-11 bg-primary text-on-primary rounded-xl text-xs font-semibold disabled:opacity-60"
            >
              {busy === 'claim' ? 'Menyimpan…' : 'Simpan ke akunku'}
            </button>
          ) : (
            <Link
              href={`/masuk?next=${encodeURIComponent(managePath)}`}
              className="self-start px-4 h-11 flex items-center bg-surface-container text-on-surface rounded-xl text-xs font-semibold"
            >
              Masuk dengan Google
            </Link>
          )}
        </section>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <BillTicket data={data} unpaid={summary.unpaid}>
            <div className="flex items-center justify-between text-xs bg-surface-container-low rounded-lg px-3 py-2">
              <span className="text-on-surface-variant">
                {summary.settledCount} dari {data.members.length} orang lunas
              </span>
              <span className="text-on-surface-variant">
                Sisa <span className="font-mono font-bold text-on-surface">{formatIDR(summary.unpaid)}</span>
              </span>
            </div>
          </BillTicket>

          {error && (
            <div role="alert" className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="bg-secondary-container/50 text-on-secondary-container p-3 rounded-xl text-xs">
              {notice}
            </div>
          )}

          <section className="bg-surface-container-lowest rounded-2xl p-2 shadow-sm border border-outline-variant/30 flex flex-col">
            <h2 className="text-sm font-bold text-on-surface px-3 pt-2 pb-1">Anggota</h2>
            {data.members.map((m) => {
              const amount = summary.memberTotals[m.id] ?? 0
              const settled = m.is_payer || !!m.paid_at
              const expanded = !!open[m.id]
              const waText = encodeURIComponent(
                `Hai ${m.name}, bagianmu di ${data.merchant} ${formatIDR(amount)}. Detail: ${publicUrl}`,
              )
              return (
                <div key={m.id} className="px-3 py-3 border-t border-outline-variant/30 first:border-t-0">
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={m} className="w-8 h-8 text-sm" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-on-surface block truncate">{m.name}</span>
                      <span className="text-[11px] text-on-surface-variant block">
                        {m.is_payer
                          ? 'Yang nalangin · otomatis lunas'
                          : m.paid_at
                            ? `Lunas · ${formatDateTime(m.paid_at)}`
                            : 'Belum bayar'}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold text-on-surface shrink-0">{formatIDR(amount)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 ml-11">
                    {!m.is_payer && (
                      <button
                        type="button"
                        onClick={() => togglePaid(m.id)}
                        disabled={busy !== null}
                        aria-pressed={settled}
                        className={`px-3 h-10 rounded-lg text-xs font-semibold disabled:opacity-60 ${
                          settled
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-primary text-on-primary'
                        }`}
                      >
                        {busy === `paid:${m.id}` ? '…' : settled ? 'Lunas ✓ · batalkan' : 'Tandai lunas'}
                      </button>
                    )}
                    {!m.is_payer && !settled && (
                      <a
                        href={`https://wa.me/?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 h-10 flex items-center bg-surface-container text-on-surface rounded-lg text-xs font-semibold"
                      >
                        Tagih via WA
                      </a>
                    )}
                    {hasDetails && (
                      <button
                        type="button"
                        onClick={() => setOpen((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                        aria-expanded={expanded}
                        className="px-1 h-10 text-[11px] text-on-surface-variant underline underline-offset-2"
                      >
                        Rincian {expanded ? '▴' : '▾'}
                      </button>
                    )}
                  </div>

                  {hasDetails && expanded && (
                    <div className="mt-2 ml-11 bg-surface-container-low rounded-xl p-3">
                      <BreakdownList lines={summary.memberLines[m.id] ?? []} total={amount} />
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <PaymentCard payment={data.payment} qrisUrl={bill.qrisUrl} masked={false} />

          <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => copy('link', publicUrl)}
              className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm"
            >
              {copied === 'link' ? 'Link anggota tersalin ✓' : 'Salin link untuk anggota'}
            </button>
            <Link
              href={`/b/${bill.id}`}
              className="w-full py-3 text-center bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
            >
              Lihat tampilan anggota
            </Link>
            <button
              type="button"
              onClick={edit}
              className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
            >
              Edit split bill
            </button>
            <button
              type="button"
              onClick={extend}
              disabled={busy !== null}
              className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm disabled:opacity-60"
            >
              {busy === 'extend' ? 'Memperpanjang…' : 'Perpanjang masa berlaku'}
            </button>
            <p className="text-[11px] text-on-surface-variant text-center">
              Berlaku sampai {formatDate(bill.expires_at)}. Setelah itu dihapus otomatis.
            </p>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-3 text-error font-semibold rounded-xl text-sm"
            >
              Hapus split bill
            </button>
          </section>
        </div>
      </div>

      <BottomSheet open={confirmDelete} title="Hapus split bill ini?" onClose={() => setConfirmDelete(false)}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-on-surface">
            <strong>{data.merchant}</strong> ({formatIDR(data.total)}) akan dihapus permanen. Link yang sudah kamu
            bagikan ke teman tidak bisa dibuka lagi. Ini tidak bisa dibatalkan.
          </p>
          <button
            type="button"
            onClick={remove}
            disabled={busy !== null}
            className="w-full py-3 bg-error text-on-error font-semibold rounded-xl text-sm disabled:opacity-60"
          >
            {busy === 'delete' ? 'Menghapus…' : 'Ya, hapus permanen'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
          >
            Batal
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
