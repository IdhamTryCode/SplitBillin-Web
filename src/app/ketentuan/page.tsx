import type { Metadata } from 'next'
import { ContactLine, InfoPage, InfoSection } from '@/components/InfoPage'

export const metadata: Metadata = {
  title: 'Ketentuan Penggunaan',
  alternates: { canonical: '/ketentuan' },
  description: 'Aturan main memakai SplitBillin.',
}

export default function TermsPage() {
  return (
    <InfoPage title="Ketentuan Penggunaan" lead="Dengan memakai SplitBillin, kamu setuju dengan hal-hal berikut.">
      <InfoSection title="Layanan">
        <p>
          SplitBillin adalah alat bantu hitung untuk membagi tagihan. Layanan ini gratis dan disediakan apa adanya,
          tanpa jaminan selalu tersedia atau bebas dari kesalahan.
        </p>
      </InfoSection>

      <InfoSection title="Hitungan dan hasil scan">
        <ul>
          <li>Hasil scan struk bisa keliru. Kamu bertanggung jawab memeriksa item, harga, dan total sebelum membagikan.</li>
          <li>Nominal yang tampil adalah hasil pembagian dari data yang kamu masukkan, bukan tagihan resmi.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Pembayaran">
        <p>
          SplitBillin tidak memproses, menerima, atau menahan uang. Semua pembayaran terjadi langsung antara kamu dan
          temanmu di luar aplikasi. Status lunas ditandai manual oleh pembuat dan bukan bukti pembayaran.
        </p>
      </InfoSection>

      <InfoSection title="Link dan akses">
        <ul>
          <li>Siapa pun yang punya link rincian bisa melihat isi split bill, termasuk info bayar.</li>
          <li>
            Link kelola memberi akses penuh untuk mengubah dan menghapus bill. Menjaganya tetap rahasia adalah tanggung
            jawabmu.
          </li>
          <li>Split bill dihapus otomatis setelah 90 hari.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Pemakaian yang wajar">
        <ul>
          <li>Jangan memasukkan data orang lain tanpa izinnya, atau konten yang melanggar hukum.</li>
          <li>Jangan menyalahgunakan layanan, misalnya scan otomatis berlebihan atau mencoba menembus batas pemakaian.</li>
          <li>Kami boleh membatasi pemakaian atau menghapus konten yang melanggar ketentuan ini.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Perubahan">
        <p>Ketentuan ini bisa berubah seiring layanan berkembang. Versi terbaru selalu ada di halaman ini.</p>
        <ContactLine />
      </InfoSection>
    </InfoPage>
  )
}
