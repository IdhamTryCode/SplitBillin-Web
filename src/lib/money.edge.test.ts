import { describe, it, expect } from 'vitest'
import { formatIDR, parseIDR } from './money'

describe('formatIDR — kasus tepi', () => {
  it('nol, negatif, dan angka besar', () => {
    expect(formatIDR(0)).toBe('Rp0')
    expect(formatIDR(-1)).toBe('-Rp1')
    expect(formatIDR(-6400)).toBe('-Rp6.400')
    expect(formatIDR(999999999999)).toBe('Rp999.999.999.999')
  })

  it('membulatkan pecahan karena uang selalu integer', () => {
    expect(formatIDR(17400.4)).toBe('Rp17.400')
    expect(formatIDR(17400.6)).toBe('Rp17.401')
  })
})

describe('parseIDR — kasus tepi', () => {
  it('format Indonesia (titik ribuan, koma desimal)', () => {
    expect(parseIDR('17.400')).toBe(17400)
    expect(parseIDR('17.400,00')).toBe(17400)
    expect(parseIDR('1.234.567,89')).toBe(1234568)
    expect(parseIDR('17,400')).toBe(17400)
  })

  it('satu pemisah non-ribuan dianggap desimal lalu dibulatkan', () => {
    expect(parseIDR('17,5')).toBe(18)
    expect(parseIDR('17.5')).toBe(18)
  })

  it('negatif', () => {
    expect(parseIDR('-6.400')).toBe(-6400)
    expect(parseIDR('-Rp 6.400')).toBe(-6400)
    expect(parseIDR('-0') === 0).toBe(true) // secara aritmetika nol
  })

  // Ditemukan, TIDAK diperbaiki (sesuai instruksi). parseIDR('-0') mengembalikan
  // -0, bukan +0, jadi `toBe(0)` gagal karena Object.is(-0, 0) === false.
  // Dampak praktis nol (JSON.stringify(-0) === "0", -0 < 0 === false), tetap dicatat.
  it.fails("parseIDR('-0') mengembalikan +0 (saat ini -0)", () => {
    expect(parseIDR('-0')).toBe(0)
  })

  it('spasi dan simbol diabaikan', () => {
    expect(parseIDR('  Rp 17.400  ')).toBe(17400)
    expect(parseIDR('Rp17.400')).toBe(17400)
  })

  it('angka sangat besar (sampai MAX_SAFE_INTEGER)', () => {
    expect(parseIDR('1.000.000.000.000')).toBe(1_000_000_000_000)
    expect(parseIDR('9007199254740991')).toBe(9007199254740991)
  })

  it('kosong atau tanpa angka -> NaN', () => {
    expect(parseIDR('')).toBeNaN()
    expect(parseIDR('   ')).toBeNaN()
    expect(parseIDR('abc')).toBeNaN()
    expect(parseIDR('Rp')).toBeNaN()
  })
})
