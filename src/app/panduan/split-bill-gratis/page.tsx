import type { Metadata } from 'next'
import Link from 'next/link'
import { InfoPage, InfoSection } from '@/components/InfoPage'

export const metadata: Metadata = {
  title: 'Split Bill Gratis, Tanpa Daftar dan Tanpa Iklan',
  description:
    'SplitBillin gratis, tanpa daftar, dan tanpa iklan. Pakai langsung dari browser, bagikan satu link, dan temanmu tidak perlu install aplikasi.',
  alternates: { canonical: '/panduan/split-bill-gratis' },
}

export default function SplitBillGratisPage() {
  return (
    <InfoPage
      title="Split bill gratis, tanpa daftar"
      lead="SplitBillin bisa dipakai langsung dari browser tanpa membuat akun dan tanpa biaya. Semua fitur inti — termasuk scan struk — gratis."
    >
      <InfoSection title="Gratis dan tanpa iklan">
        <p>
          Semua fitur inti SplitBillin gratis: memfoto struk, membagi per item, membagi pajak dan service, sampai
          membagikan link rincian ke teman. Tidak ada langganan, tidak ada biaya tersembunyi, dan tidak ada iklan yang
          mengganggu.
        </p>
        <p>
          Karena tidak ada iklan, tidak ada juga pelacakan iklan. Kami tidak menjual data atau menampilkan produk pihak
          ketiga di halaman tagihanmu.
        </p>
      </InfoSection>

      <InfoSection title="Tanpa daftar: apa artinya untukmu">
        <p>
          Kamu tidak perlu mengetik email, membuat kata sandi, atau memverifikasi nomor HP. Buka halaman, buat split
          bill, lalu bagikan. Saat pertama kali kamu membuat bill sebagai tamu, kamu akan mendapat satu link kelola
          rahasia — simpan link itu baik-baik, karena hanya dengan link itu kamu bisa mengubah dan menandai lunas.
        </p>
        <p>
          Riwayat split bill tamu disimpan di browser perangkatmu, jadi hanya terlihat di perangkat itu. Kalau data
          browser dibersihkan, riwayat itu ikut hilang — link yang sudah kamu bagikan tetap bisa dibuka oleh teman.
        </p>
      </InfoSection>

      <InfoSection title="Teman tidak perlu daftar atau install">
        <p>
          Yang kamu bagikan hanyalah satu link. Temanmu cukup membukanya di browser untuk melihat berapa bagian mereka
          dan ke mana harus transfer. Tidak ada aplikasi yang perlu diunduh, tidak ada akun yang perlu dibuat, dan
          tidak ada nomor HP yang perlu diisi.
        </p>
      </InfoSection>

      <InfoSection title="Cara mulai dalam satu menit">
        <ol className="list-decimal pl-5 flex flex-col gap-1.5">
          <li>Buka halaman buat split bill dan pilih caranya: scan struk atau atur jumlahnya sendiri.</li>
          <li>Isi nama tempat dan totalnya, lalu tambahkan nama teman yang ikut patungan.</li>
          <li>Bagi tagihannya, lalu bagikan link yang muncul ke grup obrolan atau WhatsApp.</li>
        </ol>
        <p>
          Tidak ada proses aktivasi, tidak ada email konfirmasi, dan tidak ada aplikasi yang perlu dipasang. Begitu link
          muncul, split bill sudah bisa dilihat temanmu.
        </p>
      </InfoSection>

      <InfoSection title="Berapa lama tagihan aktif">
        <p>
          Setiap split bill berlaku 90 hari. Selama itu, link bisa dibuka berkali-kali dan status lunas bisa diperbarui
          oleh pembuat. Setelah masa berlaku habis, data bill dihapus otomatis; kalau mau, kamu bisa menghapusnya lebih
          cepat dari halaman kelola.
        </p>
        <p>
          Ada juga batas scan harian yang wajar untuk mencegah penyalahgunaan. Kalau kuota scan sedang habis, kamu tetap
          bisa membuat split bill dengan mengisi nominalnya secara manual — jalur manual selalu bebas.
        </p>
      </InfoSection>

      <InfoSection title="Akun Google itu opsional">
        <p>
          Kalau kamu mau, kamu bisa masuk dengan akun Google. Ini bukan syarat — hanya kenyamanan tambahan. Dengan
          akun, riwayat tagihanmu bisa dibuka dari perangkat lain, bill yang kamu buat sebagai tamu bisa diklaim ke
          akunmu, dan nama teman bisa tersimpan untuk saran cepat. Tanpa akun, semua fitur inti tetap bisa dipakai.
        </p>
      </InfoSection>

      <InfoSection title="Soal data dan privasi">
        <ul>
          <li>
            <strong>Foto struk tidak disimpan oleh SplitBillin.</strong> Foto hanya dipakai sekali untuk membaca item,
            lalu yang tersimpan hanya teks hasilnya.
          </li>
          <li>
            <strong>Data bill dihapus otomatis setelah 90 hari.</strong> Kamu juga bisa menghapusnya lebih cepat dari
            halaman kelola.
          </li>
          <li>
            <strong>Info bayar bisa dilihat siapa pun yang punya link.</strong> Jangan isi data yang tidak mau
            dibagikan.
          </li>
        </ul>
        <p>
          Siap mulai?{' '}
          <Link href="/baru" className="text-primary underline underline-offset-2">
            Buat split bill gratis
          </Link>{' '}
          tanpa daftar, atau baca dulu{' '}
          <Link href="/panduan/cara-split-bill" className="text-primary underline underline-offset-2">
            cara membagi tagihan yang adil
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPage>
  )
}
