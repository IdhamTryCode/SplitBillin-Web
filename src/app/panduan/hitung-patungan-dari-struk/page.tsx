import type { Metadata } from 'next'
import Link from 'next/link'
import { InfoPage, InfoSection } from '@/components/InfoPage'

export const metadata: Metadata = {
  title: 'Hitung Patungan dari Struk Otomatis',
  description:
    'Foto struk, item dan harganya terbaca otomatis, lalu tagihan dibagi per orang. Panduan memindai struk dan mengoreksi hasilnya sebelum dibagikan.',
  alternates: { canonical: '/panduan/hitung-patungan-dari-struk' },
}

export default function HitungPatunganPage() {
  return (
    <InfoPage
      title="Hitung patungan dari struk secara otomatis"
      lead="Daripada mengetik ulang semua item, foto saja struknya. SplitBillin membaca item dan harganya, lalu membagi tagihan ke tiap orang."
    >
      <InfoSection title="Cara memindai struk">
        <ol className="list-decimal pl-5 flex flex-col gap-1.5">
          <li>Buka halaman buat split bill dan pilih “Hitung otomatis pake struk”.</li>
          <li>Ambil foto struk lewat kamera, atau pilih gambar yang sudah ada di galeri.</li>
          <li>Gambar dikecilkan di browser sebelum dikirim, lalu dipindai selama beberapa detik.</li>
          <li>Periksa daftar item yang terbaca, betulkan yang keliru, lalu lanjut menandai siapa pesan apa.</li>
        </ol>
      </InfoSection>

      <InfoSection title="Apa yang dibaca dari struk">
        <p>SplitBillin berusaha membaca bagian-bagian penting berikut dari foto struk:</p>
        <ul>
          <li>Nama item, jumlah, dan harga satuan.</li>
          <li>Potongan per item, misalnya harga coret atau voucher yang tercetak di bawah satu item.</li>
          <li>Diskon yang berlaku untuk seluruh pesanan.</li>
          <li>Service atau service charge.</li>
          <li>Pajak seperti PB1 atau PPN, termasuk keterangan apakah pajaknya sudah termasuk di harga.</li>
          <li>Biaya lain seperti ongkir, biaya layanan aplikasi, dan biaya kemasan.</li>
          <li>Pembulatan kasir dan total akhir yang harus dibayar.</li>
        </ul>
        <p>
          Setelah dibaca, aplikasi menghitung ulang total dari item dan biaya, lalu membandingkannya dengan total yang
          tercetak di struk. Kalau ada selisih, kamu akan melihat peringatan supaya bisa memeriksanya.
        </p>
      </InfoSection>

      <InfoSection title="Berapa lama prosesnya">
        <p>
          Memindai struk biasanya hanya beberapa detik. Selama proses, kamu melihat garis pemindai bergerak dan status
          yang bergantian, mulai dari “membaca struk”, “mengenali item”, sampai “menghitung total”. Kalau jaringan
          lambat atau gambar kurang jelas, prosesnya bisa sedikit lebih lama.
        </p>
        <p>
          Kalau pembacaan gagal, kamu tidak perlu mulai dari nol: kamu bisa mencoba lagi dengan gambar yang sama,
          memotret ulang, atau langsung mengisi itemnya secara manual.
        </p>
      </InfoSection>

      <InfoSection title="Kenapa total bisa terlihat berbeda">
        <p>
          Kadang jumlah item yang terbaca tidak persis sama dengan total di struk, misalnya karena ada baris yang
          terlewat atau angka yang salah dibaca. Aplikasi akan menunjukkan selisihnya dan memberi pilihan untuk
          menyelaraskan: pakai total yang tercetak di struk, atau pakai total hasil hitungan item.
        </p>
        <p>
          Karena setiap rupiah harus jelas ke mana perginya, jumlah bagian semua orang selalu dibuat sama persis dengan
          total yang kamu konfirmasi.
        </p>
      </InfoSection>

      <InfoSection title="Periksa dan koreksi sebelum dibagikan">
        <p>
          Hasil pembacaan otomatis bisa keliru, apalagi kalau foto buram. Karena itu kamu selalu masuk ke layar
          pemeriksaan lebih dulu. Di sana kamu bisa mengubah nama item, jumlah, harga, dan potongan; menambah item yang
          terlewat; serta mengubah service, pajak, biaya lain, dan total.
        </p>
        <p>
          Kalau hitungan item dan total di struk berbeda, akan muncul banner selisih dengan tombol untuk menyelaraskan.
          Periksa dulu sebelum membagikan link, supaya nominal tiap orang benar.
        </p>
      </InfoSection>

      <InfoSection title="Tips foto yang mudah dibaca">
        <ul>
          <li>Pastikan pencahayaan terang dan hindari pantulan lampu langsung ke kertas.</li>
          <li>Ratakan struk; lipatan tebal membuat tulisan sulit terbaca.</li>
          <li>Pastikan seluruh struk masuk ke dalam frame, termasuk baris total di bagian bawah.</li>
          <li>Format gambar yang didukung: JPEG, PNG, dan WebP.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Kalau tidak ada struk">
        <p>
          Kalau struknya hilang atau tidak difoto, pilih “Atur jumlahnya sendiri”. Masukkan total tagihan, lalu bagi
          rata, per nominal, atau per persen. Semua fitur inti tetap bisa dipakai tanpa scan.
        </p>
        <p>
          Foto struk tidak disimpan oleh SplitBillin. Siap mencoba?{' '}
          <Link href="/baru?mode=scan" className="text-primary underline underline-offset-2">
            Scan struk dan bagi tagihannya
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPage>
  )
}
