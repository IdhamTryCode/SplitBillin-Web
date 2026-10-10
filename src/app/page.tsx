import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { HomeContent, HomeJsonLd } from '@/components/HomeContent'
import { DraftChip, HomeHistory } from '@/components/HomeLocal'

export const metadata: Metadata = { alternates: { canonical: '/' } }

export default function Home() {
  return (
    <AppShell width="wide">
      {/* Desktop centres the landing content in one readable column instead of
          a lopsided two-column grid; mobile layout is unchanged (lg: only). */}
      <div className="flex flex-col gap-6 lg:gap-10 lg:max-w-2xl lg:mx-auto lg:w-full">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 pt-1 lg:items-center lg:text-center lg:pt-6">
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-on-surface">
              Split bill gratis, tanpa ribet.
            </h1>
            <p className="text-sm lg:text-base text-on-surface-variant lg:max-w-md">
              Bagi tagihan makan bareng teman: foto struk, hitung otomatis, bagikan satu link.
            </p>
            <ul className="flex flex-wrap gap-2 pt-1 lg:justify-center" aria-label="Keunggulan">
              {['100% gratis', 'Tanpa daftar', 'Tanpa iklan'].map((label) => (
                <li
                  key={label}
                  className="px-3 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container text-xs font-semibold"
                >
                  ✓ {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            {/* Primary action: the one thing most visitors came to do. */}
            <Link
              href="/baru?mode=scan"
              className="group bg-primary text-on-primary rounded-2xl p-5 shadow-lg shadow-primary/25 flex items-center gap-4 active:scale-[0.99] transition-transform"
            >
              <span
                className="w-14 h-14 rounded-2xl bg-on-primary/15 flex items-center justify-center text-3xl shrink-0"
                aria-hidden
              >
                📸
              </span>
              <span className="flex-1">
                <span className="block text-lg font-extrabold leading-tight">Mulai split bill sekarang</span>
                <span className="block text-xs opacity-90 mt-1">
                  Foto struk atau ambil dari galeri, biar kami bantu itungin.
                </span>
              </span>
              <span aria-hidden className="text-2xl transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              href="/baru?mode=manual"
              className="bg-surface-container-lowest rounded-2xl px-5 py-4 shadow-sm border border-outline-variant/30 flex items-center gap-4 active:scale-[0.99] transition-transform"
            >
              <span
                className="w-10 h-10 rounded-xl bg-secondary-container/50 flex items-center justify-center text-xl shrink-0"
                aria-hidden
              >
                🧮
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-on-surface">Gak punya struk? Atur jumlahnya sendiri</span>
                <span className="block text-xs text-on-surface-variant mt-0.5">
                  Lebih cepat buat bagi rata.
                </span>
              </span>
              <span aria-hidden className="text-on-surface-variant">
                →
              </span>
            </Link>
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

      <div className="lg:max-w-2xl lg:mx-auto">
        <HomeContent />
      </div>
      <HomeJsonLd />
    </AppShell>
  )
}
