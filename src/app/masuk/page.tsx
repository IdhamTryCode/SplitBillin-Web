import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { GoogleSignInButton } from '@/components/account/GoogleSignInButton'
import { scanQuotas } from '@/lib/scan-guard'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Masuk', robots: { index: false, follow: false } }

function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/'
  return next
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const next = safeNext(params.next)
  if (await getUser()) redirect(next)

  const quotas = scanQuotas()

  return (
    <AppShell nav={false}>
      <div className="mt-6 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-center items-center">
          <span
            className="w-14 h-14 rounded-2xl bg-secondary-container/60 flex items-center justify-center text-2xl"
            aria-hidden
          >
            👋
          </span>
          <h1 className="text-xl font-bold text-on-surface">Masuk ke SplitBillin</h1>
          <p className="text-sm text-on-surface-variant">Gak wajib kok, kamu tetap bisa pakai tanpa akun.</p>
        </div>

        {params.error && (
          <div role="alert" className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">
            Gagal masuk. Coba lagi ya.
          </div>
        )}

        <GoogleSignInButton next={next} />

        <ul className="flex flex-col gap-2 text-xs text-on-surface-variant">
          <li>• Riwayat split bill tersimpan dan bisa dibuka dari perangkat mana pun.</li>
          <li>• Kelola bill tanpa perlu menyimpan link rahasia.</li>
          <li>• Kuota scan struk lebih longgar: {quotas.perDayUser} scan per hari.</li>
        </ul>

        <div className="bg-surface-container-low rounded-xl p-3 text-[11px] text-on-surface-variant flex flex-col gap-1">
          <p>
            <strong className="text-on-surface">Yang kami simpan:</strong> nama dan email dari akun Google-mu, split
            bill yang kamu buat, dan nama teman yang kamu simpan.
          </p>
          <p>Foto struk tidak disimpan oleh SplitBillin. Akun bisa dihapus kapan saja beserta semua datanya.</p>
        </div>

        <p className="text-[11px] text-on-surface-variant text-center">
          Dengan masuk, kamu menyetujui{' '}
          <Link href="/ketentuan" className="text-primary underline underline-offset-2">
            Ketentuan
          </Link>{' '}
          dan{' '}
          <Link href="/privasi" className="text-primary underline underline-offset-2">
            Kebijakan Privasi
          </Link>
          .
        </p>
      </div>

      <Link href={next} className="block text-center text-xs text-on-surface-variant font-semibold py-4">
        Lanjut tanpa akun
      </Link>
    </AppShell>
  )
}
