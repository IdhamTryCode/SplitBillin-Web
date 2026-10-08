// Prompt ekstraksi struk (v2). Nanti dipindah ke src/lib/llm/scan-receipt.ts.
export function buildPrompt(today) {
  return `Kamu membaca foto struk belanja/restoran atau screenshot pesanan aplikasi pesan-antar di Indonesia. Keluarkan HANYA JSON, tanpa teks lain dan tanpa penjelasan.

Bentuk:
{"is_receipt":true,"merchant":"","date":"YYYY-MM-DD"|null,
 "items":[{"name":"","qty":1,"unit_price":0,"line_total":0,"discount":0}],
 "subtotal":0,"discount":0,"service_charge":0,
 "other_fees":[{"name":"","amount":0}],
 "tax":0,"tax_included":false,"rounding":0,"total":0}
Kalau gambar bukan struk: {"is_receipt":false}

Aturan:
- Semua uang berupa bilangan bulat rupiah. "17.400" dan "17,400" berarti 17400. Jangan kirim string.
- Satu baris item = satu entri. line_total = harga SEBELUM diskon untuk seluruh qty (qty x unit_price). Pada screenshot aplikasi, harga yang dicoret adalah harga sebelum diskon.
- items[].discount = semua potongan yang tercetak tepat di bawah item itu (VOUCHER, DISKON, harga coret), dijumlahkan, angka positif. Tanpa potongan = 0.
- discount (tingkat struk) HANYA untuk potongan yang tidak melekat pada item tertentu, misalnya voucher untuk seluruh pesanan. Jangan mengulang potongan yang sudah ada di items[].discount.
- subtotal HANYA diisi kalau ada baris "Subtotal" tercetak, sesuai angka yang tercetak. Kalau tidak tercetak isi 0. Jangan menghitung sendiri. Baris "Total Belanja" bukan subtotal.
- service_charge = baris Service/Service Charge. other_fees = biaya lain yang tercetak (ongkir/biaya pengiriman, biaya layanan/platform, biaya pengemasan), satu entri per baris dengan jumlah yang benar-benar dibayar.
- tax = jumlah PPN/PB1 yang tercetak. tax_included = true bila total sudah mencakup pajak itu: struk Indomaret mencetak "PPN: DPP= ... PPN= ..." di bawah total hanya sebagai informasi, begitu pula tulisan "sudah termasuk pajak". tax_included = false bila pajak ditambahkan di atas subtotal sebelum total (mis. baris "PB1" lalu "Grand Total").
- rounding = pembulatan tercetak (boleh negatif), selain itu 0.
- total = jumlah akhir yang harus dibayar. Bukan Tunai, Kembali, atau "Anda Hemat".
- date: urutan tanggal Indonesia adalah HARI-BULAN-TAHUN (05-04-2026 berarti 5 April 2026, 29.06.26 berarti 29 Juni 2026). Tahun 2 digit "26" berarti 2026. Hari ini ${today}. Keluarkan sebagai YYYY-MM-DD, atau null kalau tidak ada tanggal.
- Salin nama item apa adanya dari struk. Jangan memperbaiki ejaannya.`
}
