import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buat Split Bill',
  description:
    'Buat split bill baru: scan struk dengan AI atau isi total sendiri, tandai siapa pesan apa, lalu bagikan link ke teman.',
  alternates: { canonical: '/baru' },
}

export default function BaruLayout({ children }: { children: React.ReactNode }) {
  return children
}
