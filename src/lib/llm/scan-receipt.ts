/**
 * Vision OCR call to the Kenari gateway (OpenAI-compatible).
 *
 * The model only translates the image into JSON; all arithmetic is redone in
 * `src/lib/receipt.ts`. Ported from `scripts/receipt-prompt.mjs` and
 * `scripts/ocr-test.mjs`.
 */

import { ScanResultSchema, type ReceiptData } from '@/lib/schemas'
import type { ScanErrorCode } from '@/lib/scan-types'

export type { ScanErrorCode }

export type ScanOutcome =
  | { ok: true; receipt: ReceiptData }
  | { ok: false; code: ScanErrorCode }

// Stays under the route's maxDuration (30 s); a scan normally takes 2–9 s.
const TIMEOUT_MS = 25_000
const DEFAULT_BASE_URL = 'https://kenari.id/v1'
const DEFAULT_MODEL = 'gemini-3-1-flash-lite'

interface LlmConfig {
  baseUrl: string
  apiKey: string | undefined
  model: string
}

/**
 * Prefer the app's `LLM_*` variables, fall back to the `KENARI_*` ones used by
 * the test scripts so the current `.env` works without edits.
 */
function llmConfig(): LlmConfig {
  return {
    baseUrl: (process.env.LLM_BASE_URL || process.env.KENARI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ''),
    apiKey: process.env.LLM_API_KEY || process.env.KENARI_API_KEY,
    model: process.env.LLM_MODEL || process.env.KENARI_MODEL || DEFAULT_MODEL,
  }
}

/**
 * Extraction prompt v2. Verbatim from `scripts/receipt-prompt.mjs`.
 */
export function buildReceiptPrompt(today: string): string {
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

/**
 * Remove `<think>` blocks and markdown code fences around the JSON.
 */
export function stripCodeFence(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
}

async function callKenari(
  baseUrl: string,
  apiKey: string,
  body: string,
  signal: AbortSignal,
): Promise<Response> {
  return fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  })
}

/**
 * Extract a receipt from an image data URL. Never throws; returns either a
 * validated receipt or an error code.
 */
export async function scanReceipt(
  imageDataUrl: string,
  opts?: { signal?: AbortSignal },
): Promise<ScanOutcome> {
  const { baseUrl, apiKey, model } = llmConfig()
  if (!apiKey) {
    console.error('[scanReceipt] Missing LLM_API_KEY / KENARI_API_KEY')
    return { ok: false, code: 'upstream_error' }
  }

  const prompt = buildReceiptPrompt(new Date().toISOString().slice(0, 10))
  const body = JSON.stringify({
    model,
    temperature: 0,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: [{ type: 'image_url', image_url: { url: imageDataUrl } }] },
    ],
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const onCallerAbort = () => controller.abort()
  opts?.signal?.addEventListener('abort', onCallerAbort)

  const attempts = 2
  try {
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const res = await callKenari(baseUrl, apiKey, body, controller.signal)

        if (!res.ok) {
          const detail = await res.text().catch(() => '')
          console.error('[scanReceipt] upstream HTTP', res.status, detail.slice(0, 300))
          // Retry only on transient upstream failures.
          if ((res.status === 429 || res.status >= 500) && attempt < attempts - 1) continue
          return { ok: false, code: 'upstream_error' }
        }

        const json = (await res.json().catch(() => null)) as {
          choices?: Array<{ message?: { content?: unknown } }>
        } | null
        const content = json?.choices?.[0]?.message?.content
        if (typeof content !== 'string') {
          console.error('[scanReceipt] response missing content')
          return { ok: false, code: 'unreadable' }
        }

        let parsedJson: unknown
        try {
          parsedJson = JSON.parse(stripCodeFence(content))
        } catch {
          console.error('[scanReceipt] content is not valid JSON:', content.slice(0, 200))
          return { ok: false, code: 'unreadable' }
        }

        const parsed = ScanResultSchema.safeParse(parsedJson)
        if (!parsed.success) {
          console.error('[scanReceipt] schema validation failed:', parsed.error.issues[0]?.message)
          return { ok: false, code: 'unreadable' }
        }

        if (!parsed.data.is_receipt) return { ok: false, code: 'not_receipt' }
        return { ok: true, receipt: parsed.data }
      } catch (err) {
        if (opts?.signal?.aborted) return { ok: false, code: 'upstream_error' }
        console.error('[scanReceipt] request failed:', err instanceof Error ? err.message : err)
        if (attempt < attempts - 1) continue
        return { ok: false, code: 'upstream_error' }
      }
    }
    return { ok: false, code: 'upstream_error' }
  } finally {
    clearTimeout(timer)
    opts?.signal?.removeEventListener('abort', onCallerAbort)
  }
}
