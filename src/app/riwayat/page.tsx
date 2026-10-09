import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { HistoryList } from '@/components/HistoryList'
import { GuestHistory, LocalClaimHint } from '@/components/account/GuestHistory'
import { listBillsByOwner } from '@/lib/bills'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Riwayat' }

export default async function HistoryPage() {
  const user = await getUser()

  if (!user) {
    return (
      <AppShell>
        <h1 className="text-xl font-bold text-on-surface mb-4">Riwayat</h1>
        <GuestHistory />
      </AppShell>
    )
  }

  const bills = await listBillsByOwner(user.id)
  return (
    <AppShell>
      <h1 className="text-xl font-bold text-on-surface mb-4">Riwayat</h1>
      <LocalClaimHint />
      {bills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant p-8 text-center flex flex-col items-center gap-2">
          <span className="text-3xl" aria-hidden>
            🧾
          </span>
          <p className="text-sm font-semibold text-on-surface">Belum ada split bill di akunmu</p>
          <p className="text-xs text-on-surface-variant">
            Split bill yang kamu buat setelah masuk akan tersimpan di sini dan bisa dibuka dari perangkat mana pun.
          </p>
        </div>
      ) : (
        <HistoryList entries={bills.map((b) => ({ ...b, href: `/b/${b.id}/kelola` }))} />
      )}
    </AppShell>
  )
}
