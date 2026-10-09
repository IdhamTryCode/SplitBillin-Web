import type { Metadata } from 'next'
import { ContactLine, InfoPage, InfoSection } from '@/components/InfoPage'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  alternates: { canonical: '/privasi' },
  description: 'Data apa yang disimpan SplitBillin, berapa lama, dan siapa yang bisa melihatnya.',
}

export default function PrivacyPage() {
  return (
    <InfoPage title="Kebijakan Privasi" lead="Ditulis sesingkat mungkin: apa yang disimpan, berapa lama, dan siapa yang bisa melihat.">
      <InfoSection title="Foto struk">
        <p>
          <strong>Foto struk tidak disimpan oleh SplitBillin.</strong> Foto dikecilkan di perangkatmu, dikirim ke
          server kami, lalu diteruskan ke layanan AI pihak ketiga untuk dibaca. Kami hanya menyimpan teks hasilnya
          setelah kamu membuat split bill.
        </p>
        <p>
          Layanan AI itu dijalankan pihak lain dengan kebijakannya sendiri, jadi jangan memfoto dokumen yang berisi
          data sensitif.
        </p>
      </InfoSection>

      <InfoSection title="Data split bill">
        <ul>
          <li>
            Yang disimpan: nama tempat, tanggal, item dan harga, nama panggilan anggota, pembagian, status lunas, dan
            info bayar yang kamu isi (termasuk gambar QRIS bila diunggah).
          </li>
          <li>
            <strong>Data bill dihapus otomatis setelah 90 hari</strong>, kecuali diperpanjang oleh pembuatnya. Pembuat
            bisa menghapusnya kapan saja.
          </li>
          <li>
            <strong>Info bayar bisa dilihat siapa pun yang punya link.</strong> Link rincian tidak didaftarkan ke mesin
            pencari, tetapi siapa pun yang menerimanya bisa membukanya.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Akun (opsional)">
        <ul>
          <li>Kalau masuk dengan Google, kami menyimpan nama dan alamat email dari akun Google-mu.</li>
          <li>Teman tersimpan hanya berupa nama. Kami tidak menyimpan nomor HP atau rekening temanmu.</li>
          <li>
            Kamu bisa menghapus akun dari halaman Pengaturan. Split bill, gambar QRIS, dan daftar teman di akun itu
            ikut terhapus.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Di perangkatmu">
        <p>
          Riwayat tamu, draf, saran nama, dan pilihan tema disimpan di browser perangkatmu. Data itu tidak dikirim ke
          server dan bisa dihapus dari halaman Pengaturan.
        </p>
      </InfoSection>

      <InfoSection title="Pencegahan penyalahgunaan">
        <ul>
          <li>Alamat IP dipakai sementara untuk membatasi jumlah scan dan pembuatan bill, lalu dibersihkan berkala.</li>
          <li>Scan struk memakai Cloudflare Turnstile untuk memastikan permintaan bukan dari bot.</li>
          <li>Tidak ada iklan, dan kami tidak menjual atau membagikan datamu untuk iklan.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Penyedia layanan">
        <p>
          Data disimpan di Supabase, aplikasi dijalankan di Vercel, pembacaan struk memakai layanan AI pihak ketiga,
          dan login memakai Google. Masing-masing memproses data sesuai perannya.
        </p>
        <ContactLine />
      </InfoSection>
    </InfoPage>
  )
}
