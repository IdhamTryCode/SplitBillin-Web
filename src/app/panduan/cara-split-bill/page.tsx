import type { Metadata } from 'next'
import Link from 'next/link'
import { InfoPage, InfoSection } from '@/components/InfoPage'

export const metadata: Metadata = {
  title: 'Cara Bagi Tagihan Restoran yang Adil',
  description:
    'Panduan membagi tagihan makan bareng: hitung per item, lalu bagi pajak dan service sesuai porsi masing-masing supaya tidak ada yang rugi.',
  alternates: { canonical: '/panduan/cara-split-bill' },
}

export default function CaraSplitBillPage() {
  return (
    <InfoPage
      title="Cara bagi tagihan restoran secara adil"
      lead="Bagi rata itu cepat, tapi sering bikin ada yang membayar lebih. Panduan ini menjelaskan cara membagi tagihan restoran per item, lalu membagi pajak dan service secara proporsional."
    >
      <InfoSection title="Kenapa bagi rata sering tidak adil">
        <p>
          Bayangkan kamu makan berempat. Satu orang memesan steak dan es teh, sementara yang lain hanya makan nasi
          goreng. Kalau tagihan dibagi rata, orang yang pesanannya paling murah ikut menanggung harga steak temannya.
          Selisihnya bisa puluhan ribu per orang, dan lama-lama bikin malas makan bareng.
        </p>
        <p>
          Cara yang lebih adil: setiap orang membayar harga pesanannya sendiri, lalu biaya yang tidak melekat pada satu
          orang — pajak, service, dan diskon — dibagi sesuai besar pesanan masing-masing. Yang pesan sedikit membayar
          lebih sedikit, tanpa perlu hitung manual pakai kalkulator.
        </p>
      </InfoSection>

      <InfoSection title="Lima langkah membagi tagihan">
        <ol className="list-decimal pl-5 flex flex-col gap-1.5">
          <li>Foto struknya, atau ketik totalnya manual kalau struknya tidak ada.</li>
          <li>Tambahkan nama teman yang ikut patungan. Cukup nama panggilan, tidak perlu nomor HP.</li>
          <li>
            Ketuk nama di tiap item untuk menandai siapa yang memesan apa. Satu item bisa dibagi rata ke beberapa
            orang, atau diatur per porsi kalau jumlahnya banyak.
          </li>
          <li>Pajak, service, ongkir, dan diskon dibagi otomatis mengikuti porsi pesanan tiap orang.</li>
          <li>Bagikan satu link. Tiap orang melihat nominal bagiannya dan ke mana harus transfer.</li>
        </ol>
      </InfoSection>

      <InfoSection title="Contoh hitungan sederhana">
        <p>
          Tiga orang makan bareng: A memesan nasi goreng Rp30.000, B memesan mie goreng Rp25.000, dan C memesan es teh
          Rp10.000. Subtotal pesanannya Rp65.000.
        </p>
        <ul>
          <li>Service 5% = Rp3.250 dan pajak PB1 10% = Rp6.500, sehingga total tagihan menjadi Rp74.750.</li>
          <li>Pajak dan service dibagi proporsional: A Rp4.500, B Rp3.750, dan C Rp1.500.</li>
          <li>Hasil akhirnya: A membayar Rp34.500, B Rp28.750, dan C Rp11.500.</li>
        </ul>
        <p>
          Bandingkan dengan bagi rata: tiap orang membayar sekitar Rp24.917. C jadi kelebihan lebih dari sepuluh ribu,
          sementara A justru kurang bayar. Pada pembagian per item, jumlah bagian semua orang selalu sama persis dengan
          total struk, jadi tidak ada rupiah yang hilang atau dobel.
        </p>
      </InfoSection>

      <InfoSection title="Pajak: ditambahkan atau sudah termasuk?">
        <p>
          Di sebagian tempat pajak dan service sudah termasuk di harga item; di tempat lain ditambahkan di akhir
          struk. SplitBillin mengikuti angka yang tercetak. Kalau pajak sudah termasuk, angkanya tidak ditambahkan lagi
          ke total — cukup nyalakan saklar “sudah termasuk” saat memeriksa struk, dan perhitungannya menyesuaikan.
        </p>
        <p>
          Baris seperti ongkir, biaya layanan aplikasi, dan biaya kemasan juga diperlakukan sama: dibagi proporsional
          ke semua orang yang ikut, sesuai nilai pesanannya.
        </p>
      </InfoSection>

      <InfoSection title="Tips supaya cepat selesai">
        <ul>
          <li>Periksa nama dan harga item setelah scan; hasil pembacaan otomatis bisa keliru dan mudah dikoreksi.</li>
          <li>Untuk minuman atau lauk yang dipesan banyak, pakai opsi “atur per porsi” alih-alih menandai berulang.</li>
          <li>
            Diskon yang hanya berlaku untuk satu item ditempelkan pada item itu, sedangkan voucher seluruh pesanan
            dibagi ke semua orang.
          </li>
          <li>Bilang ke teman siapa yang nalangin dulu, supaya mereka tahu harus transfer ke siapa.</li>
        </ul>
        <p>
          Siap mencoba?{' '}
          <Link href="/baru?mode=scan" className="text-primary underline underline-offset-2">
            Buat split bill sekarang
          </Link>{' '}
          — gratis dan tanpa daftar.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
