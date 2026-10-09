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
}

/** Manage page for account-owned bills: ownership is checked on the server, no token in the URL. */
export default async function OwnerManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect(`/masuk?next=${encodeURIComponent(`/b/${id}/kelola`)}`)

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
  if (found.status !== 'ok' || manageAccess(found.row, null, user.id) !== 'owner') {
    return (
      <StatusPage
        icon="🔑"
        title="Kamu tidak punya akses"
        body="Split bill ini tidak ada di akunmu, atau sudah dihapus."
      />
    )
  }

  return (
    <AppShell nav={false} width="wide">
      <ManageView bill={await toBillView(found.row)} token={null} />
    </AppShell>
  )
}
