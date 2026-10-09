/** Canonical site identity, shared by metadata, sitemap, robots and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.splitbillin.my.id').replace(/\/$/, '')
export const SITE_NAME = 'SplitBillin'
export const SITE_TITLE = 'SplitBillin — Split Bill Online Gratis, Scan Struk Otomatis'
export const SITE_DESCRIPTION =
  'Bagi tagihan makan bareng teman tanpa hitung manual. Foto struk, item terbaca otomatis, pajak dan diskon dibagi adil, lalu bagikan satu link. Gratis, tanpa daftar.'
