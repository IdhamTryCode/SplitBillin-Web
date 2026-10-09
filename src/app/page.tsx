import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { HomeContent, HomeJsonLd } from '@/components/HomeContent'
import { DraftChip, HomeHistory } from '@/components/HomeLocal'

export const metadata: Metadata = { alternates: { canonical: '/' } }

const CHOICES = [
  {
    href: '/baru?mode=scan',
    icon: '📸',
    title: 'Hitung otomatis pake struk',
    description: 'Foto struk atau ambil dari galeri, biar kami bantu itungin.',
  },
  {
    href: '/baru?mode=manual',
    icon: '🧮',
    title: 'Atur jumlahnya sendiri',
    description: 'Lebih cepat buat bagi rata, gak usah pake struk.',
  },
]

export default function Home() {
  return (
    <AppShell width="wide">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 pt-1">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-on-surface">
              Split bill tanpa ribet.
            </h1>
            <p className="text-sm text-on-surface-variant">
              Bagi tagihan makan bareng teman: foto struk, hitung otomatis, bagikan satu link. Gratis dan bebas
              dipakai tanpa daftar.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {CHOICES.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex items-start gap-4 active:scale-[0.99] transition-transform"
              >
                <span
                  className="w-12 h-12 rounded-2xl bg-secondary-container/50 flex items-center justify-center text-2xl shrink-0"
                  aria-hidden
                >
                  {c.icon}
                </span>
                <span className="flex-1">
                  <span className="block font-bold text-on-surface">{c.title}</span>
                  <span className="block text-xs text-on-surface-variant mt-1">{c.description}</span>
                </span>
              </Link>
            ))}
          </div>

          <DraftChip />

          <p className="text-[11px] text-on-surface-variant">
            Gratis. Foto struk tidak disimpan oleh SplitBillin.{' '}
            <Link href="/tentang" className="text-primary font-semibold underline underline-offset-2">
              Cara kerjanya
            </Link>
          </p>
        </div>

        <HomeHistory />
      </div>

      <HomeContent />
      <HomeJsonLd />
    </AppShell>
  )
}
