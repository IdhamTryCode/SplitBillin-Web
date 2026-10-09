// Uji jalur /api/scan end-to-end terhadap jawaban *.truth.json.
// Jalankan: node scripts/ocr-api-test.mjs [folder] [apiUrl]
// Server harus hidup: npm run dev (atau npm start), lalu API_URL default http://localhost:3000
import { readdir, readFile } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'

const dir = process.argv[2] ?? 'receipts'
const apiUrl = (process.argv[3] ?? process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function similar(a, b) {
  a = norm(a)
  b = norm(b)
  if (!a || !b) return 0
  if (a === b || a.includes(b) || b.includes(a)) return 1
  const grams = (s) => {
    const m = new Map()
    for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1)
    return m
  }
  const ga = grams(a)
  const gb = grams(b)
  let hit = 0
  for (const [g, c] of ga) hit += Math.min(c, gb.get(g) ?? 0)
  return (2 * hit) / (Math.max(a.length - 1, 1) + Math.max(b.length - 1, 1))
}

const feesSum = (p) => (Array.isArray(p.other_fees) ? p.other_fees : []).reduce((s, f) => s + num(f.amount), 0)

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
  let numbersOk = 0
  let namesOk = 0
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
if (!files.length) {
  console.log(`Tidak ada gambar di ${dir}/`)
  process.exit(1)
}

const summary = []
for (const f of files) {
  const id = basename(f, extname(f))
  const ext = extname(f).toLowerCase()
  const buf = await readFile(join(dir, f))
  const form = new FormData()
  form.append('image', new Blob([buf], { type: MIME[ext] }), f)

  const started = Date.now()
  let res
  try {
    const r = await fetch(`${apiUrl}/api/scan`, { method: 'POST', body: form })
    res = { status: r.status, body: await r.json() }
  } catch (err) {
    console.log(`\n${f}  GAGAL menghubungi ${apiUrl}/api/scan: ${err.message}`)
    summary.push({ file: f.slice(-22), ok: false, error: 'network' })
    continue
  }
  const ms = Date.now() - started
  console.log(`\n${f}  ${(ms / 1000).toFixed(1)}s  HTTP ${res.status}`)

  if (!res.body?.ok) {
    console.log(`  GAGAL code=${res.body?.code ?? 'unknown'}`)
    summary.push({ file: f.slice(-22), ok: false, code: res.body?.code })
    continue
  }

  const receipt = res.body.receipt
  const a = arithmetic(receipt)
  if (a) console.log(`  hitung ulang: ${a.calc} vs total ${a.total} ${a.consistent ? 'KONSISTEN' : 'TIDAK KONSISTEN'}`)
  if (res.body.warnings?.length) console.log(`  warnings: ${res.body.warnings.join(', ')}`)

  const truth = await readFile(join(dir, `${id}.truth.json`), 'utf8').then(JSON.parse).catch(() => null)
  let wrong = null
  let pass = null
  if (truth) {
    const checks = score(receipt, truth)
    for (const [name, ok, detail] of checks) if (!ok) console.log(`  SALAH ${name} ${detail}`)
    wrong = checks.filter((c) => !c[1]).length
    pass = wrong === 0
    if (pass) console.log('  semua cocok dengan jawaban')
  }
  summary.push({ file: f.slice(-22), ok: true, salah: wrong, konsisten: a?.consistent, detik: +(ms / 1000).toFixed(1) })
}

console.log('\n=== ringkasan ===')
console.table(summary)
const complete = summary.filter((s) => s.ok && s.salah !== null && s.salah !== undefined)
if (complete.length) {
  const passed = complete.filter((s) => s.salah === 0).length
  const consistent = complete.filter((s) => s.konsisten).length
  console.log(`Cocok penuh: ${passed}/${complete.length} · konsisten: ${consistent}/${complete.length}`)
} else {
  const ok = summary.filter((s) => s.ok).length
  console.log(`Berhasil diproses: ${ok}/${summary.length}`)
}
