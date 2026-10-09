import Link from 'next/link'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'

const STEPS = [
  {
    title: 'Foto struknya',
    body: 'Ambil foto struk restoran, kafe, atau minimarket. Item, harga, diskon, dan pajak terbaca otomatis, lalu kamu tinggal periksa.',
  },
  {
    title: 'Tandai siapa pesan apa',
    body: 'Tambahkan nama teman dan ketuk di tiap item. Satu item bisa dibagi rata atau per porsi.',
  },
  {
    title: 'Bagikan satu link',
    body: 'Tiap orang melihat nominal bagiannya dan ke mana harus transfer. Kamu menandai siapa yang sudah lunas.',
  },
]

export const FAQS = [
  {
    q: 'Apakah SplitBillin benar-benar gratis?',
    a: 'Ya. Semua fitur gratis, termasuk scan struk, tanpa iklan dan tanpa biaya tersembunyi. Kamu bisa langsung pakai tanpa membuat akun.',
  },
  {
    q: 'Apa itu split bill?',
    a: 'Split bill adalah membagi satu tagihan ke beberapa orang, misalnya saat makan bareng dan satu orang nalangin dulu. SplitBillin menghitung bagian tiap orang sesuai pesanannya, bukan sekadar bagi rata.',
  },
  {
    q: 'Bagaimana pajak, service charge, dan diskon dibagi?',
    a: 'Pajak, service charge, ongkir, dan diskon dibagi proporsional sesuai nilai pesanan masing-masing. Jumlah bagian semua orang selalu sama persis dengan total struk.',
  },
  {
    q: 'Apakah foto struk saya disimpan?',
    a: 'Tidak. Foto struk tidak disimpan oleh SplitBillin. Foto hanya dipakai untuk membaca item, dan yang disimpan hanya teks hasilnya setelah kamu membuat split bill.',
  },
  {
    q: 'Apakah teman saya perlu daftar atau install aplikasi?',
    a: 'Tidak perlu. Temanmu cukup membuka link yang kamu kirim lewat WhatsApp untuk melihat berapa yang harus dibayar.',
  },
  {
    q: 'Bisa bagi rata tanpa struk?',
    a: 'Bisa. Pilih "Atur jumlahnya sendiri", isi total tagihan, lalu bagi rata, per nominal, atau per persen.',
  },
  {
    q: 'Apakah pembayaran dilakukan di dalam aplikasi?',
    a: 'Tidak. SplitBillin hanya menghitung dan menampilkan info bayar seperti nomor rekening, e-wallet, atau QRIS. Transfer dilakukan langsung antara kamu dan temanmu.',
  },
]

/** Structured data: tells search engines this is a free web app and exposes the FAQ. */
export function HomeJsonLd() {
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      inLanguage: 'id',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]
  return (
    <script
      type="application/ld+json"
      // Static, app-authored content; "<" is escaped so the JSON cannot close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

/** Explanatory content under the two entry cards on Beranda. */
export function HomeContent() {
  return (
    <div className="flex flex-col gap-8 mt-10">
      <section aria-labelledby="cara-kerja" className="flex flex-col gap-4">
        <h2 id="cara-kerja" className="text-lg font-bold text-on-surface">
          Cara split bill gratis pakai SplitBillin
        </h2>
        <ol className="grid gap-3 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30"
            >
              <span className="font-mono text-xs font-bold text-primary">LANGKAH {i + 1}</span>
              <h3 className="text-sm font-bold text-on-surface mt-1">{s.title}</h3>
              <p className="text-xs text-on-surface-variant mt-1">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="kenapa" className="flex flex-col gap-3">
        <h2 id="kenapa" className="text-lg font-bold text-on-surface">
          Patungan yang adil, bukan sekadar bagi rata
        </h2>
        <p className="text-sm text-on-surface-variant">
          Yang pesan es teh tidak ikut menanggung steak temannya. SplitBillin membagi tagihan per item, lalu
          membagi pajak, service charge, ongkir, dan diskon sesuai porsi masing-masing. Cocok untuk makan bareng di
          restoran, pesan-antar ramai-ramai, belanja kos, sampai patungan acara kantor.
        </p>
      </section>

      <section aria-labelledby="faq" className="flex flex-col gap-3">
        <h2 id="faq" className="text-lg font-bold text-on-surface">
          Pertanyaan yang sering ditanyakan
        </h2>
        <div className="flex flex-col gap-2">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 group"
            >
              <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-on-surface flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{f.q}</h3>
                <span aria-hidden className="text-on-surface-variant group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm text-on-surface-variant">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="flex flex-col items-center gap-2 text-center pb-2">
        <Link
          href="/baru?mode=scan"
          className="px-6 h-12 flex items-center bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md"
        >
          Mulai split bill sekarang
        </Link>
        <p className="text-[11px] text-on-surface-variant">Gratis, tanpa daftar.</p>
      </div>

      <section aria-labelledby="panduan" className="flex flex-col gap-3 border-t border-outline-variant/40 pt-6">
        <h2 id="panduan" className="text-lg font-bold text-on-surface">
          Panduan
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link href="/panduan/cara-split-bill" className="text-primary underline underline-offset-2">
              Cara bagi tagihan restoran secara adil
            </Link>
          </li>
          <li>
            <Link href="/panduan/split-bill-gratis" className="text-primary underline underline-offset-2">
              Pakai SplitBillin gratis, tanpa daftar
            </Link>
          </li>
          <li>
            <Link href="/panduan/hitung-patungan-dari-struk" className="text-primary underline underline-offset-2">
              Hitung patungan dari struk secara otomatis
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
