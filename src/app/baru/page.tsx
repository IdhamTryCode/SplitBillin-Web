'use client'

import React, { useEffect, useState } from 'react'
import { ModeChooser } from '@/components/baru/ModeChooser'
import { ScanCapture } from '@/components/baru/ScanCapture'
import { ScanLoading } from '@/components/baru/ScanLoading'
import { ItemReview } from '@/components/baru/ItemReview'
import { ManualDetails } from '@/components/baru/ManualDetails'
import { MembersStep } from '@/components/baru/MembersStep'
import { AssignStep } from '@/components/baru/AssignStep'
import { ManualSplitStep } from '@/components/baru/ManualSplitStep'
import { PaymentStep } from '@/components/baru/PaymentStep'
import { ReviewStep } from '@/components/baru/ReviewStep'
import { SuccessScreen } from '@/components/baru/SuccessScreen'
import { StepIndicator } from '@/components/baru/StepIndicator'
import { DEFAULT_COLORS, emptyFees, type Branch, type CreatedBill, type Phase, type ScanFailure } from '@/components/baru/types'
import { createBillAction } from '@/lib/actions/bill-actions'
import { receiptToBillDraft } from '@/lib/receipt'
import type { CompressedImage } from '@/lib/image'
import type { ScanApiResponse } from '@/lib/scan-types'
import type {
  BillData,
  BillFees,
  BillItem,
  BillMember,
  ItemAssignment,
  ManualSplit,
  PaymentInfo,
} from '@/lib/schemas'

const SCAN_STEPS = ['Struk', 'Item', 'Anggota', 'Bagi', 'Bayar', 'Selesai']
const MANUAL_STEPS = ['Acara', 'Anggota', 'Bagi', 'Bayar', 'Selesai']

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now().toString(36)}`
}

export default function CreateBillWizard() {
  const [branch, setBranch] = useState<Branch | null>(null)
  const [phase, setPhase] = useState<Phase>('choose')
  const [error, setError] = useState<string | null>(null)

  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState<BillItem[]>([])
  const [fees, setFees] = useState<BillFees>(emptyFees)

  const [members, setMembers] = useState<BillMember[]>([
    { id: 'm1', name: 'Aku', color: DEFAULT_COLORS[0], is_payer: true, paid_at: null },
    { id: 'm2', name: 'Budi', color: DEFAULT_COLORS[1], is_payer: false, paid_at: null },
  ])
  const [assignments, setAssignments] = useState<Record<string, ItemAssignment[]>>({})
  const [manual, setManual] = useState<ManualSplit>({ split: 'equal', values: {} })
  const [payment, setPayment] = useState<PaymentInfo>({ methods: [], qris_path: null, note: '' })

  const [receiptImage, setReceiptImage] = useState<CompressedImage | null>(null)
  const [scanFailure, setScanFailure] = useState<ScanFailure | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<CreatedBill | null>(null)

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get('mode')
    if (mode === 'scan') setBranch('scan')
    else if (mode === 'manual') setBranch('manual')
  }, [])

  useEffect(() => {
    return () => {
      if (receiptImage) URL.revokeObjectURL(receiptImage.previewUrl)
    }
  }, [receiptImage])

  const runScan = async (image: CompressedImage) => {
    setScanFailure(null)
    setError(null)
    setPhase('loading')
    const form = new FormData()
    form.append('image', image.blob, 'receipt.jpg')
    try {
      const res = await fetch('/api/scan', { method: 'POST', body: form })
      const json = (await res.json()) as ScanApiResponse
      if (!json.ok) {
        setScanFailure({ code: json.code, retryAfter: json.retryAfter })
        return
      }
      const draft = receiptToBillDraft(json.receipt, newId)
      setMerchant(draft.merchant)
      setDate(draft.date ?? '')
      setItems(draft.items)
      setFees(draft.fees)
      setTotal(draft.total)
      setAssignments({})
      setPhase('review')
    } catch {
      setScanFailure({ code: 'upstream_error' })
    }
  }

  const handleUseImage = (image: CompressedImage) => {
    setReceiptImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return image
    })
    void runScan(image)
  }

  const goManual = () => {
    setBranch('manual')
    setError(null)
    setPhase('details')
  }

  const buildBillData = (): BillData => {
    const cleanFees: BillFees = {
      ...fees,
      other: fees.other
        .filter((f) => f.name.trim() || f.amount !== 0)
        .map((f) => ({ name: f.name.trim() || 'Biaya lain', amount: f.amount })),
    }
    const label = merchant.trim() || 'Tanpa nama'

    if (branch === 'scan') {
      return {
        version: 1,
        mode: 'receipt',
        merchant: label,
        date: date || null,
        items,
        fees: cleanFees,
        total,
        members,
        assignments,
        manual: null,
        payment,
      }
    }
    return {
      version: 1,
      mode: 'manual',
      merchant: label,
      date: date || null,
      items: [],
      fees: emptyFees(),
      total,
      members,
      assignments: {},
      manual,
      payment,
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    const res = await createBillAction(buildBillData())
    setSubmitting(false)
    if (res.ok && res.id && res.editToken) {
      setCreated({ id: res.id, editToken: res.editToken })
      setPhase('sukses')
    } else {
      setError(res.error || 'Gagal membuat split bill')
    }
  }

  const reset = () => {
    if (receiptImage) URL.revokeObjectURL(receiptImage.previewUrl)
    setReceiptImage(null)
    setScanFailure(null)
    setCreated(null)
    setBranch(null)
    setPhase('choose')
    setMerchant('')
    setDate(new Date().toISOString().slice(0, 10))
    setTotal(0)
    setItems([])
    setFees(emptyFees())
    setAssignments({})
    setManual({ split: 'equal', values: {} })
    setPayment({ methods: [], qris_path: null, note: '' })
    setMembers([
      { id: 'm1', name: 'Aku', color: DEFAULT_COLORS[0], is_payer: true, paid_at: null },
      { id: 'm2', name: 'Budi', color: DEFAULT_COLORS[1], is_payer: false, paid_at: null },
    ])
    setError(null)
  }

  const steps = branch === 'manual' ? MANUAL_STEPS : SCAN_STEPS
  const stepIndex: Record<Phase, number> = {
    choose: 0,
    details: 0,
    capture: 0,
    loading: 0,
    review: 1,
    anggota: 2,
    bagi: 3,
    bayar: 4,
    tinjau: 4,
    sukses: steps.length - 1,
  }

  const showIndicator = phase !== 'choose' && phase !== 'sukses'

  return (
    <main className="min-h-screen bg-surface dark:bg-dark-canvas p-4 flex flex-col items-center">
      <div className="max-w-[480px] w-full flex flex-col gap-5 pt-4">
        {showIndicator && <StepIndicator steps={steps} current={stepIndex[phase]} />}

        {phase === 'choose' && (
          <ModeChooser
            onSelect={(b) => {
              setBranch(b)
              setError(null)
              setPhase(b === 'scan' ? 'capture' : 'details')
            }}
          />
        )}

        {phase === 'capture' && (
          <ScanCapture onUseImage={handleUseImage} onManual={goManual} onBack={() => setPhase('choose')} />
        )}

        {phase === 'loading' && receiptImage && (
          <ScanLoading
            previewUrl={receiptImage.previewUrl}
            failure={scanFailure}
            onRetry={() => receiptImage && void runScan(receiptImage)}
            onRescan={() => {
              setScanFailure(null)
              setPhase('capture')
            }}
            onManual={goManual}
            onCancel={() => {
              setScanFailure(null)
              setPhase('capture')
            }}
          />
        )}

        {phase === 'review' && (
          <ItemReview
            previewUrl={receiptImage?.previewUrl ?? null}
            merchant={merchant}
            date={date}
            items={items}
            fees={fees}
            total={total}
            onMerchantChange={setMerchant}
            onDateChange={setDate}
            onItemsChange={setItems}
            onFeesChange={setFees}
            onTotalChange={setTotal}
            onContinue={() => {
              if (items.length === 0) {
                setError('Tambahkan minimal satu item dulu.')
                return
              }
              setError(null)
              setPhase('anggota')
            }}
            onManual={goManual}
            onBack={() => setPhase('capture')}
          />
        )}

        {phase === 'details' && (
          <ManualDetails
            merchant={merchant}
            total={total}
            date={date}
            error={error}
            onMerchantChange={setMerchant}
            onTotalChange={setTotal}
            onDateChange={setDate}
            onContinue={() => {
              if (total <= 0) return setError('Total tagihan harus lebih dari 0')
              if (!merchant.trim()) return setError('Nama tempat / acara wajib diisi')
              setError(null)
              setPhase('anggota')
            }}
            onBack={() => setPhase('choose')}
          />
        )}

        {phase === 'anggota' && (
          <MembersStep
            members={members}
            error={error}
            onMembersChange={setMembers}
            onContinue={() => {
              if (members.length < 2) return setError('Minimal 2 orang ya')
              if (members.some((m) => !m.name.trim())) return setError('Nama anggota tidak boleh kosong')
              setError(null)
              setPhase('bagi')
            }}
            onBack={() => setPhase(branch === 'manual' ? 'details' : 'review')}
          />
        )}

        {phase === 'bagi' && branch === 'scan' && (
          <AssignStep
            items={items}
            fees={fees}
            total={total}
            members={members}
            assignments={assignments}
            onAssignmentsChange={setAssignments}
            onContinue={() => setPhase('bayar')}
            onBack={() => setPhase('anggota')}
          />
        )}

        {phase === 'bagi' && branch === 'manual' && (
          <ManualSplitStep
            total={total}
            members={members}
            manual={manual}
            onManualChange={setManual}
            onContinue={() => setPhase('bayar')}
            onBack={() => setPhase('anggota')}
          />
        )}

        {phase === 'bayar' && (
          <PaymentStep
            payment={payment}
            onPaymentChange={setPayment}
            onContinue={() => setPhase('tinjau')}
            onBack={() => setPhase('bagi')}
          />
        )}

        {phase === 'tinjau' && (
          <ReviewStep
            mode={branch === 'scan' ? 'receipt' : 'manual'}
            merchant={merchant}
            date={date}
            total={total}
            items={items}
            fees={fees}
            members={members}
            assignments={assignments}
            manual={manual}
            payment={payment}
            submitting={submitting}
            error={error}
            onAdjust={(diff) => setFees({ ...fees, adjustment: diff })}
            onSubmit={handleSubmit}
            onBack={() => setPhase('bayar')}
          />
        )}

        {phase === 'sukses' && created && (
          <SuccessScreen created={created} merchant={merchant} onNew={reset} />
        )}
      </div>
    </main>
  )
}
