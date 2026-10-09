import { AppShell } from '@/components/AppShell'
import { HistorySkeleton } from '@/components/HistoryList'

export default function Loading() {
  return (
    <AppShell>
      <h1 className="text-xl font-bold text-on-surface mb-4">Riwayat</h1>
      <HistorySkeleton rows={4} />
    </AppShell>
  )
}
