'use client'

import React from 'react'
import Link from 'next/link'
import type { ScanFailure } from './types'

interface ScanErrorStateProps {
  failure: ScanFailure
  /** Guests get a soft nudge to sign in when a limit is hit. */
  isGuest?: boolean
  onRetry: () => void
  onRescan: () => void
  onManual: () => void
}

interface Copy {
  icon: string
  tone: 'danger' | 'warn' | 'neutral'
  title: string
  body: string
  primary: { label: string; action: 'retry' | 'rescan' | 'manual' }
  secondary?: { label: string; action: 'retry' | 'rescan' | 'manual' }
}

function copyFor(failure: ScanFailure): Copy {
  switch (failure.code) {
    case 'not_receipt':
      return {
        icon: '🚫',
        tone: 'danger',
        title: 'Ini sepertinya bukan struk',
        body: 'Pastikan kertas memiliki rincian harga, nama tempat, dan total pembayaran.',
        primary: { label: 'Ambil Ulang', action: 'rescan' },
        secondary: { label: 'Isi Manual', action: 'manual' },
      }
    case 'rate_limited': {
      const wait = failure.retryAfter ?? 0
      const when =
        wait > 3600 ? 'besok' : wait > 0 ? `${Math.max(1, Math.ceil(wait / 60))} menit lagi` : 'beberapa menit lagi'
      return {
        icon: '⏳',
        tone: 'warn',
        title: 'Kamu sudah scan beberapa kali',
        body: `Coba lagi ${when}. Sementara itu kamu tetap bisa mengisi manual.`,
        primary: { label: 'Isi Manual', action: 'manual' },
      }
    }
    case 'quota_exceeded':
      return {
        icon: '📦',
        tone: 'neutral',
        title: 'Kuota scan hari ini habis',
        body: 'Kuota scan hari ini sudah habis. Kamu masih bisa mengisi manual, atau coba lagi besok.',
        primary: { label: 'Isi Manual', action: 'manual' },
      }
    case 'bot_check_failed':
      return {
        icon: '🛡️',
        tone: 'warn',
        title: 'Verifikasi anti-bot gagal',
        body: 'Kami belum bisa memastikan ini bukan bot. Coba ulangi verifikasinya.',
        primary: { label: 'Ulangi Verifikasi', action: 'retry' },
        secondary: { label: 'Isi Manual', action: 'manual' },
      }
    case 'upstream_error':
    case 'unreadable':
    default:
      return {
        icon: '⏱️',
        tone: 'warn',
        title: 'Gagal membaca struk',
        body: 'Koneksi lambat atau foto struk terlalu buram untuk dibaca. Coba lagi atau isi manual.',
        primary: { label: 'Coba Lagi', action: 'retry' },
        secondary: { label: 'Isi Manual', action: 'manual' },
      }
  }
}

const TONE_CLASS: Record<Copy['tone'], string> = {
  danger: 'bg-error-container text-error',
  warn: 'bg-amber-100 text-tertiary dark:bg-amber-950/40',
  neutral: 'bg-surface-container text-on-surface-variant',
}

export function ScanErrorState({ failure, isGuest, onRetry, onRescan, onManual }: ScanErrorStateProps) {
  const copy = copyFor(failure)
  const dispatch = (action: 'retry' | 'rescan' | 'manual') => {
    if (action === 'retry') onRetry()
    else if (action === 'rescan') onRescan()
    else onManual()
  }

  return (
    <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-3">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${TONE_CLASS[copy.tone]}`}
        aria-hidden
      >
        {copy.icon}
      </div>
      <h1 className="text-lg font-bold text-on-surface">{copy.title}</h1>
      <p className="text-sm text-on-surface-variant">{copy.body}</p>
      {isGuest && failure.code === 'rate_limited' && (
        <Link
          href="/masuk?next=/baru%3Fmode%3Dscan"
          className="text-xs text-primary font-semibold underline underline-offset-2 py-1"
        >
          Masuk untuk kuota lebih banyak
        </Link>
      )}

      <div className="flex flex-col gap-2 w-full mt-2">
        <button
          type="button"
          onClick={() => dispatch(copy.primary.action)}
          className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm"
        >
          {copy.primary.label}
        </button>
        {copy.secondary && (
          <button
            type="button"
            onClick={() => dispatch(copy.secondary!.action)}
            className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
          >
            {copy.secondary.label}
          </button>
        )}
      </div>
    </div>
  )
}
