'use client'

import React, { useEffect, useState } from 'react'
import { parseIDR } from '@/lib/money'
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
 * Text input for Rupiah amounts. Accepts "17.400", "17400", etc. via parseIDR
 * and reports an integer back to the parent.
 */
export function MoneyInput({
  value,
  onChange,
  placeholder,
  allowNegative = false,
  className,
  ariaLabel,
}: MoneyInputProps) {
  const [text, setText] = useState(value ? String(value) : '')

  useEffect(() => {
    const parsed = parseIDR(text)
    if (Number.isNaN(parsed) ? value !== 0 : parsed !== value) {
      setText(value === 0 ? '' : String(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (raw: string) => {
    let next = raw
    if (!allowNegative) next = next.replace(/-/g, '')
    setText(next)
    if (next.trim() === '') {
      onChange(0)
      return
    }
    const parsed = parseIDR(next)
    if (!Number.isNaN(parsed)) onChange(parsed)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      value={text}
      placeholder={placeholder}
      onChange={(e) => handleChange(e.target.value)}
      className={cn('font-mono', className)}
    />
  )
}
