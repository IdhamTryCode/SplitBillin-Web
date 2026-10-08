// Uji OCR struk lintas model. Jalankan: node --env-file=.env scripts/ocr-test.mjs [folder] [nama-provider]
// Gambar di receipts/ (jpg/png/webp). Kalau ada <nama>.truth.json di sebelahnya, hasil dibandingkan.
// Env opsional: MAX_TOKENS (default 4000), OUT_DIR (default results).
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import { buildPrompt } from './receipt-prompt.mjs'

const dir = process.argv[2] ?? 'receipts'
const only = process.argv[3]
const outDir = process.env.OUT_DIR ?? 'results'
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

const PROVIDERS = [
  { name: 'glm', baseUrl: process.env.GLM_BASE_URL, key: process.env.GLM_API_KEY, model: process.env.GLM_MODEL },
  { name: 'minimax', baseUrl: process.env.MINIMAX_BASE_URL, key: process.env.MINIMAX_API_KEY, model: process.env.MINIMAX_MODEL },
  { name: 'kenari', baseUrl: process.env.KENARI_BASE_URL, key: process.env.KENARI_API_KEY, model: process.env.KENARI_MODEL },
].filter((p) => !only || p.name === only)

const PROMPT = buildPrompt(new Date().toISOString().slice(0, 10))

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const strip = (s) =>
  s.replace(/<think>[\s\S]*?<\/think>/g, '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

// Kemiripan nama (Dice atas bigram) supaya salah eja OCR kecil tidak dianggap salah.
function similar(a, b) {
  a = norm(a); b = norm(b)
  if (!a || !b) return 0
  if (a === b || a.includes(b) || b.includes(a)) return 1
  const grams = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1); return m }
  const ga = grams(a), gb = grams(b); let hit = 0
  for (const [g, c] of ga) hit += Math.min(c, gb.get(g) ?? 0)
  return (2 * hit) / (Math.max(a.length - 1, 1) + Math.max(b.length - 1, 1))
}

async function callModel(p, dataUrl) {
  const started = Date.now()
  const res = await fetch(`${p.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(120_000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
    body: JSON.stringify({
      model: p.model,
      temperature: 0,
      max_tokens: Number(process.env.MAX_TOKENS) || 4000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  })
  const ms = Date.now() - started
  const text = await res.text()
  if (!res.ok) return { ok: false, ms, error: `HTTP ${res.status}: ${text.slice(0, 300)}` }
  let body
  try { body = JSON.parse(text) } catch { return { ok: false, ms, error: `bukan JSON: ${text.slice(0, 200)}` } }
  const content = body?.choices?.[0]?.message?.content
  const usage = body?.usage ?? {}
  if (typeof content !== 'string') return { ok: false, ms, error: `tanpa content: ${text.slice(0, 200)}` }
  try {
    return { ok: true, ms, usage, parsed: JSON.parse(strip(content)), raw: content }
  } catch {
    return { ok: false, ms, usage, error: `JSON tidak valid: ${content.slice(0, 200)}`, raw: content }
  }
}

const feesSum = (p) => (Array.isArray(p.other_fees) ? p.other_fees : []).reduce((s, f) => s + num(f.amount), 0)

// Hitung ulang dari item, tanpa memercayai subtotal dari model. Ini yang nanti dilakukan server.
function arithmetic(p) {
  if (!Array.isArray(p.items)) return null
  const net = p.items.reduce((s, i) => s + num(i.line_total) - num(i.discount), 0)
  const calc = net - num(p.discount) + num(p.service_charge) + feesSum(p) + (p.tax_included ? 0 : num(p.tax)) + num(p.rounding)
  return { net, calc, total: p.total, consistent: calc === p.total }
}

function score(p, t) {
  const checks = []
  const eq = (name, got, want) => checks.push([name, got === want, `${got} vs ${want}`])
  eq('total', p.total, t.total)
  eq('tax', num(p.tax), num(t.tax))
  eq('tax_included', !!p.tax_included, !!t.tax_included)
  eq('discount struk', num(p.discount), num(t.discount))
  eq('service', num(p.service_charge), num(t.service_charge))
  eq('biaya lain', feesSum(p), num(t.other_fees_total))
  eq('rounding', num(p.rounding), num(t.rounding))
  eq('tanggal', p.date ?? null, t.date ?? null)
  if (t.subtotal !== undefined) eq('subtotal tercetak', num(p.subtotal), t.subtotal)
  else if (num(p.subtotal) !== 0) checks.push(['subtotal tidak tercetak', false, `model mengisi ${p.subtotal}`])

  const got = Array.isArray(p.items) ? [...p.items] : []
  eq('jumlah item', got.length, t.items.length)
  let numbersOk = 0, namesOk = 0
  for (const ti of t.items) {
    const idx = got.findIndex((g) => g.qty === ti.qty && g.line_total === ti.line_total && num(g.discount) === ti.discount)
    if (idx >= 0) {
      numbersOk++
      if (similar(got[idx].name, ti.name) >= 0.7) namesOk++
      else checks.push([`nama ${ti.name}`, false, `dibaca "${got[idx].name}" (angka benar)`])
      got.splice(idx, 1)
    } else {
      const near = got.find((g) => similar(g.name, ti.name) >= 0.7)
      checks.push([`item ${ti.name}`, false, near ? `qty ${near.qty}, total ${near.line_total}, disc ${near.discount}` : 'tidak ditemukan'])
    }
  }
  checks.push([`item angka benar ${numbersOk}/${t.items.length}, nama mirip ${namesOk}/${t.items.length}`, numbersOk === t.items.length, ''])
  return checks
}

const files = (await readdir(dir)).filter((f) => MIME[extname(f).toLowerCase()])
if (!files.length) { console.log(`Tidak ada gambar di ${dir}/`); process.exit(1) }
await mkdir(outDir, { recursive: true })
const summary = []

for (const p of PROVIDERS) {
  if (!p.baseUrl || !p.key || !p.model) { console.log(`[${p.name}] dilewati: env belum lengkap`); continue }
  console.log(`\n=== ${p.name} (${p.model}) ===`)
  for (const f of files) {
    const buf = await readFile(join(dir, f))
    const dataUrl = `data:${MIME[extname(f).toLowerCase()]};base64,${buf.toString('base64')}`
    const r = await callModel(p, dataUrl).catch((e) => ({ ok: false, ms: 0, error: `jaringan: ${e.cause?.code ?? e.message}` }))
    const id = basename(f, extname(f))
    await writeFile(join(outDir, `${p.name}-${id}.json`), JSON.stringify(r, null, 2))
    const tokens = r.usage ? `${r.usage.prompt_tokens ?? '?'} in / ${r.usage.completion_tokens ?? '?'} out` : '-'
    console.log(`\n${f}  ${(r.ms / 1000).toFixed(1)}s  tokens ${tokens}`)
    if (!r.ok) { console.log(`  GAGAL ${r.error}`); summary.push({ model: p.name, file: f.slice(-22), ok: false }); continue }
    if (r.parsed.is_receipt === false) { console.log('  dinilai bukan struk'); summary.push({ model: p.name, file: f.slice(-22), ok: false }); continue }
    const a = arithmetic(r.parsed)
    if (a) console.log(`  hitung ulang dari item: ${a.calc} vs total ${a.total} ${a.consistent ? 'KONSISTEN' : 'TIDAK KONSISTEN'}`)
    let pass = null, wrong = null
    const truth = await readFile(join(dir, `${id}.truth.json`), 'utf8').then(JSON.parse).catch(() => null)
    if (truth) {
      const checks = score(r.parsed, truth)
      for (const [name, ok, detail] of checks) if (!ok) console.log(`  SALAH ${name} ${detail}`)
      wrong = checks.filter((c) => !c[1]).length
      pass = wrong === 0
      if (pass) console.log('  semua cocok dengan jawaban')
    }
    summary.push({ model: p.name, file: f.slice(-22), ok: true, salah: wrong, konsisten: a?.consistent, detik: +(r.ms / 1000).toFixed(1), in: r.usage?.prompt_tokens, out: r.usage?.completion_tokens })
  }
}
console.log('\n=== ringkasan ===')
console.table(summary)
