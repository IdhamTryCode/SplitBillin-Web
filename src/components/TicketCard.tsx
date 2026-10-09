import React from 'react'
import { cn } from '@/lib/utils'

interface TicketCardProps {
  children: React.ReactNode
  className?: string
}

/**
 * TicketCard: receipt-style paper card with serrated top and bottom edges.
 * Pair with `TicketNotchDivider` for the tear line between sections.
 */
export function TicketCard({ children, className }: TicketCardProps) {
  return (
    <div
      className={cn(
        'relative bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-10px_rgba(15,23,42,0.08),0_2px_6px_-1px_rgba(15,23,42,0.04)] dark:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.5)] border border-transparent dark:border-white/5 overflow-hidden',
        className,
      )}
    >
      <div className="ticket-edge ticket-edge-top absolute top-0 inset-x-0" aria-hidden />
      {children}
      <div className="ticket-edge absolute bottom-0 inset-x-0" aria-hidden />
    </div>
  )
}

export function TicketNotchDivider() {
  return (
    <div className="relative w-full my-4 flex items-center justify-between" aria-hidden>
      {/* Left notch */}
      <div className="w-3 h-6 bg-surface rounded-r-full" />

      {/* Dashed line */}
      <div className="flex-1 border-b-2 border-dashed border-outline-variant/70 mx-2" />

      {/* Right notch */}
      <div className="w-3 h-6 bg-surface rounded-l-full" />
    </div>
  )
}
