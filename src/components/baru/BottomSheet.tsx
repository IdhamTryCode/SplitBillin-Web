'use client'

import React from 'react'

interface BottomSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-[480px] bg-surface-container-lowest dark:bg-dark-card rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-surface-container-lowest dark:bg-dark-card border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-on-surface">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
