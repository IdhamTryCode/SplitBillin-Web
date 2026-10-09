import React from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'

interface StatusPageProps {
  icon: string
  title: string
  body: string
  children?: React.ReactNode
}

/** Full-page message for 404, expired links, invalid tokens and server errors. */
export function StatusPage({ icon, title, body, children }: StatusPageProps) {
  return (
    <AppShell nav={false}>
      <div className="mt-10 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center gap-3">
        <div
          className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-3xl"
          aria-hidden
        >
          {icon}
        </div>
        <h1 className="text-xl font-bold text-on-surface">{title}</h1>
        <p className="text-sm text-on-surface-variant">{body}</p>
        <div className="flex flex-col gap-2 w-full mt-2">
          {children}
          <Link href="/" className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm">
            Ke Beranda
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
