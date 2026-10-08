# SplitBillin — brief desain UI

## 1. Produk

Web app split bill **gratis, tanpa login, mobile-first**. Pengguna memfoto struk, item terbaca otomatis (OCR dengan AI), lalu pengguna membagi pesanan ke teman-temannya dan membagikan satu link berisi rincian "kamu bayar berapa ke siapa". Pembayaran terjadi di luar app (transfer bank, e-wallet, QRIS); app hanya menampilkan info bayar dan status lunas yang ditandai manual oleh pembuat.

Referensi alur dan bentuk: fitur Split Bill GoPay (empat screenshot terlampir). Yang ditiru hanya pola tata letak dan alurnya. **Jangan memakai logo, warna merek, atau ilustrasi GoPay**; buat identitas visual sendiri.

**Bahasa:** Indonesia saja, santai, memakai "kamu" (contoh: "Foto struk biar kami bantu itungin"). **Mata uang:** Rupiah tanpa desimal, format `Rp21.907` (titik ribuan, tanpa spasi).

## 2. Pengguna dan konteks

- **Pembuat:** orang yang nalangin tagihan di restoran atau minimarket. Memegang HP dengan satu tangan, sering di tempat ramai, ingin selesai kurang dari dua menit.
- **Anggota:** teman yang menerima link lewat WhatsApp. Tidak punya akun dan tidak mau membuat akun. Hanya ingin tahu "aku bayar berapa, ke mana".
- Perangkat utama: HP 360–430 px. Desktop didukung tapi cukup satu kolom di tengah (maks sekitar 480 px) dengan latar kosong di kiri-kanan.

## 3. Prinsip desain

1. **Jumlah uang adalah bintangnya.** Nominal besar, tebal, mudah dipindai. Kolom harga rata kanan dengan angka tabular.
2. **Satu keputusan per layar** di alur membuat; progres selalu terlihat.
3. **Aman dikoreksi.** OCR bisa salah, jadi layar koreksi item harus terasa normal, bukan layar error.
4. **Jujur soal batas.** Tidak ada login, link adalah kunci, struk tidak disimpan. Sampaikan ini tanpa menakut-nakuti.
5. **Cepat terasa.** Scan sekitar 3–9 detik; tampilkan progres nyata, bukan spinner kosong.
6. Tombol aksi utama selalu di bawah layar (zona jempol), lebar penuh.
7. Mendukung mode gelap dan terang. Target kontras WCAG AA, area sentuh minimal 44 px.

## 4. Gaya visual (arah, bukan paksaan)

- Latar abu muda dengan **kartu putih bersudut besar** (radius 16–24 px), seperti referensi.
- **Kartu struk bergaya tiket**: tepi bergerigi di atas dan bawah, garis putus-putus sebagai pemisah bagian, bulatan "sobekan" di sisi kiri-kanan pemisah.
- Satu warna aksen untuk tombol utama, status lunas, dan sorotan "kamu". Warna kedua untuk peringatan (amber) dan bahaya (merah, hanya untuk hapus/tolak/belum lunas).
- Avatar anggota: lingkaran dengan warna dan emoji/inisial otomatis; tiap anggota punya warna tetap sepanjang alur.
- Tipografi: satu keluarga sans yang ramah; angka nominal boleh memakai gaya berbeda (serif atau bold) seperti `Rp271.000` di referensi.
- Ilustrasi ringan untuk keadaan kosong dan error (struk, kamera, jam pasir). Tidak perlu fotografi.

## 5. Peta layar

| Rute | Layar |
|---|---|
| `/` | Beranda |
| `/baru` | Alur membuat (wizard, banyak langkah) |
| `/b/[id]` | Halaman rincian untuk anggota (publik lewat link) |
| `/b/[id]/kelola/[token]` | Halaman rincian untuk pembuat (link rahasia) |
| `/masuk` | Masuk dengan Google (bottom sheet atau halaman) |
| `/riwayat` | Riwayat split bill (khusus akun) |
| `/akun` | Menu akun: profil, teman tersimpan, keluar, hapus akun |
| `/tentang` | Cara kerja dan privasi |
| error | 404, link kedaluwarsa, token salah, 500 |

## 5a. Dua mode: Tamu dan Akun

| | Tamu (default, tanpa daftar) | Akun (masuk dengan Google, gratis) |
|---|---|---|
| Buat dan bagikan split bill | ✓ semua fitur | ✓ semua fitur |
| Riwayat | hanya di browser ini; hilang bila data browser dihapus | **lintas perangkat** |
| Kelola bill | lewat link kelola rahasia | **lewat akun**, tanpa link rahasia |
| Teman tersimpan (saran nama anggota) | di browser ini | **di akun** |
| Kuota scan struk | terbatas per perangkat, ada verifikasi anti-bot | lebih longgar |
| Bill yang dibuat sebagai tamu | – | bisa **diklaim** ke akun |

Prinsip: **tamu tidak pernah diblokir dari fitur inti.** Akun hanya soal kenyamanan. Ajakan masuk harus halus dan muncul di titik yang bernilai, bukan memaksa.

Layar dan elemen yang perlu didesain:
- Tombol **Masuk** di header (tamu) atau avatar akun (sudah masuk) dengan menu kecil.
- **Layar masuk**: satu tombol "Lanjut dengan Google", teks "Gak wajib kok, kamu tetap bisa pakai tanpa akun", dan dua baris tentang data apa yang disimpan.
- **Ajakan masuk** di tiga titik: layar sukses ("Simpan di akunmu biar gak hilang"), Beranda saat ada riwayat lokal, dan saat kuota scan tamu habis ("Masuk untuk kuota lebih banyak"; fitur manual tetap bebas).
- **Klaim bill**: banner di halaman kelola tamu, "Masukkan split bill ini ke akunmu", setelah masuk.
- **Riwayat** `/riwayat`: daftar bill (nama tempat, tanggal, total, "3 dari 5 lunas", chip status), filter Semua / Belum lunas / Lunas, pencarian nama tempat, keadaan kosong, tap membuka halaman kelola.
- **Akun** `/akun`: avatar dan email, kelola daftar teman tersimpan, keluar, dan **Hapus akun beserta semua datanya** (konfirmasi tegas).

## 6. Beranda `/`

- Header: nama/logo app, tombol tema terang-gelap, link "Tentang", dan tombol **Masuk** (tamu) atau avatar akun (sudah masuk).
- Judul singkat dan satu kalimat nilai: bagi tagihan, hitung otomatis dari struk, bebas dipakai tanpa daftar.
- **Dua kartu pilihan** (seperti "Bikin baru" di referensi):
  - **Hitung otomatis pake struk**, ikon kamera. Deskripsi: "Foto struk atau ambil dari galeri, biar kami bantu itungin."
  - **Atur jumlahnya sendiri**, ikon bagi. Deskripsi: "Lebih cepat buat bagi rata, gak usah pake struk."
- **Draf** (chip di pojok, seperti "Draf (0)" di referensi): alur yang belum selesai, disimpan di browser perangkat ini. Tap untuk melanjutkan.
- **Split bill di perangkat ini**: daftar bill yang pernah dibuat dari browser ini (nama tempat, tanggal, total, dan "belum lunas Rp… / semua lunas"), supaya pembuat bisa kembali tanpa mencari link. Untuk tamu disimpan di browser; beri catatan "hanya ada di perangkat ini". Untuk akun, bagian ini diganti **Riwayat** lintas perangkat.
- Catatan kecil di bawah: "Gratis. Foto struk tidak disimpan." dengan link ke `/tentang`.
- Keadaan: kosong (belum pernah membuat), ada draf, ada riwayat.

## 7. Alur membuat `/baru`

Bagian atas: tombol kembali, judul, indikator langkah (Struk → Item → Anggota → Bagi → Bayar → Selesai). Keluar di tengah jalan menawarkan "Simpan sebagai draf?".

### 7.1 Langkah 1 — Ambil struk (jalur otomatis)

- Dua tombol besar: **Ambil foto** (membuka kamera) dan **Pilih dari galeri**.
- Tips foto dalam tiga baris ikon: terang, rata, seluruh struk masuk.
- Setelah dipilih: pratinjau dengan tombol putar, potong, dan ulang. Gambar dikecilkan di browser sebelum dikirim.
- Verifikasi anti-bot (Cloudflare Turnstile) berjalan tak terlihat; kalau butuh interaksi, tampilkan di sini.
- Tautan kecil: "Gak punya struk? Atur jumlahnya sendiri" (pindah ke jalur manual).

### 7.2 Langkah 2 — Memindai (loading)

- Pratinjau struk dengan garis pindai bergerak; teks progres bergantian: "Membaca struk…", "Mengenali item…", "Menghitung total…".
- Perkiraan: "Biasanya beberapa detik". Setelah sekitar 15 detik muncul "Lebih lama dari biasanya…" dengan tombol **Isi manual saja**.
- Tombol **Batal** selalu ada.
- Keadaan gagal, masing-masing dengan teks dan aksi sendiri:
  - Bukan struk: "Ini sepertinya bukan struk" → Ambil ulang / Isi manual.
  - Gagal membaca atau batas waktu: Coba lagi / Isi manual.
  - Terlalu banyak percobaan (batas per perangkat): "Kamu sudah scan beberapa kali, coba lagi X menit lagi."
  - Kuota scan harian habis (batas global): "Kuota scan hari ini sudah habis. Kamu masih bisa mengisi manual, atau coba lagi besok." Jangan menyalahkan pengguna.
  - Gagal verifikasi anti-bot: ulangi verifikasi.

### 7.3 Langkah 3 — Periksa dan koreksi item (layar terpenting)

- **Thumbnail struk** menempel di atas; tap untuk memperbesar (zoom, geser) supaya bisa mencocokkan sambil mengedit. Foto hanya ada di layar ini; setelah bill dibuat foto dibuang.
- **Banner hasil pemeriksaan** otomatis:
  - Hijau: "Hitungan cocok dengan total di struk."
  - Amber: "Ada selisih Rp1.200 antara item dan total. Cek item atau biaya di bawah."
- **Daftar item**; tiap baris: nama, `qty × harga satuan`, total baris, dan (bila ada) potongan item ditampilkan hijau negatif (seperti `Diskon -6.400` di referensi). Tap baris membuka editor (bottom sheet): nama, jumlah (stepper), harga satuan, potongan, tombol hapus.
- Tombol **+ Tambah item**.
- Bagian **biaya tingkat struk** (setiap baris bisa diedit atau dihapus):
  - Diskon / voucher (untuk seluruh pesanan)
  - Service
  - Pajak (PB1/PPN) dengan saklar **"Sudah termasuk di harga"**
  - Biaya lain (bisa lebih dari satu: ongkir, biaya layanan, kemasan) dengan tombol + Tambah
  - Pembulatan
- Ringkasan: Subtotal item, Total yang dihitung, dan **Total di struk** (bisa diedit). Kalau tidak sama, tampilkan selisihnya dan tombol "Pakai total dari struk".
- Bidang di atas: **nama tempat** dan **tanggal** (terisi otomatis dari struk, bisa diubah).
- Item dengan keyakinan rendah (jika ada) diberi tanda kecil agar pengguna memeriksanya.
- CTA: **Lanjut**.

### 7.4 Langkah 4 — Anggota

- Input nama + tombol tambah; daftar chip anggota yang bisa dihapus. Anggota pertama bisa diisi cepat dengan "Aku" (nama pembuat).
- Avatar dan warna dibuat otomatis, bisa diganti emoji.
- Minimal 2 orang. Teks bantu: "Cukup nama panggilan, gak perlu nomor HP."
- Pilihan **Siapa yang nalangin?** (menentukan "Bayar ke" di halaman anggota).
- Anggota disimpan di perangkat ini sebagai saran cepat untuk split bill berikutnya.

### 7.5 Langkah 5 — Bagi pesanan

- Daftar item; tiap item punya baris **chip anggota** yang bisa di-tap untuk menandai siapa yang ikut. Item dibagi rata di antara yang ditandai.
- Tombol cepat: **Semua ikut** (per item dan untuk seluruh daftar), **Kosongkan**.
- Item dengan qty lebih dari 1: opsi **Atur per porsi** yang menampilkan stepper per anggota (misalnya 12 nasi putih dibagi 3, 4, 5).
- Item yang belum ditandai ditandai peringatan; tombol lanjut menjelaskan "2 item belum dibagi".
- **Panel ringkasan menempel di bawah** (bisa ditarik naik): total per anggota secara langsung. Ini bagian penting: nominal berubah tiap kali chip di-tap.
- Penjelasan satu baris: "Diskon, pajak, dan biaya lain dibagi sesuai porsi pesananmu."

### 7.6 Langkah 6 — Info pembayaran

- **Cara bayar** (bisa lebih dari satu), tiap entri: jenis (Bank / E-wallet / Lainnya), nama bank atau e-wallet, nomor, atas nama. Pilihan cepat untuk nama bank dan e-wallet populer di Indonesia.
- **Unggah gambar QRIS** (opsional): pilih, pratinjau, hapus.
- Catatan untuk teman (opsional), misalnya "Transfer sebelum Jumat ya".
- **Peringatan privasi** yang terlihat: "Siapa pun yang punya link bisa melihat info ini. Jangan isi data yang tidak mau dibagikan."

### 7.7 Langkah 7 — Tinjau dan buat

- Ringkasan kartu tiket: nama tempat, tanggal, total, siapa yang nalangin, daftar anggota dengan nominal.
- Lamanya berlaku: "Split bill ini aktif 90 hari."
- CTA: **Buat split bill**. Keadaan memproses dan keadaan gagal (coba lagi; draf tetap aman).

### 7.8 Layar sukses

- Animasi/ilustrasi singkat.
- Dua blok yang tidak boleh tertukar:
  - **Link untuk dibagikan** (utama, hijau): tombol Salin, tombol **Kirim lewat WhatsApp** dengan teks siap kirim, tombol Bagikan sistem (share sheet).
  - **Link kelola — rahasia** (amber): tombol Salin, penjelasan "Hanya kamu yang boleh memegang ini. Dengan link ini kamu bisa mengubah dan menandai lunas. Jangan kirim ke grup." Tombol **Simpan di perangkat ini**.
- Tombol "Lihat halaman kelola" dan "Buat split bill lagi".
- **Pengguna akun:** bill otomatis masuk Riwayat, jadi blok link kelola rahasia tidak ditampilkan. Pengguna tamu melihat ajakan halus "Simpan di akunmu biar gak hilang".

### 7.9 Jalur manual ("Atur jumlahnya sendiri")

Melewati scan dan koreksi item. Langkah: **Total dan keterangan** (nama acara, total, tanggal) → **Anggota** → **Cara membagi**: tiga mode berupa tab: **Rata** (otomatis), **Nominal** (isi jumlah per orang; tampilkan sisa yang belum terbagi), **Persen** (isi persen; total harus 100) → **Info pembayaran** → **Tinjau** → Sukses. Rincian pesanan per orang tidak ada di jalur ini.

## 8. Halaman rincian untuk anggota `/b/[id]`

Terinspirasi layar "Rincian split bill" di referensi.

- **Kartu tiket** di bagian atas: ikon tempat (tidak ada foto struk karena tidak disimpan), nama tempat, tanggal. Pemisah putus-putus.
- **Ringkasan**: "Total split bill Rp271.000", dan "Rp222.334 belum dibayar" berwarna merah. **Dibayar ke: [nama yang nalangin]**.
- **Selector "Kamu yang mana?"**: chip daftar anggota. Memilih satu akan menyorot baris itu dengan latar hijau dan label "(Kamu)", memunculkan **kartu "Kamu perlu bayar Rp21.907"** yang besar di atas, dan diingat di perangkat ini.
- **Daftar anggota** (avatar, nama, nominal, chip status **Lunas**/**Belum**). Setiap anggota punya **"Rincian pesanan"** yang bisa dibuka (tautan bergaris bawah + chevron): daftar item yang diambil beserta porsinya, potongan item (hijau), lalu baris biaya (Diskon, Pajak, Lainnya) yang dialokasikan, seperti `MABELL SS S.TEMPONG x1 17.400 / Diskon −6.400 / Diskon −1.358 / Lainnya 1.164` di referensi.
- **Kartu cara bayar**: nama bank/e-wallet, nomor **tersamar** (`•••• •••• 4923`) yang membuka penuh saat di-tap, tombol **Salin nomor**, atas nama; gambar **QRIS** yang bisa diperbesar dan diunduh; catatan dari pembuat.
- Catatan kaki: "Pembayaran dilakukan di luar aplikasi ini. Status lunas ditandai oleh pembuat." dan masa berlaku: "Berlaku sampai 6 Jan 2027."
- Tombol bawah (sticky) setelah memilih "kamu": **Salin nomor & nominal**.
- Tombol kecil "Ada yang salah? Hubungi pembuat" (menyalin pesan ke pembuat).
- Keadaan: memuat (skeleton kartu tiket), semua sudah lunas (ucapan dan konfeti halus), kedaluwarsa, tidak ditemukan.

## 9. Halaman kelola pembuat `/b/[id]/kelola/[token]`

Sama dengan halaman anggota, ditambah:

- **Banner mode pembuat** (amber): "Kamu sedang di halaman kelola. Jangan bagikan link ini."
- Setiap anggota: **saklar/tombol Tandai lunas** (dengan waktu ditandai dan opsi batal), dan tombol **Tagih** yang membuka WhatsApp dengan pesan terisi ("Hai Budi, bagianmu di GEDUNG RE Rp21.907. Detail: …").
- Ringkasan di atas: berapa orang sudah lunas, sisa yang belum masuk.
- **Edit split bill**: membuka kembali langkah item, anggota, pembagian, dan info bayar (perubahan memengaruhi nominal; tampilkan konfirmasi). Halaman anggota menampilkan label seperti di referensi: "Split bill ini diperbarui sama yang bikin."
- Salin link anggota, **Perpanjang masa berlaku**, **Hapus split bill** (konfirmasi dengan teks tegas, tombol merah).
- Link rahasia dengan token salah atau yang sudah dihapus: layar "Link ini tidak valid".

## 10. Halaman `/tentang`

Cara kerja dalam tiga langkah bergambar; **privasi**: foto struk hanya dikirim ke layanan AI untuk dibaca dan tidak disimpan; data bill dihapus otomatis setelah 90 hari; info bayar bisa dilihat siapa pun yang punya link; tanpa akun dan tanpa pelacakan iklan. Batasan: hasil scan bisa keliru, periksa sebelum membagikan. Cara melapor masalah.

## 11. Komponen yang perlu didesain

Kartu pilihan, kartu tiket bergerigi, baris item (+ varian potongan), bottom sheet editor, stepper, chip anggota (pilih/tidak, ukuran, warna), avatar, panel ringkasan menempel, banner (info, sukses, amber, bahaya), chip status (Lunas/Belum), baris "rincian pesanan" yang bisa dibuka, kolom input nominal Rupiah, input nomor rekening tersamar, pemilih gambar dengan pratinjau, tombol (utama, sekunder, bahaya, teks), indikator langkah, skeleton, toast "Tersalin", dialog konfirmasi, keadaan kosong, halaman error.

## 12. Keadaan yang harus tergambar

Memuat, kosong, galat jaringan, offline, sukses, izin kamera ditolak, gambar terlalu besar atau format tidak didukung (otomatis diubah), nama anggota duplikat, total tidak cocok, item belum dibagi, pembagian persen tidak 100, link kedaluwarsa, mode terang dan gelap, layar sempit 320 px, teks panjang (nama item panjang terpotong dengan elipsis, nominal tidak boleh terpotong).

## 13. Data contoh (agar desain terasa nyata)

**A. Minimarket (struk kertas, ada diskon per item, pajak sudah termasuk)** — GEDUNG RE, 29 Jun 2026. Item: Indomi Goreng Spc 80 ×1 3.200; Bihunku Grg Spcl 60G ×2 8.000; Indomie Tori Kara 89 ×2 13.000; Idm Tas Rmh Lngk Kcl ×1 4.000; Indomie Soto Pd.D 76 ×2 6.200; Indomi Sblak Hot/J75 ×1 3.100; Mabell SS S.Tempong ×2 17.400 (voucher −6.400); Gaga 100 Gr.Jlpno 85 ×2 7.800 (voucher −600). PPN 6.214 sudah termasuk. **Total Rp55.700**, 5 anggota (Samuel yang nalangin, Evan, Sulthan, Aaakuu, dan satu lagi).

**B. Restoran (pajak ditambahkan, qty besar)** — Bebek, 5 Apr 2026. Bebek Gongso Paha ×1 34.091; Bebek Original Paha ×8 269.088; Ayam Kremes ×2 65.454; Nasi Putih ×12 109.092; Es Kelapa Muda Jeruk ×1 25.455; Es Timun Serut ×2 30.910; Air Mineral ×4 47.272; Es Teh Manis ×3 35.454; Es Teh Tawar ×1 8.181; Tumis Tauge ×1 17.273. Subtotal 642.270, PB1 64.227, **Total Rp706.497**.

**C. Pesan-antar (biaya lain)** — Subtotal 104.150, voucher −57.283, ongkir 10.000, biaya layanan 4.000, kemasan 3.000, **Total Rp63.867**.

Nama anggota contoh: Samuel, Evan, Sulthan, Rina, Budi, Dewi (campur nama panjang dan pendek).

## 14. Di luar cakupan

Login selain Google, menyimpan foto struk (foto hanya ada di layar koreksi, lalu dibuang), pembayaran di dalam app dan status lunas otomatis, akses kontak HP, notifikasi push, aplikasi native, multi-bahasa, mata uang selain Rupiah.
