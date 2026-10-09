import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from './format'

describe('formatDate', () => {
  it('YYYY-MM-DD tanpa pergeseran zona', () => {
    expect(formatDate('2026-06-29')).toBe('29 Jun 2026')
    expect(formatDate('2026-01-01')).toBe('1 Jan 2026')
    expect(formatDate('2026-12-31')).toBe('31 Des 2026')
  })

  it('memetakan semua nama bulan Indonesia', () => {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    names.forEach((name, i) => {
      const mm = String(i + 1).padStart(2, '0')
      expect(formatDate(`2026-${mm}-05`)).toBe(`5 ${name} 2026`)
    })
  })

  it('timestamp dikonversi ke WIB, termasuk pergantian hari', () => {
    expect(formatDate('2026-06-29T16:59:00Z')).toBe('29 Jun 2026')
    expect(formatDate('2026-06-29T17:00:00Z')).toBe('30 Jun 2026')
    expect(formatDate('2025-12-31T17:30:00Z')).toBe('1 Jan 2026')
  })

  it('kosong atau tidak valid -> string kosong', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
    expect(formatDate('bukan tanggal')).toBe('')
  })
})

describe('formatDateTime', () => {
  it('ISO -> "D Mmm, HH.MM" dalam WIB', () => {
    expect(formatDateTime('2026-06-29T14:04:00Z')).toBe('29 Jun, 21.04')
    expect(formatDateTime('2026-06-29T00:00:00Z')).toBe('29 Jun, 07.00')
  })

  it('pergantian hari WIB tetap benar', () => {
    expect(formatDateTime('2026-06-29T18:05:00Z')).toBe('30 Jun, 01.05')
    expect(formatDateTime('2025-12-31T17:00:00Z')).toBe('1 Jan, 00.00')
  })

  it('kosong atau tidak valid -> string kosong', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime('x')).toBe('')
  })
})
