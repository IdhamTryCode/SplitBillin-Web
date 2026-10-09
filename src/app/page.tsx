import Link from 'next/link'

const CHOICES = [
  {
    href: '/baru?mode=scan',
    icon: '📸',
    title: 'Hitung otomatis pake struk',
    description: 'Foto struk atau ambil dari galeri, biar kami bantu itungin.',
  },
  {
    href: '/baru?mode=manual',
    icon: '🧮',
    title: 'Atur jumlahnya sendiri',
    description: 'Lebih cepat buat bagi rata, gak usah pake struk.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-surface dark:bg-dark-canvas px-4 py-6 flex flex-col items-center">
      <div className="max-w-[480px] w-full flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-tight text-primary">SplitBillin</span>
          <span className="text-xs text-on-surface-variant">Gratis, tanpa daftar</span>
        </header>

        <div className="flex flex-col gap-2 pt-2">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Bagi tagihan tanpa ribet.
          </h1>
          <p className="text-sm text-on-surface-variant">
            Foto struk, hitung otomatis, bagikan satu link ke teman-temanmu.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {CHOICES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4 active:scale-[0.99] transition-transform"
            >
              <span className="w-12 h-12 rounded-2xl bg-secondary-container/50 flex items-center justify-center text-2xl shrink-0">
                {c.icon}
              </span>
              <span className="flex-1">
                <span className="block font-bold text-on-surface">{c.title}</span>
                <span className="block text-xs text-on-surface-variant mt-1">{c.description}</span>
              </span>
            </Link>
          ))}
        </div>

        <p className="text-[11px] text-center text-outline pt-4">
          Gratis. Foto struk tidak disimpan oleh SplitBillin.
        </p>
      </div>
    </main>
  )
}
