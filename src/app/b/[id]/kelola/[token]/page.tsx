import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { StatusPage } from '@/components/StatusPage'
import { ManageView } from '@/components/bill/ManageView'
import { findBill, manageAccess, toBillView } from '@/lib/bills'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kelola split bill',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function TokenManagePage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params
  const found = await findBill(id)

  if (found.status === 'expired') {
    return (
      <StatusPage
        icon="⌛"
        title="Split bill ini sudah kedaluwarsa"
        body="Data bill dihapus otomatis setelah 90 hari."
      />
    )
  }
  if (found.status === 'error') {
    return <StatusPage icon="🛠️" title="Lagi ada gangguan" body="Coba buka lagi sebentar lagi." />
  }

  // A missing bill and a wrong token look the same, so the link leaks nothing.
  const access = found.status === 'ok' ? manageAccess(found.row, token, null) : null
  if (found.status !== 'ok' || access !== 'token') {
    if (found.status === 'ok') {
      const user = await getUser()
      // Claimed bill opened through its retired secret link by its owner.
      if (manageAccess(found.row, null, user?.id) === 'owner') redirect(`/b/${id}/kelola`)
    }
    return (
      <StatusPage
        icon="🔑"
        title="Link ini tidak valid"
        body="Link kelola salah, sudah dipindahkan ke akun, atau split bill-nya sudah dihapus."
      />
    )
  }

  return (
    <AppShell nav={false} width="wide">
      <ManageView bill={await toBillView(found.row)} token={token} />
    </AppShell>
  )
}
