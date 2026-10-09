import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { AccountView } from '@/components/account/AccountView'
import { listFriendsAction } from '@/lib/actions/account-actions'
import { listBillsByOwner } from '@/lib/bills'
import { scanQuotas } from '@/lib/scan-guard'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function AccountPage() {
  const user = await getUser()
  const quotas = scanQuotas()

  const [friends, bills] = user ? await Promise.all([listFriendsAction(), listBillsByOwner(user.id)]) : [[], []]

  return (
    <AppShell>
      <h1 className="text-xl font-bold text-on-surface mb-4">Pengaturan</h1>
      <AccountView
        profile={
          user
            ? {
                name: (user.user_metadata?.full_name as string | undefined) ?? null,
                email: user.email ?? null,
                billCount: bills.length,
              }
            : null
        }
        initialFriends={friends}
        guestQuota={quotas.perDayGuest}
        userQuota={quotas.perDayUser}
      />
    </AppShell>
  )
}
