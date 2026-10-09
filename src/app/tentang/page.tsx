import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactLine, InfoPage, InfoSection } from '@/components/InfoPage'

export const metadata: Metadata = {
  title: 'Tentang',
  alternates: { canonical: '/tentang' },
  description: 'Cara kerja SplitBillin dan apa yang terjadi dengan datamu.',
}

const STEPS = [
  {
    icon: '📸',
    title: 'Foto struknya',
    body: 'Ambil foto atau pilih dari galeri. Item dan harganya dibaca otomatis, lalu kamu periksa dan koreksi kalau ada yang keliru.',
  },
  {
    icon: '👥',
    title: 'Tandai siapa pesan apa',
    body: 'Tambahkan teman, ketuk namanya di tiap item. Diskon, pajak, dan biaya lain dibagi sesuai porsi masing-masing.',
  },
  {
    icon: '🔗',
    title: 'Bagikan satu link',
    body: 'Tiap orang melihat “kamu bayar berapa, ke mana”. Kamu menandai siapa yang sudah lunas.',
  },
]

export default function AboutPage() {
  return (
    <InfoPage
      title="Tentang SplitBillin"
      lead="Bagi tagihan bareng teman tanpa hitung manual. Gratis, bisa dipakai tanpa akun."
    >
      <ol className="flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex items-start gap-4"
          >
            <span
              className="w-12 h-12 rounded-2xl bg-secondary-container/50 flex items-center justify-center text-2xl shrink-0"
              aria-hidden
            >
              {s.icon}
            </span>
            <div>
              <h2 className="text-sm font-bold text-on-surface">
                {i + 1}. {s.title}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <InfoSection title="Privasi singkat">
        <ul>
          <li>
            <strong>Foto struk tidak disimpan oleh SplitBillin.</strong> Foto dikirim ke layanan AI hanya untuk dibaca,
            lalu yang kami simpan hanya teks hasilnya (nama item dan harga).
          </li>
          <li>
            <strong>Data bill dihapus otomatis setelah 90 hari.</strong> Pembuat bisa memperpanjang atau menghapusnya
            lebih cepat.
          </li>
          <li>
            <strong>Info bayar bisa dilihat siapa pun yang punya link.</strong> Jangan isi data yang tidak mau
            dibagikan.
          </li>
          <li>Tidak ada iklan dan tidak ada pelacakan iklan.</li>
        </ul>
        <p>
          Selengkapnya di{' '}
          <Link href="/privasi" className="text-primary underline underline-offset-2">
            Kebijakan Privasi
          </Link>
          .
        </p>
      </InfoSection>

      <InfoSection title="Yang perlu kamu tahu">
        <ul>
          <li>Hasil scan bisa keliru. Selalu periksa item dan total sebelum membagikan link.</li>
          <li>
            Pembayaran terjadi di luar aplikasi (transfer, e-wallet, QRIS). SplitBillin tidak memproses uang dan status
            lunas ditandai manual oleh pembuat.
          </li>
          <li>
            Tanpa akun, link kelola adalah kuncinya. Simpan baik-baik dan jangan kirim ke grup. Dengan akun Google,
            bill tersimpan di akunmu.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Ada masalah?">
        <p>
          Kalau angka di sebuah split bill terasa salah, hubungi orang yang membuatnya: hanya pembuat yang bisa
          mengubah bill itu.
        </p>
        <ContactLine />
      </InfoSection>
    </InfoPage>
  )
}
