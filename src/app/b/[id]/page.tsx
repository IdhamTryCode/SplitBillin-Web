import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { StatusPage } from '@/components/StatusPage'
import { BillView } from '@/components/bill/BillView'
import { findBill, toBillView } from '@/lib/bills'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rincian split bill',
  robots: { index: false, follow: false },
}

export default async function MemberBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await findBill(id)

  if (found.status === 'expired') {
    return (
      <StatusPage
        icon="⌛"
        title="Split bill ini sudah kedaluwarsa"
        body="Data bill dihapus otomatis setelah 90 hari. Minta pembuatnya membuat split bill baru kalau masih perlu."
      />
    )
  }
  if (found.status === 'error') {
    return (
      <StatusPage
        icon="🛠️"
        title="Lagi ada gangguan"
        body="Split bill belum bisa dimuat. Coba buka lagi sebentar lagi."
      />
    )
  }

  if (found.status !== 'ok') return notFound()

  return (
    <AppShell nav={false} width="wide">
      <BillView bill={await toBillView(found.row)} />
    </AppShell>
  )
}
