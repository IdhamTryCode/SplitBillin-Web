# SplitBillin 🧾⚡

> Web app split bill gratis, mobile-first, dengan scan struk otomatis berbasis AI.

SplitBillin membantu kamu memfoto struk belanja/restoran, mengekstraksi daftar item dan harga secara otomatis menggunakan AI vision, membagikan porsi pesanan ke teman-teman, dan menghasilkan link rincian tagihan "siapa bayar berapa ke siapa".

---

## ✨ Fitur Utama

- 📸 **Scan Struk AI (Vision OCR)**: Ekstraksi item, qty, diskon per item, service charge, PPN, dan pembulatan secara cepat & akurat.
- 🧮 **Hitungan Otomatis Proporsional**: Diskon, pajak, dan biaya pengiriman dialokasikan secara adil sesuai porsi pesanan tiap orang dengan algoritma *largest remainder*.
- 👥 **Tanpa Login (Mode Tamu)**: Pengguna dapat langsung membuat dan mengelola tagihan via link kelola rahasia.
- 🔑 **Akun Google (opsional)**: Riwayat lintas perangkat, klaim bill tamu, teman tersimpan, kuota scan lebih longgar.
- 🔒 **Privasi & Keamanan Terjaga**: Foto struk **tidak pernah disimpan** di server. Hanya data bill berupa teks yang disimpan. Bill otomatis kedaluwarsa setelah 90 hari.
- 📱 **Mobile-First & Tactile UI**: Tampilan bergaya tiket struk fisik dengan mode terang dan gelap.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Plus Jakarta Sans, JetBrains Mono
- **Database & Storage**: Supabase Postgres, Storage, Auth
- **AI OCR Model**: `gemini-3-1-flash-lite` via Gateway Kenari (`https://kenari.id/v1`)
- **Validation**: Zod 4
- **Testing**: Vitest

---

## 🚀 Cara Menjalankan secara Lokal

### 1. Prasyarat
- Node.js >= 20.x
- npm / pnpm

### 2. Instalasi & Setup Environment
```bash
git clone https://github.com/IdhamTryCode/SplitBillin-Web.git
cd SplitBillin-Web
npm install
```

Salin file `.env.example` ke `.env` dan isi variabelnya. Minimal untuk lokal:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LLM_BASE_URL=https://kenari.id/v1
LLM_API_KEY=kn-your-api-key
LLM_MODEL=gemini-3-1-flash-lite

CRON_SECRET=string-acak
TURNSTILE_BYPASS=1   # hanya berlaku di luar production
```

Jalankan dua file di `supabase/migrations/` pada project Supabase (SQL Editor atau Supabase CLI).

### 3. Jalankan Development Server
```bash
npm run dev
```
Buka `http://localhost:3000` di browser.

### 4. Jalankan Unit Test
```bash
npm run test:run
```

---

## 🚢 Deploy (Vercel)

1. Import repo ke Vercel. Region `sin1` dan cron harian sudah diatur di `vercel.json`.
2. Isi semua variabel dari `.env.example` di Vercel. **Jangan** set `TURNSTILE_BYPASS` di production.
3. Cloudflare Turnstile: buat widget, daftarkan domain, isi `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY`. Tanpa secret, semua scan ditolak (fail-closed).
4. Supabase Auth: aktifkan provider Google (client ID + secret dari Google Cloud), set *Site URL* ke domain production, dan tambahkan `https://domainmu/**` ke *Redirect URLs*.
5. GitHub: isi secret repo `SUPABASE_URL` dan `SUPABASE_KEY` (service role) untuk workflow keepalive.
6. Tentukan kuota: biaya terburuk per bulan ≈ Rp25 × `SCAN_PER_DAY_GLOBAL` × 30.

---

## 📑 Struktur Proyek

```text
├── scripts/               # Script pengujian OCR (butuh folder receipts/ lokal, tidak di-commit)
├── src/
│   ├── app/
│   │   ├── baru/          # Wizard buat / edit split bill
│   │   ├── b/[id]/        # Rincian anggota (publik, noindex)
│   │   ├── b/[id]/kelola/ # Kelola: lewat akun, atau [token] untuk tamu
│   │   ├── masuk/ riwayat/ akun/   # Mode akun (Google)
│   │   ├── tentang/ privasi/ ketentuan/
│   │   └── api/           # scan, cron/daily; auth/callback
│   ├── components/        # AppShell, kartu tiket, wizard (baru/), bill/, account/
│   ├── lib/
│   │   ├── actions/       # Server Actions (bill, akun)
│   │   ├── llm/           # Vision AI handler & prompt ekstraksi v2
│   │   ├── supabase/      # Klien admin (service role), server, browser
│   │   ├── bills.ts       # Akses data bill + signed URL QRIS
│   │   ├── split.ts       # Algoritma pembagian
│   │   ├── breakdown.ts   # Rincian per anggota
│   │   ├── bill-validate.ts, schemas.ts
│   │   ├── scan-guard.ts, turnstile.ts, rate-limit.ts
│   │   └── money.ts, security.ts, local-store.ts
│   └── middleware.ts      # Refresh sesi Supabase Auth
└── supabase/migrations/   # Bills, Friends, Rate Limits, bucket QRIS
```

---

## 📄 Lisensi

MIT License © 2026 SplitBillin

