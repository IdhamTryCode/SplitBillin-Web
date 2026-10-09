'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Logo } from '@/components/Logo'
import { useUser } from '@/lib/use-user'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Hitung', icon: '🧾' },
  { href: '/riwayat', label: 'Riwayat', icon: '🕘' },
  { href: '/akun', label: 'Pengaturan', icon: '⚙️' },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/' || pathname.startsWith('/baru')
  return pathname.startsWith(href)
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dark = mounted && resolvedTheme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      className={cn(
        'w-11 h-11 rounded-full flex items-center justify-center text-base text-on-surface-variant hover:bg-surface-container',
        className,
      )}
    >
      <span aria-hidden>{dark ? '☀️' : '🌙'}</span>
    </button>
  )
}

export function AppHeader() {
  const pathname = usePathname()
  const { user, ready } = useUser()
  const initial = (user?.user_metadata?.full_name ?? user?.email ?? '?').toString()[0]?.toUpperCase()

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-outline-variant/40">
      <div className="mx-auto w-full max-w-[1040px] px-4 h-14 flex items-center justify-between gap-2">
        <Link href="/" aria-label="SplitBillin, ke Beranda" className="flex items-center h-11 shrink-0">
          <Logo size={30} />
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Navigasi utama">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 rounded-xl text-sm font-semibold',
                isActive(pathname, item.href)
                  ? 'bg-secondary-container/50 text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/tentang"
            className="px-2 h-11 flex items-center text-xs font-semibold text-on-surface-variant hover:text-on-surface"
          >
            Tentang
          </Link>
          <ThemeToggle />
          {ready && user ? (
            <Link
              href="/akun"
              aria-label="Akun"
              className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold"
            >
              {initial}
            </Link>
          ) : (
            <Link
              href={`/masuk?next=${encodeURIComponent(pathname)}`}
              className={cn(
                'px-3 h-9 flex items-center rounded-full bg-surface-container text-on-surface text-xs font-semibold',
                !ready && 'invisible',
              )}
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Navigasi utama"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/40 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto max-w-[480px] grid grid-cols-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] font-semibold',
                active ? 'text-primary' : 'text-on-surface-variant',
              )}
            >
              <span aria-hidden className={cn('text-lg leading-none', !active && 'opacity-60 grayscale')}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

interface AppShellProps {
  children: React.ReactNode
  /** Show the bottom navigation (off inside the wizard and on pages with their own sticky bar). */
  nav?: boolean
  /** `wide` allows the two-column desktop layout (max 1040 px). */
  width?: 'narrow' | 'wide'
  className?: string
}

export function AppShell({ children, nav = true, width = 'narrow', className }: AppShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <AppHeader />
      <main
        className={cn(
          'flex-1 w-full mx-auto px-4 pt-5',
          width === 'wide' ? 'max-w-[480px] lg:max-w-[1040px]' : 'max-w-[480px]',
          nav ? 'pb-24 lg:pb-10' : 'pb-10',
          className,
        )}
      >
        {children}
      </main>
      {nav && <BottomNav />}
    </div>
  )
}
