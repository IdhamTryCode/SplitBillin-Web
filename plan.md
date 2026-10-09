# SplitBillin — rencana implementasi

Web app split bill gratis, mobile-first, dengan scan struk memakai AI. Dokumen ini berdiri sendiri: semua keputusan, spesifikasi, rujukan desain, dan urutan kerja ada di sini supaya implementasi tinggal dijalankan.

Dokumen pendamping di folder yang sama: [design-brief.md](design-brief.md) (spesifikasi fitur dan tiap layar, versi lengkap dengan keadaan dan teks).

## 1. Ringkasan produk

- Pengguna memfoto struk, item terbaca otomatis, lalu membagi pesanan ke teman, dan membagikan satu link rincian "kamu bayar berapa ke siapa".
- Pembayaran terjadi di luar app (transfer, e-wallet, QRIS). App menampilkan info bayar dan status lunas yang ditandai manual oleh pembuat.
- **Dua mode.** Tamu (tanpa login): link kelola rahasia, riwayat di browser. Akun (Google saja): riwayat lintas perangkat, kelola tanpa link rahasia, klaim bill tamu, teman tersimpan (nama saja), kuota scan lebih longgar. Tamu tidak pernah diblokir dari fitur inti.
- Foto struk **tidak pernah disimpan**. Hanya gambar QRIS yang disimpan (opsional, diunggah pembuat).

Di luar cakupan: payment gateway dan status lunas otomatis, menyimpan foto struk, akses kontak HP, notifikasi push, aplikasi native, multi-bahasa, mata uang selain Rupiah, login selain Google, rekening teman tersimpan, grup teman, tab "Tagihan".

## 2. Keputusan yang sudah final

| Hal | Keputusan | Dasar |
|---|---|---|
| Model OCR | `gemini-3-1-flash-lite` lewat Kenari (`https://kenari.id/v1`, OpenAI-compatible) | Diuji pada 5 struk asli + 1 sintetis: 2–9 dtk, akurat, sekitar Rp25 per scan |
| Bukan dipakai | MiniMax-M3 (10–34 dtk, model penalaran), MiniMax-M3.1-Flash (66–94 dtk, sering kena batas token), `gemini-3-8-flash` (8–31 dtk, tahun salah), MiniMax M2.x (teks saja), GLM (saldo akun belum ada, belum teruji) | Latensi tidak layak untuk web |
| Framework | Next.js 15 App Router, React 19, TypeScript, Tailwind 4, zod 4 (versi disamakan dengan catetin-duit) | |
| Data | Supabase Postgres + Storage + Auth, hanya diakses server dengan service role | |
| Hosting | Vercel, region `sin1`, `maxDuration` kecil di `/api/scan` (mis. 30 dtk) | Batas durasi Vercel (300 dtk default untuk Hobby dengan fluid compute) jauh di atas kebutuhan |
| Anti-penyalahgunaan | Turnstile + rate limit per IP + kuota per akun + batas harian global | Rotasi IP bisa melewati rate limit per IP |
| Login | Google saja, via Supabase Auth, dikerjakan setelah mode tamu | |
| Navigasi bawah | Hitung, Riwayat, Pengaturan (tanpa "Tagihan") | |
| Teman tersimpan | Nama saja | Tidak menyimpan rekening orang lain |
| Kuota scan | Variabel lingkungan; angka final dari anggaran | Desain menulis 5/25 per hari, itu angka karangan |
| Masa berlaku bill | 90 hari, dibersihkan cron harian | |
| Foto struk | Tidak disimpan | Storage gratis cepat penuh (Supabase 1 GB, Vercel Blob Hobby 1 GB), plus privasi |

Batas gratis yang relevan (dari dokumentasi resmi): Supabase Free 500 MB database, 1 GB storage, 5 GB egress, 50.000 MAU, project di-pause setelah 1 minggu tanpa aktivitas; Vercel body request maksimum 4,5 MB.

## 3. Yang sudah ada di folder proyek

- `.env` (diisi pengguna; berisi key GLM, MiniMax, Kenari; **jangan dicetak atau di-commit**) dan `.env.example`, `.gitignore` (mengabaikan `.env*`, `receipts/*` kecuali `sample-*`, `results*/`).
- `scripts/receipt-prompt.mjs` — **prompt ekstraksi v2** (sumber kebenaran prompt; dipindahkan ke `src/lib/llm/scan-receipt.ts`).
- `scripts/ocr-test.mjs` — uji lintas model dengan skor otomatis terhadap `*.truth.json`. Jalankan: `node --env-file=.env scripts/ocr-test.mjs receipts kenari`. Env opsional: `MAX_TOKENS`, `OUT_DIR`, `KENARI_MODEL`.
- `scripts/make-sample-receipt.py` — membuat struk sintetis + jawabannya.
- `receipts/` — 5 foto struk asli (tidak di-commit) + `*.truth.json` + `sample-warung.jpg`.
- `design-brief.md` — brief desain yang sudah diserahkan ke Claude Design.
- `stitch_splitbillin_ui_web_app_2/` — desain versi 2 dari Claude Design (acuan visual). `stitch_splitbillin_ui_web_app/` adalah versi 1, sudah usang.

Hasil uji terakhir (prompt v2, `gemini-3-1-flash-lite`, dua kali jalan, hasil sama): 5 dari 6 struk cocok penuh dengan jawaban; satu selisih hanya di qty ambigu pada screenshot aplikasi pesan-antar. Waktu 2–9 dtk, sekitar 1.760 token masuk dan 200–650 keluar.

## 4. Arsitektur

```
Browser (wizard /baru)
  └─ kompres gambar (canvas, sisi terpanjang 1600 px, JPEG 0,8)
  └─ POST /api/scan  ──▶ Turnstile ▶ rate limit/kuota ▶ Kenari (vision) ▶ zod ▶ hitung ulang ▶ JSON
  └─ koreksi item ▶ anggota ▶ bagi ▶ info bayar ▶ server action buat bill ▶ /b/[id]
Supabase (service role, hanya dari server): bills, friends, rate_limits, bucket private "qris"
Vercel cron harian: hapus bill kedaluwarsa + QRIS-nya + rate_limits lama
```

Prinsip: LLM hanya menerjemahkan gambar ke JSON. Semua hitungan dilakukan kode (pola catetin-duit).

### 4.1 Rute

| Rute | Isi |
|---|---|
| `/` | Beranda: dua pilihan, draf, riwayat lokal (tamu) |
| `/baru` | Wizard: Struk → Item → Anggota → Bagi → Bayar → Tinjau → Sukses; jalur manual |
| `/b/[id]` | Rincian untuk anggota (publik lewat link, `noindex`) |
| `/b/[id]/kelola/[token]` | Rincian pembuat (tamu, link rahasia) |
| `/masuk`, `/riwayat`, `/akun` | Mode akun |
| `/tentang`, `/ketentuan`, `/privasi` | Informasi |
| `/api/scan`, `/api/cron/daily` | API |

### 4.2 Model data

`bills`: `id` text PK (acak, pendek), `owner_id` uuid null (FK `auth.users`, `ON DELETE CASCADE`), `edit_token_hash` text null, `data` jsonb, `created_at`, `expires_at` (default 90 hari). `friends`: `user_id`, `name` (unik per pengguna). `rate_limits` + fungsi `check_rate_limit` disalin dari catetin-duit. RLS aktif tanpa policy di semua tabel (anon key tidak bisa membaca apa pun). Bucket Storage `qris` private; unggah lewat server action; tampil lewat signed URL berumur pendek.

`data` (zod `BillSchema`, `version: 1`):

```
mode: 'receipt' | 'manual'
merchant: string(1..80), date: 'YYYY-MM-DD' | null
items: [{ id, name, qty:int≥1, unit_price:int≥0, line_total:int≥0, discount:int≥0 }]
fees:  { discount, service, other:[{name, amount}], tax, tax_included:boolean, rounding, adjustment }
total: int                      // jumlah yang dibayar, sudah dikonfirmasi pengguna
members: [{ id, name, color, is_payer, paid_at: iso|null }]
assignments: { [item_id]: [{ member_id, units?:int }] }   // units hanya untuk "atur per porsi"
manual: { split:'equal'|'amount'|'percent', values:{[member_id]:number} } | null
payment: { methods:[{ kind:'bank'|'ewallet'|'other', provider, number, holder }], qris_path|null, note }
```

Semua uang adalah bilangan bulat rupiah. Validasi ketat di server pada setiap server action.

### 4.3 Hitungan pembagian (`src/lib/split.ts`, fungsi murni, diuji)

1. Per item: `net = line_total − discount`. Dibagi ke anggota yang ditandai (rata, atau per `units`) dengan metode sisa terbesar sehingga jumlahnya tepat `net`.
2. `member_items[m]` = jumlah bagian item anggota itu.
3. Biaya tingkat struk `E = −discount + service + Σother + (tax_included ? 0 : tax) + rounding + adjustment`. Dibagi proporsional terhadap `member_items[m]` (rata bila semuanya 0), metode sisa terbesar. **Pajak yang sudah termasuk tidak pernah ditambahkan.**
4. `member_total = member_items + bagian E`. **Invarian: Σ `member_total` = `total`.**
5. `computed = Σnet − discount + service + Σother + pajakDitambah + rounding`. Jika `computed ≠ total` pengguna melihat banner selisih; tombol "Pakai total dari struk" menyimpan selisihnya sebagai `adjustment`.
6. Yang nalangin: bagiannya otomatis lunas. "Belum lunas" = jumlah bagian anggota lain yang belum `paid_at`.
7. Jalur manual: `equal`, `amount` (tampilkan sisa belum terbagi), `percent` (harus 100).

### 4.4 Scan struk (`POST /api/scan`)

1. Body ≤ 1,5 MB (tolak lebih). Hanya JPEG/PNG/WebP; **bukan PDF**.
2. **Turnstile fail-closed**: tolak kecuali token terverifikasi. Satu-satunya jalan tanpa token: `TURNSTILE_BYPASS=1` **dan** `NODE_ENV !== 'production'`. Secret kosong di production → 503 dan log error. Gagal menghubungi Cloudflare = ditolak.
3. Batas: per IP per menit, per IP per hari (tamu), per akun per hari (login), dan batas **global** harian. Semua angka dari env. Rate limit memakai `rateLimitDb` (atomik di Postgres, fallback memori).
4. Panggil Kenari: pesan `system` berisi prompt v2, pesan `user` hanya berisi gambar (data URL). `temperature: 0`, `max_tokens` cukup (tanpa penalaran, 1500 cukup), timeout 45 dtk, satu retry. Model: `LLM_MODEL=gemini-3-1-flash-lite`.
5. Hapus pagar kode dan `<think>` (`stripCodeFence`), validasi zod, hitung ulang di server dari item (jangan percaya subtotal dari model), lalu keluarkan `warnings`.
6. Respons: `{ ok:true, receipt, warnings }` atau `{ ok:false, code, retryAfter? }` dengan `code` ∈ `not_receipt | unreadable | rate_limited | quota_exceeded | bot_check_failed | upstream_error`. Kode ini memetakan satu-satu ke lima keadaan gagal di desain Memindai.

Skema keluaran model (v2, lihat `scripts/receipt-prompt.mjs` untuk teks aturan lengkap): `is_receipt`, `merchant`, `date`, `items[{name,qty,unit_price,line_total,discount}]`, `subtotal` (hanya bila tercetak, selain itu 0), `discount` (hanya potongan tingkat struk), `service_charge`, `other_fees[{name,amount}]`, `tax`, `tax_included`, `rounding`, `total`. Tanggal Indonesia HARI-BULAN-TAHUN, tahun 2 digit = 20xx.

### 4.5 Akun (mode login)

Supabase Auth Google via `@supabase/ssr`. Bill akun: `owner_id = auth.uid()`, dicek di server; tanpa token di URL. **Klaim**: server action memverifikasi hash token lalu mengisi `owner_id` pada bill tamu. Hapus akun menghapus bill dan teman miliknya (cascade). Riwayat tamu di `localStorage` (`sb:bills`), draf di `sb:draft`; keduanya hanya kenyamanan, aplikasi harus berfungsi tanpa.

### 4.6 Keamanan dan privasi

- Token kelola panjang dan acak, hanya hash disimpan, dibandingkan dengan `safeEqual`. Tombol bagikan hanya menyalin link lihat.
- Nomor rekening di `/b/[id]` tersamar dan terbuka saat diketuk; halaman `noindex`; form info bayar memperingatkan bahwa siapa pun yang punya link bisa melihatnya.
- Cron harian dijaga `CRON_SECRET` (`safeEqual`).
- **Teks yang boleh dipakai:** "Foto struk tidak disimpan oleh SplitBillin", "Data bill dihapus otomatis setelah 90 hari", "Info bayar bisa dilihat siapa pun yang punya link". **Dilarang:** statistik karangan, "dihapus dari server AI", "dienkripsi menyeluruh", "terenkripsi".

## 5. Rujukan desain

Sumber: `stitch_splitbillin_ui_web_app_2/` (acuan **visual**, bukan kode untuk disalin; semua `screen.png` rusak, jadi buka `code.html` di browser). Sumber kebenaran logika dan teks: dokumen ini dan `design-brief.md`.

**Token dan gaya:** `modern_receipt_fintech/DESIGN.md`. Pakai nilai di *frontmatter* (primary `#006948`, dipakai juga di konfigurasi Tailwind HTML); prosa di file yang sama menyebut `#059669`/`#10B981`, itu tidak konsisten, abaikan. Mode gelap: kanvas `#0B0F17`, kartu `#131B2E`. Tipografi: Plus Jakarta Sans (teks), JetBrains Mono (semua angka Rupiah, `tabular-nums`). Radius kartu 16–24 px, tombol 12 px, avatar penuh. Kartu tiket bergerigi dengan lubang sobekan dan garis putus-putus. Lebar maksimum 480 px di HP, dua kolom di desktop (maks 1040 px). **Abaikan:** `neon_tokyo/`, `splitbillin_smart_receipt_split_bill_app/` (duplikat Beranda).

| Layar | Rute | Acuan HTML (v2) | Yang harus diubah saat porting |
|---|---|---|---|
| Beranda | `/` | `beranda_splitbillin` | Buang "78% Tingkat Pelunasan", "OCR Intelligence", "REKOMENDASI AI", klaim "dihapus dari server AI". Angka riwayat dari data nyata. |
| Ambil struk | `/baru` langkah 1 | `langkah_1_ambil_struk` | Hapus "file PDF". Hanya gambar. |
| Memindai + gagal | `/baru` langkah 2 | `langkah_2_memindai_loading_status_gagal` | Hapus panel "Simulasi 5 Varian Error" dan "OCR Engine v2.4". Jadikan lima keadaan gagal komponen terpisah, dipetakan ke `code` API. Ganti jargon "anomali pada koneksi scanner cerdas". |
| Periksa item | `/baru` langkah 3 | `langkah_3_periksa_koreksi_item` | Tambah service, biaya lain (daftar), pembulatan, editor item (bottom sheet), banner selisih + "Pakai total dari struk". "Perhitungan Cocok 100%" → "Hitungan cocok dengan total di struk". Angka dari `split.ts`. |
| Anggota | `/baru` langkah 4 | `langkah_3_anggota` | Konsistenkan penomoran enam langkah. Data tiruan "Cafe Senja" diganti data nyata. |
| Bagi pesanan | `/baru` langkah 5 | `langkah_5_bagi_pesanan` | Angka dari `split.ts`; potongan melekat di item; opsi "atur per porsi". |
| Info bayar | `/baru` langkah 6 | **belum ada** | Buat sendiri: spesifikasi di `design-brief.md` §7.6. |
| Tinjau | `/baru` langkah 7 | **belum ada** | `design-brief.md` §7.7. |
| Sukses | `/baru` selesai | **belum ada** | Dua blok: link bagikan (hijau) dan link kelola rahasia (amber, hanya tamu). §7.8. |
| Jalur manual | `/baru` | **belum ada** | Total, anggota, tab Rata/Nominal/Persen. §7.9. |
| Rincian anggota | `/b/[id]` | `rincian_anggota_b_id` | Hapus "SOBEK TIKET", "VOUCHER AKTIF", "Konfirmasi transfer sebelum…", tombol "Konfirmasi via WhatsApp ke Samuel", baris PPN yang ditambahkan, ikon kartu kredit untuk bank. Rincian harus menjumlah ke nominal (lihat §6). |
| Kelola + klaim | `/b/[id]/kelola/[token]` | `halaman_kelola_klaim_bill` | "Tagih via WA" hanya membuka `wa.me?text=…` tanpa nomor. Hapus "Servis". "Sisa" dihitung dengan aturan §4.3 (penalang otomatis lunas). |
| Masuk | `/masuk` | `masuk_ke_splitbillin_google_auth` | Kuota ditulis variabel ("X scan per hari"). Hapus "Terenkripsi". Tautkan `/ketentuan` dan `/privasi` (yang harus dibuat). |
| Riwayat | `/riwayat` | `riwayat_akun_riwayat` | Hapus "Servis"; tambah keadaan kosong dan skeleton. |
| Akun | `/akun` | `pengaturan_akun_akun` | Teman tersimpan: nama saja (hapus rekening dan grup Kantor/Nongkrong/Kos). "Keluar dari Akun (Mode Tamu)" → "Keluar". Hapus klaim "dienkripsi". Angka konsisten dengan Riwayat. Kuota variabel. |
| Tentang, Ketentuan, Privasi, error (404, kedaluwarsa, token salah, 500) | — | **belum ada** | Buat sendiri dengan token yang sama. |
| Mode gelap, desktop | semua | **belum ada** | Dari tabel token DESIGN.md. |

Navigasi bawah di semua layar: Hitung, Riwayat, Pengaturan. Ikon Material Symbols boleh dipakai tetapi di-bundle (jangan lewat CDN). Tailwind CDN tidak dipakai; token masuk tema Tailwind 4.

## 6. Data uji (dipakai tes dan mock layar)

Struk GEDUNG RE (29 Jun 2026): item bruto 62.700, potongan item 7.000 (Mabell 6.400, Gaga 600), **total Rp55.700**, PPN 6.214 **sudah termasuk**. Anggota: Samuel (nalangin), Evan, Sulthan, Rina, Budi. Dengan pembagian di desain, bagian tiap orang harus berjumlah 55.700 dan "belum lunas" (setelah Samuel otomatis lunas dan Rina serta Budi sudah bayar) = 11.800 + 9.950 = **Rp21.750**, bukan 22.300. Rincian per orang dihitung `split.ts`, bukan disalin dari HTML.

Struk uji lain di `receipts/` beserta `*.truth.json`: Bebek (PB1 ditambahkan, qty 12), Indomaret 7 Apr (13 item, 5 voucher), Indomaret 27 Jan, screenshot aplikasi pesan-antar (ongkir, biaya layanan, kemasan, voucher tingkat struk).

## 7. Reuse dari catetin-duit (`D:\Project\catetin-duit`)

| Sumber | Dipakai untuk |
|---|---|
| `src\lib\telegram\parse.ts:158-250` | Pola panggilan LLM (fetch, abort, JSON mode, `stripCodeFence`, zod, hasil `{ok,error}` tanpa melempar). Diubah untuk gambar. |
| `src\lib\rate-limit.ts` + `supabase\migrations\20261001_rate_limits.sql` | `rateLimitDb`, `clientIp`, tabel dan fungsi `check_rate_limit` — salin apa adanya |
| `src\utils\supabase\admin.ts` | Klien service role |
| `src\lib\security.ts:7-11` | `safeEqual` |
| `src\lib\utils.ts:17-36` | `formatIDR` |
| `vercel.json`, `src\app\api\cron\daily\route.ts` | Pola cron dan region `sin1` |
| `.github\workflows\supabase-keepalive.yml` | Keepalive Supabase; ganti tabel ping ke `bills` |

Hal baru yang harus ditulis: kompresi gambar di browser, parser Rupiah (`17.400` dan `17.400,00`), skema struk, `split.ts`, `turnstile.ts`.

## 8. Variabel lingkungan

`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_BYPASS` (hanya lokal), `NEXT_PUBLIC_APP_URL`, `SCAN_PER_MIN_IP`, `SCAN_PER_DAY_GUEST`, `SCAN_PER_DAY_USER`, `SCAN_PER_DAY_GLOBAL`. Kunci LLM dan service role tidak pernah berawalan `NEXT_PUBLIC_`. File `.env` saat ini memakai `KENARI_*`, `GLM_*`, `MINIMAX_*` untuk skrip uji; aplikasi memakai `LLM_*` (isi dari `KENARI_*`).

## 9. Urutan pengerjaan (dengan kriteria selesai)

Langkah 1 (uji model) **sudah selesai**; hasilnya di §2–3.

**Status 9 Okt 2026:** langkah 2–9 sudah diimplementasikan dan diuji lokal. Yang masih menunggu kredensial: kunci Turnstile (langkah 5, sementara `TURNSTILE_BYPASS=1` di lokal), OAuth client Google (langkah 8, alur akun diuji dengan user sementara), dan deploy Vercel + secret keepalive (langkah 7).

2. **Scaffold.** Next.js + tema Tailwind 4 dari token DESIGN.md + font + vitest. `split.ts` dan `money.ts` beserta tes. *Selesai bila:* tes lulus, termasuk invarian Σ bagian = total pada struk uji (diskon per item, pajak termasuk dan ditambahkan, pembulatan) dan data uji §6 menghasilkan 21.750.
3. **Alur manual + halaman rincian.** Komponen dasar (kartu tiket, chip anggota, baris item, panel ringkasan), migrasi `bills`, server action buat bill, `/b/[id]`. *Selesai bila:* bill manual bisa dibuat dan dibuka dari perangkat lain.
4. **Scan.** `/api/scan` (prompt v2 di pesan system), kompresi gambar, layar Ambil struk, Memindai + lima keadaan gagal, Periksa item (termasuk banner selisih). *Selesai bila:* `scripts/ocr-test.mjs` lewat jalur API memberi skor setara (≥ 5/6) dan tiap `code` galat menampilkan layar yang benar.
5. **Perlindungan.** Rate limit, kuota, batas global, Turnstile fail-closed. *Selesai bila:* tes unit jalur Turnstile lulus dan scan berulang ditolak sebelum LLM dipanggil.
6. **Pembayaran.** Info bayar, QRIS (bucket private + signed URL), tandai lunas, Tinjau, Sukses, tombol WhatsApp. *Selesai bila:* alur tamu penuh jalan di HP.
7. **Operasional.** Cron pembersihan, deploy Vercel (`sin1`, `maxDuration`), keepalive Supabase. *Selesai bila:* bill kedaluwarsa terhapus hanya oleh panggilan cron sah.
8. **Mode Akun.** `/masuk`, `/riwayat`, `/akun`, klaim, teman tersimpan, kuota per tingkat, hapus akun. *Selesai bila:* login Google, bill muncul di perangkat kedua, klaim bill tamu berhasil, hapus akun menghapus semua data.
9. **Pelengkap.** `/tentang`, `/ketentuan`, `/privasi`, halaman error, mode gelap, desktop.

## 10. Yang perlu disiapkan pengguna

- **Sebelum langkah 3:** project Supabase baru (URL, anon key, service role key).
- **Sebelum langkah 4:** tetap memakai key Kenari yang sudah di `.env`.
- **Sebelum langkah 5:** akun Cloudflare dan satu widget Turnstile (site key + secret key); daftarkan `localhost` dan domain Vercel.
- **Sebelum langkah 7:** akun Vercel dan repo GitHub.
- **Sebelum langkah 8:** OAuth client Google (dikonfigurasi di Supabase Auth).
- **Keputusan anggaran:** biaya bulanan terburuk = Rp25 × `SCAN_PER_DAY_GLOBAL` × 30. Contoh 200 scan/hari ≈ Rp150 ribu per bulan. Tentukan angkanya sebelum link disebar ke publik, lalu isi tiga variabel kuota.
- Opsional: isi saldo GLM jika ingin membandingkan `glm-4.6v` di skrip uji.

## 11. Verifikasi menyeluruh

- `vitest`: `split.ts` (invarian jumlah, pajak termasuk tidak ditambahkan, pembulatan, penalang lunas), parser Rupiah, `turnstile.ts` (production tanpa secret → ditolak; production dengan bypass → ditolak; development dengan bypass → lolos; Cloudflare tak terjangkau → ditolak).
- Regresi scan: `node --env-file=.env scripts/ocr-test.mjs receipts kenari` (≥ 5/6 cocok, konsisten saat dihitung ulang, rata-rata di bawah 8 detik).
- Manual di HP (iPhone dan Android): foto kamera, koreksi item, bagi, simpan, buka link lihat di perangkat lain, tandai lunas dari link kelola.
- Penyalahgunaan: scan berulang sampai batas (ditolak sebelum LLM dipanggil), tanpa token Turnstile (ditolak), kuota global habis (pesan yang benar, jalur manual tetap bebas).
- Cron: bill dengan `expires_at` lampau; panggil dengan dan tanpa `CRON_SECRET`; row dan QRIS terhapus hanya pada panggilan sah.
- QRIS: URL objek langsung tanpa signed URL harus ditolak.
- Visual: render tiap layar di browser pada 360, 430, dan 1040 px, terang dan gelap, dan bandingkan dengan HTML acuan; cek tidak ada teks terlarang dari §4.6.
- Akun: login, klaim, hapus akun (bill dan teman ikut terhapus).
