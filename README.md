# SplitBillin 🧾⚡

> Web app split bill gratis, mobile-first, dengan scan struk otomatis berbasis AI.

SplitBillin membantu kamu memfoto struk belanja/restoran, mengekstraksi daftar item dan harga secara otomatis menggunakan AI vision, membagikan porsi pesanan ke teman-teman, dan menghasilkan link rincian tagihan "siapa bayar berapa ke siapa".

---

## ✨ Fitur Utama

- 📸 **Scan Struk AI (Vision OCR)**: Ekstraksi item, qty, diskon per item, service charge, PPN, dan pembulatan secara cepat & akurat.
- 🧮 **Hitungan Otomatis Proporsional**: Diskon, pajak, dan biaya pengiriman dialokasikan secara adil sesuai porsi pesanan tiap orang dengan algoritma *largest remainder*.
- 👥 **Tanpa Login (Mode Tamu)**: Pengguna dapat langsung membuat dan mengelola tagihan via link kelola rahasia.
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

Salin file `.env.example` ke `.env` dan isi variabel yang diperlukan:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LLM_BASE_URL=https://kenari.id/v1
LLM_API_KEY=kn-your-api-key
LLM_MODEL=gemini-3-1-flash-lite
```

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

## 📑 Struktur Proyek

```text
├── receipts/              # Gambar struk uji & truth JSON
├── scripts/               # Script pengujian OCR & pembuat struk sintetis
├── src/
│   ├── app/               # Next.js App Router (Rute & Layout)
│   │   ├── baru/          # Wizard pembuat split bill
│   │   ├── b/[id]/        # Halaman rincian anggota (publik)
│   │   └── b/[id]/kelola/ # Halaman kelola pembuat (link rahasia)
│   ├── components/        # Komponen UI Reusable
│   ├── lib/
│   │   ├── actions/       # Next.js Server Actions
│   │   ├── llm/           # Vision AI handler & prompt extraksi v2
│   │   ├── money.ts       # Formatter & parser Rupiah
│   │   ├── schemas.ts     # Skema validasi Zod
│   │   ├── security.ts    # Hashing token & ID generator
│   │   └── split.ts       # Algoritma perhitungan pembagian bill
│   └── utils/
└── supabase/
    └── migrations/        # SQL Migration (Bills, Friends, Rate Limits)
```

---

## 📄 Lisensi

MIT License © 2026 SplitBillin

