'use client'

import React, { useState } from 'react'
import { formatIDRPlain, parseIDR } from '@/lib/money'
import { cn } from '@/lib/utils'

interface MoneyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  allowNegative?: boolean
  className?: string
  ariaLabel?: string
}

/**
 * Text input for Rupiah amounts.
 *
 * While the field is focused the raw digits are shown so typing never fights
 * the caret; once it loses focus the value is re-rendered with thousand
 * separators (e.g. "706.497"). The parent always receives an integer.
 */
export function MoneyInput({
  value,
  onChange,
  placeholder,
  allowNegative = false,
  className,
  ariaLabel,
}: MoneyInputProps) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  const display = focused ? draft : value === 0 ? '' : formatIDRPlain(value)

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setDraft(value === 0 ? '' : String(value))
    setFocused(true)
    const el = e.currentTarget
    requestAnimationFrame(() => {
      const end = el.value.length
      try {
        el.setSelectionRange(end, end)
      } catch {
        /* setSelectionRange not supported on this input */
      }
    })
  }

  const handleBlur = () => {
    setFocused(false)
    setDraft('')
  }

  const handleChange = (raw: string) => {
    let next = raw
    if (!allowNegative) next = next.replace(/-/g, '')
    setDraft(next)

    const trimmed = next.trim()
    if (trimmed === '' || trimmed === '-') {
      onChange(0)
      return
    }
    const parsed = parseIDR(trimmed)
    if (!Number.isNaN(parsed)) onChange(parsed)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      value={display}
      placeholder={placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(e) => handleChange(e.target.value)}
      className={cn('font-mono', className)}
    />
  )
}
