import React from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'

const LINKS = [
  { href: '/tentang', label: 'Tentang' },
  { href: '/privasi', label: 'Privasi' },
  { href: '/ketentuan', label: 'Ketentuan' },
]

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || null

/** Long-form text layout for Tentang, Privasi and Ketentuan. */
export function InfoPage({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children: React.ReactNode
}) {
  return (
    <AppShell>
      <article className="flex flex-col gap-5">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
          {lead && <p className="text-sm text-on-surface-variant">{lead}</p>}
        </header>
        {children}
        <nav className="flex gap-4 text-xs font-semibold text-primary pt-2" aria-label="Halaman informasi">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="py-2 underline underline-offset-2">
              {l.label}
            </Link>
          ))}
        </nav>
      </article>
    </AppShell>
  )
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-2">
      <h2 className="text-sm font-bold text-on-surface">{title}</h2>
      <div className="text-sm text-on-surface-variant flex flex-col gap-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_strong]:text-on-surface">
        {children}
      </div>
    </section>
  )
}

export function ContactLine() {
  if (!CONTACT_EMAIL) return null
  return (
    <p>
      Hubungi kami di{' '}
      <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">
        {CONTACT_EMAIL}
      </a>
      .
    </p>
  )
}
