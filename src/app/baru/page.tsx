'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBillAction } from '@/lib/actions/bill-actions'
import { formatIDR, parseIDR } from '@/lib/money'
import type { BillData, BillMember } from '@/lib/schemas'

const DEFAULT_COLORS = ['#7e22ce', '#2563eb', '#059669', '#d97706', '#db2777', '#0891b2']

export default function CreateBillWizard() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // Manual wizard steps: 1: Total/Merchant -> 2: Anggota -> 3: Mode Bagi -> 4: Bayar & Buat
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [merchant, setMerchant] = useState('')
  const [totalInput, setTotalInput] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const [members, setMembers] = useState<BillMember[]>([
    { id: 'm1', name: 'Aku', color: DEFAULT_COLORS[0], is_payer: true, paid_at: null },
    { id: 'm2', name: 'Budi', color: DEFAULT_COLORS[1], is_payer: false, paid_at: null },
  ])
  const [newMemberName, setNewMemberName] = useState('')

  const [splitMode, setSplitMode] = useState<'equal' | 'amount' | 'percent'>('equal')
  const [manualValues, setManualValues] = useState<Record<string, number>>({})

  const [bankProvider, setBankProvider] = useState('BCA')
  const [bankNumber, setBankNumber] = useState('')
  const [bankHolder, setBankHolder] = useState('')
  const [note, setNote] = useState('')

  const totalAmount = parseIDR(totalInput) || 0

  const handleAddMember = () => {
    if (!newMemberName.trim()) return
    const id = `m_${Date.now()}`
    const color = DEFAULT_COLORS[members.length % DEFAULT_COLORS.length]
    setMembers([...members, { id, name: newMemberName.trim(), color, is_payer: false, paid_at: null }])
    setNewMemberName('')
  }

  const handleRemoveMember = (id: string) => {
    if (members.length <= 2) return
    setMembers(members.filter((m) => m.id !== id))
  }

  const handleSetPayer = (id: string) => {
    setMembers(members.map((m) => ({ ...m, is_payer: m.id === id })))
  }

  const handleSubmit = async () => {
    if (totalAmount <= 0) {
      setError('Total tagihan harus lebih dari 0')
      return
    }
    if (!merchant.trim()) {
      setError('Nama tempat / acara wajib diisi')
      return
    }

    setSubmitting(true)
    setError(null)

    const billData: BillData = {
      version: 1,
      mode: 'manual',
      merchant: merchant.trim(),
      date,
      items: [],
      fees: { discount: 0, service: 0, other: [], tax: 0, tax_included: false, rounding: 0, adjustment: 0 },
      total: totalAmount,
      members,
      assignments: {},
      manual: {
        split: splitMode,
        values: manualValues,
      },
      payment: {
        methods: bankNumber ? [{ kind: 'bank', provider: bankProvider, number: bankNumber, holder: bankHolder }] : [],
        qris_path: null,
        note,
      },
    }

    const res = await createBillAction(billData)
    setSubmitting(false)

    if (res.ok && res.id && res.editToken) {
      router.push(`/b/${res.id}/kelola/${res.editToken}`)
    } else {
      setError(res.error || 'Gagal membuat split bill')
    }
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-dark-canvas p-4 flex flex-col items-center">
      <div className="max-w-[480px] w-full flex flex-col gap-5 pt-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
          <span className="text-primary font-bold">LANGKAH {step} DARI 4</span>
          <span>{step === 1 ? 'Total' : step === 2 ? 'Anggota' : step === 3 ? 'Bagi' : 'Bayar'}</span>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">{error}</div>
        )}

        {/* STEP 1: Total & Merchant */}
        {step === 1 && (
          <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <h1 className="text-lg font-bold text-on-surface">Total Tagihan & Keterangan</h1>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-on-surface-variant font-medium">Nama Tempat / Acara</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="misal: Makan Siang Warung Bu Tini"
                className="p-3 rounded-xl bg-surface-container-low dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-on-surface focus:outline-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-on-surface-variant font-medium">Total Yang Dibayar (Rp)</label>
              <input
                type="text"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                placeholder="55.700"
                className="p-3 rounded-xl bg-surface-container-low dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-lg font-mono font-bold text-primary focus:outline-primary"
              />
            </div>
            <button
              onClick={() => {
                if (!merchant || totalAmount <= 0) {
                  setError('Lengkapi nama tempat dan total tagihan')
                  return
                }
                setError(null)
                setStep(2)
              }}
              className="mt-2 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm"
            >
              Lanjut Pilih Anggota →
            </button>
          </div>
        )}

        {/* STEP 2: Anggota */}
        {step === 2 && (
          <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <h1 className="text-lg font-bold text-on-surface">Siapa Saja Yang Patungan?</h1>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Nama teman..."
                className="flex-1 p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-on-surface"
              />
              <button onClick={handleAddMember} className="px-4 bg-primary text-on-primary font-semibold rounded-xl text-sm">
                + Tambah
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-on-surface-variant font-semibold">Daftar Anggota & Penalang:</span>
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: m.color }}>
                      {m.name[0]?.toUpperCase()}
                    </span>
                    <span className="text-sm text-on-surface font-medium">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSetPayer(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        m.is_payer ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {m.is_payer ? 'Penalang ✓' : 'Set Penalang'}
                    </button>
                    {members.length > 2 && (
                      <button onClick={() => handleRemoveMember(m.id)} className="text-error text-xs p-1">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm">
                ← Kembali
              </button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm">
                Lanjut Cara Bagi →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Mode Pembagian */}
        {step === 3 && (
          <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <h1 className="text-lg font-bold text-on-surface">Cara Membagi</h1>
            <div className="flex rounded-xl bg-surface-container-low p-1 gap-1">
              <button
                onClick={() => setSplitMode('equal')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold ${splitMode === 'equal' ? 'bg-white dark:bg-dark-card shadow text-primary' : 'text-on-surface-variant'}`}
              >
                Bagi Rata
              </button>
              <button
                onClick={() => setSplitMode('amount')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold ${splitMode === 'amount' ? 'bg-white dark:bg-dark-card shadow text-primary' : 'text-on-surface-variant'}`}
              >
                Nominal
              </button>
            </div>

            {splitMode === 'equal' && (
              <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl">
                Total {formatIDR(totalAmount)} akan dibagi rata ke {members.length} orang ({formatIDR(Math.floor(totalAmount / members.length))} / orang).
              </p>
            )}

            {splitMode === 'amount' && (
              <div className="flex flex-col gap-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-on-surface">{m.name}</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={manualValues[m.id] || ''}
                      onChange={(e) => setManualValues({ ...manualValues, [m.id]: Number(e.target.value) })}
                      className="p-2 rounded-lg bg-surface-container-low border text-right font-mono text-xs w-32"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button onClick={() => setStep(2)} className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm">
                ← Kembali
              </button>
              <button onClick={() => setStep(4)} className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm">
                Lanjut Info Bayar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Info Bayar & Submit */}
        {step === 4 && (
          <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <h1 className="text-lg font-bold text-on-surface">Info Pembayaran (Opsional)</h1>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-on-surface-variant font-medium">Bank / E-Wallet</label>
              <input
                type="text"
                value={bankProvider}
                onChange={(e) => setBankProvider(e.target.value)}
                placeholder="BCA / Mandiri / GoPay"
                className="p-2.5 rounded-xl bg-surface-container-low border text-xs"
              />
              <input
                type="text"
                value={bankNumber}
                onChange={(e) => setBankNumber(e.target.value)}
                placeholder="Nomor Rekening / HP"
                className="p-2.5 rounded-xl bg-surface-container-low border text-xs font-mono"
              />
              <input
                type="text"
                value={bankHolder}
                onChange={(e) => setBankHolder(e.target.value)}
                placeholder="Atas Nama"
                className="p-2.5 rounded-xl bg-surface-container-low border text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-on-surface-variant font-medium">Catatan Untuk Teman</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="misal: Transfer sebelum hari Jumat ya..."
                className="p-2.5 rounded-xl bg-surface-container-low border text-xs"
                rows={2}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md mt-2"
            >
              {submitting ? 'Membuat Split Bill...' : 'Buat Split Bill ✓'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
