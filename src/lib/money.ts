/**
 * Utilitas uang Rupiah.
 * Semua nominal adalah bilangan bulat (int) Rupiah, tanpa desimal.
 */

/**
 * Format bilangan bulat Rupiah menjadi string dengan titik ribuan.
 * @example formatIDR(21907) → "Rp21.907"
 * @example formatIDR(-6400) → "-Rp6.400"
 * @example formatIDR(0) → "Rp0"
 */
export function formatIDR(amount: number): string {
  const abs = Math.abs(Math.round(amount))
  const formatted = abs.toLocaleString('id-ID')
  return `${amount < 0 ? '-' : ''}Rp${formatted}`
}

/**
 * Sama seperti formatIDR tanpa awalan "Rp" — hanya angka dengan titik ribuan.
 * Dipakai kolom input nominal saat tidak difokus.
 * @example formatIDRPlain(706497) → "706.497"
 * @example formatIDRPlain(-6400) → "-6.400"
 */
export function formatIDRPlain(amount: number): string {
  return formatIDR(amount).replace(/Rp/g, '')
}

/**
 * Parse string Rupiah Indonesia menjadi bilangan bulat.
 * Menerima format: "17.400", "17.400,00", "17400", "Rp 17.400", "Rp17.400"
 * Mengembalikan NaN bila tidak bisa diparse.
 */
export function parseIDR(str: string): number {
  if (typeof str !== 'string') return NaN
  let s = str.trim()
  if (!s) return NaN

  const isNegative = s.startsWith('-')
  // Hapus semua karakter kecuali angka, titik, dan koma
  s = s.replace(/[^0-9.,]/g, '')
  if (!s) return NaN

  if (s.includes('.') && s.includes(',')) {
    if (s.lastIndexOf('.') < s.lastIndexOf(',')) {
      // Indonesia: 17.400,00 -> hapus titik, koma jadi titik
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // Inggris: 17,400.00 -> hapus koma
      s = s.replace(/,/g, '')
    }
  } else if (s.includes('.')) {
    // Hanya ada titik. Di konteks IDR, "17.400" adalah 17400 (titik ribuan)
    const parts = s.split('.')
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      s = s.replace(/\./g, '')
    }
  } else if (s.includes(',')) {
    // Hanya ada koma. "17,400" -> 17400 atau "17,5" -> 17.5
    const parts = s.split(',')
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      s = s.replace(/,/g, '')
    } else {
      s = s.replace(',', '.')
    }
  }

  const val = Number(s)
  if (!Number.isFinite(val)) return NaN
  const intVal = Math.round(val)
  return isNegative ? -Math.abs(intVal) : Math.abs(intVal)
}
