const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** "2026-06-29" or an ISO timestamp → "29 Jun 2026" (WIB for timestamps). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (plain) return `${Number(plain[3])} ${MONTHS[Number(plain[2]) - 1]} ${plain[1]}`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const wib = new Date(d.getTime() + 7 * 3600_000)
  return `${wib.getUTCDate()} ${MONTHS[wib.getUTCMonth()]} ${wib.getUTCFullYear()}`
}

/** ISO timestamp → "29 Jun, 21.04" in WIB. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const wib = new Date(d.getTime() + 7 * 3600_000)
  const hh = String(wib.getUTCHours()).padStart(2, '0')
  const mm = String(wib.getUTCMinutes()).padStart(2, '0')
  return `${wib.getUTCDate()} ${MONTHS[wib.getUTCMonth()]}, ${hh}.${mm}`
}
