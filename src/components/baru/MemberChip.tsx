'use client'

import React from 'react'
import type { BillMember } from '@/lib/schemas'
import { cn } from '@/lib/utils'

interface MemberChipProps {
  member: BillMember
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function MemberAvatar({ member, className }: { member: BillMember; className?: string }) {
  return (
    <span
      className={cn(
        'w-6 h-6 rounded-full text-white flex items-center justify-center text-[11px] font-bold shrink-0',
        className,
      )}
      style={{ backgroundColor: member.color }}
    >
      {member.name[0]?.toUpperCase()}
    </span>
  )
}

export function MemberChip({ member, selected, onClick, disabled, className }: MemberChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 h-11 px-3 rounded-full text-xs font-medium transition-all',
        selected
          ? 'bg-primary text-on-primary shadow-sm'
          : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant',
        disabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
    >
      <MemberAvatar member={member} className="w-4 h-4 text-[9px]" />
      <span>{member.name}</span>
    </button>
  )
}
