import React from 'react'
import { cn } from '@/lib/utils'

interface TicketCardProps {
  children: React.ReactNode
  className?: string
  notchPosition?: 'bottom' | 'top-and-bottom' | 'middle'
}

/**
 * TicketCard: Receipt-style paper card with punch-hole notches and perforation line.
 */
export function TicketCard({
  children,
  className,
}: TicketCardProps) {
  return (
    <div
      className={cn(
        'relative bg-surface-container-lowest dark:bg-dark-card rounded-2xl shadow-[0_10px_30px_-10px_rgba(15,23,42,0.08),0_2px_6px_-1px_rgba(15,23,42,0.04)] dark:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.5)] border border-transparent dark:border-white/5 overflow-hidden transition-all',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function TicketNotchDivider() {
  return (
    <div className="relative w-full my-4 flex items-center justify-between">
      {/* Left notch */}
      <div className="w-4 h-6 bg-surface dark:bg-dark-canvas rounded-r-full -ml-0.5 border-y border-r border-slate-200 dark:border-slate-800" />

      {/* Dashed line */}
      <div className="flex-1 border-b-2 border-dashed border-slate-200 dark:border-slate-800 mx-2" />

      {/* Right notch */}
      <div className="w-4 h-6 bg-surface dark:bg-dark-canvas rounded-l-full -mr-0.5 border-y border-l border-slate-200 dark:border-slate-800" />
    </div>
  )
}
