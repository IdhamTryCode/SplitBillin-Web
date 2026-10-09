'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
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
import { Turnstile, type TurnstileHandle } from '@/components/baru/Turnstile'
import {
  DEFAULT_COLORS,
  emptyFees,
  type Branch,
  type CreatedBill,
  type Phase,
  type QrisDraft,
  type ScanFailure,
} from '@/components/baru/types'
import { addFriendsAction, listFriendsAction } from '@/lib/actions/account-actions'
import { createBillAction, getEditableBillAction, updateBillAction } from '@/lib/actions/bill-actions'
import { clearDraft, getDraft, getSavedNames, rememberNames, saveDraft, saveLocalBill } from '@/lib/local-store'
import { receiptToBillDraft, withAdjustment } from '@/lib/receipt'
import { useUser } from '@/lib/use-user'
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
const DRAFT_VERSION = 1

interface Draft {
  v: number
  branch: Branch
  phase: Phase
  merchant: string
  date: string
  total: number
  items: BillItem[]
  fees: BillFees
  members: BillMember[]
  assignments: Record<string, ItemAssignment[]>
  manual: ManualSplit
  payment: PaymentInfo
}

interface EditTarget {
  id: string
  token: string | null
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now().toString(36)}`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function defaultMembers(): BillMember[] {
  return [{ id: 'm1', name: 'Aku', color: DEFAULT_COLORS[0], is_payer: true, paid_at: null }]
}

function emptyPayment(): PaymentInfo {
  return { methods: [], qris_path: null, note: '' }
}

export default function CreateBillWizard() {
  const router = useRouter()
  const { user, ready: userReady } = useUser()

  const [branch, setBranch] = useState<Branch | null>(null)
  const [phase, setPhase] = useState<Phase>('choose')
  const [error, setError] = useState<string | null>(null)

  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(today)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState<BillItem[]>([])
  const [fees, setFees] = useState<BillFees>(emptyFees)

  const [members, setMembers] = useState<BillMember[]>(defaultMembers)
  const [assignments, setAssignments] = useState<Record<string, ItemAssignment[]>>({})
  const [manual, setManual] = useState<ManualSplit>({ split: 'equal', values: {} })
  const [payment, setPayment] = useState<PaymentInfo>(emptyPayment)
  const [qris, setQris] = useState<QrisDraft | null>(null)
  const [existingQrisUrl, setExistingQrisUrl] = useState<string | null>(null)

  const [receiptImage, setReceiptImage] = useState<CompressedImage | null>(null)
  const [scanFailure, setScanFailure] = useState<ScanFailure | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<CreatedBill | null>(null)

  const [edit, setEdit] = useState<EditTarget | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [editFailed, setEditFailed] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const turnstileRef = useRef<TurnstileHandle>(null)
  const scanAbort = useRef<AbortController | null>(null)

  const applyBill = (data: BillData) => {
    setBranch(data.mode === 'receipt' ? 'scan' : 'manual')
    setMerchant(data.merchant)
    setDate(data.date ?? '')
    setTotal(data.total)
    setItems(data.items)
    setFees(data.fees)
    setMembers(data.members)
    setAssignments(data.assignments)
    setManual(data.manual ?? { split: 'equal', values: {} })
    setPayment(data.payment)
  }

  // Entry points: ?mode=scan|manual, ?draft=1 (resume), ?edit=<id> (from the manage page).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')

    if (editId) {
      let token: string | null = null
      try {
        const stored = JSON.parse(window.sessionStorage.getItem('sb:edit') ?? 'null') as EditTarget | null
        if (stored?.id === editId) token = stored.token
      } catch {
        /* fall back to account access */
      }
      setLoadingEdit(true)
      getEditableBillAction(editId, token)
        .then((res) => {
          if (!res.ok) {
            setError(res.error)
            setEditFailed(true)
            return
          }
          applyBill(res.bill.data)
          setExistingQrisUrl(res.bill.qrisUrl)
          setEdit({ id: editId, token })
          setPhase(res.bill.data.mode === 'receipt' ? 'review' : 'details')
        })
        .catch(() => {
          setError('Gagal memuat split bill. Coba lagi.')
          setEditFailed(true)
        })
        .finally(() => {
          setLoadingEdit(false)
          setHydrated(true)
        })
      return
    }

    const draft = params.get('draft') ? getDraft<Draft>() : null
    if (draft && draft.v === DRAFT_VERSION && draft.branch) {
      setBranch(draft.branch)
      setMerchant(draft.merchant ?? '')
      setDate(draft.date ?? '')
      setTotal(draft.total ?? 0)
      setItems(draft.items ?? [])
      setFees(draft.fees ?? emptyFees())
      setMembers(draft.members?.length ? draft.members : defaultMembers())
      setAssignments(draft.assignments ?? {})
      setManual(draft.manual ?? { split: 'equal', values: {} })
      setPayment({ ...emptyPayment(), ...draft.payment, qris_path: null })
      // The receipt photo is never stored, so a scan draft resumes at capture or review.
      const resumable: Phase[] = ['details', 'review', 'anggota', 'bagi', 'bayar', 'tinjau']
      setPhase(resumable.includes(draft.phase) ? draft.phase : draft.branch === 'scan' ? 'capture' : 'details')
    } else {
      const mode = params.get('mode')
      if (mode === 'scan') {
        setBranch('scan')
        setPhase('capture')
      } else if (mode === 'manual') {
        setBranch('manual')
        setPhase('details')
      }
    }
    setHydrated(true)
  }, [])

  // Keep an unfinished run as a draft in this browser (new bills only).
  useEffect(() => {
    if (!hydrated || edit || !branch) return
    if (phase === 'choose' || phase === 'sukses') return
    const hasContent = merchant.trim() !== '' || total > 0 || items.length > 0 || members.length > 1
    if (!hasContent) return
    const draft: Draft = {
      v: DRAFT_VERSION,
      branch,
      phase,
      merchant,
      date,
      total,
      items,
      fees,
      members,
      assignments,
      manual,
      payment,
    }
    saveDraft(draft)
  }, [hydrated, edit, branch, phase, merchant, date, total, items, fees, members, assignments, manual, payment])

  // Name suggestions: this browser's history, plus saved friends when signed in.
  useEffect(() => {
    if (!userReady) return
    const local = getSavedNames()
    setSuggestions(local)
    if (!user) return
    listFriendsAction()
      .then((friends) => setSuggestions([...new Set([...friends.map((f) => f.name), ...local])]))
      .catch(() => {})
  }, [user, userReady])

  useEffect(() => {
    return () => {
      if (receiptImage) URL.revokeObjectURL(receiptImage.previewUrl)
    }
  }, [receiptImage])

  // Drop assignments that point at items or members that no longer exist.
  const cleanAssignments = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.id))
    const next: Record<string, ItemAssignment[]> = {}
    for (const item of items) {
      const list = (assignments[item.id] ?? []).filter((a) => memberIds.has(a.member_id))
      if (list.length) next[item.id] = list
    }
    return next
  }, [assignments, items, members])

  const runScan = async (image: CompressedImage) => {
    scanAbort.current?.abort()
    const controller = new AbortController()
    scanAbort.current = controller

    setScanFailure(null)
    setError(null)
    setPhase('loading')

    try {
      const token = await turnstileRef.current?.getToken()
      if (controller.signal.aborted) return

      const form = new FormData()
      form.append('image', image.blob, 'receipt.jpg')
      if (token) form.append('turnstileToken', token)

      const res = await fetch('/api/scan', { method: 'POST', body: form, signal: controller.signal })
      const json = (await res.json()) as ScanApiResponse
      if (controller.signal.aborted) return
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
      if (controller.signal.aborted) return
      setScanFailure({ code: 'upstream_error' })
    }
  }

  const cancelScan = () => {
    scanAbort.current?.abort()
    setScanFailure(null)
  }

  const handleUseImage = (image: CompressedImage) => {
    setReceiptImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return image
    })
    void runScan(image)
  }

  const goManual = () => {
    cancelScan()
    setBranch('manual')
    setError(null)
    setPhase('details')
  }

  const buildBillData = (): BillData => {
    const base = {
      version: 1 as const,
      merchant: merchant.trim() || 'Tanpa nama',
      date: date || null,
      total,
      members: members.map((m) => ({ ...m, name: m.name.trim() })),
      payment: { ...payment, qris_path: null },
      updated_at: null,
    }

    if (branch === 'scan') {
      const cleanFees: BillFees = {
        ...fees,
        other: fees.other
          .filter((f) => f.name.trim() || f.amount !== 0)
          .map((f) => ({ name: f.name.trim() || 'Biaya lain', amount: f.amount })),
      }
      return {
        ...base,
        mode: 'receipt',
        items,
        fees: withAdjustment(items, cleanFees, total),
        assignments: cleanAssignments,
        manual: null,
      }
    }
    return { ...base, mode: 'manual', items: [], fees: emptyFees(), assignments: {}, manual }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const data = buildBillData()
      let qrisForm: FormData | undefined
      if (qris) {
        qrisForm = new FormData()
        qrisForm.append('qris', qris.blob, 'qris.jpg')
      }

      if (edit) {
        const res = await updateBillAction(edit.id, edit.token, data, existingQrisUrl !== null, qrisForm)
        if (!res.ok) return setError(res.error)
        router.push(edit.token ? `/b/${edit.id}/kelola/${edit.token}` : `/b/${edit.id}/kelola`)
        return
      }

      const res = await createBillAction(data, qrisForm)
      if (!res.ok) return setError(res.error)

      const names = data.members.filter((m) => !m.is_payer).map((m) => m.name)
      rememberNames(names)
      if (res.editToken) {
        saveLocalBill({
          id: res.id,
          token: res.editToken,
          merchant: data.merchant,
          total: data.total,
          createdAt: new Date().toISOString(),
        })
      } else if (names.length > 0) {
        void addFriendsAction(names).catch(() => {})
      }
      clearDraft()
      setCreated({ id: res.id, editToken: res.editToken })
      setPhase('sukses')
    } catch {
      setError('Koneksi bermasalah.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    if (receiptImage) URL.revokeObjectURL(receiptImage.previewUrl)
    if (qris) URL.revokeObjectURL(qris.previewUrl)
    setReceiptImage(null)
    setScanFailure(null)
    setCreated(null)
    setBranch(null)
    setPhase('choose')
    setMerchant('')
    setDate(today())
    setTotal(0)
    setItems([])
    setFees(emptyFees())
    setAssignments({})
    setManual({ split: 'equal', values: {} })
    setPayment(emptyPayment())
    setQris(null)
    setExistingQrisUrl(null)
    setMembers(defaultMembers())
    setError(null)
  }

  const leaveEdit = () => {
    if (!edit) return
    router.push(edit.token ? `/b/${edit.id}/kelola/${edit.token}` : `/b/${edit.id}/kelola`)
  }

  const validateMembers = (): string | null => {
    if (members.length < 2) return 'Minimal 2 orang ya'
    if (members.some((m) => !m.name.trim())) return 'Nama anggota tidak boleh kosong'
    const names = new Set(members.map((m) => m.name.trim().toLowerCase()))
    if (names.size !== members.length) return 'Ada nama yang sama. Bedakan biar gak tertukar.'
    if (!members.some((m) => m.is_payer)) return 'Pilih siapa yang nalangin'
    return null
  }

  const steps = branch === 'manual' ? MANUAL_STEPS : SCAN_STEPS
  const stepIndex: Record<Phase, number> = {
    choose: 0,
    details: 0,
    capture: 0,
    loading: 0,
    review: 1,
    anggota: branch === 'manual' ? 1 : 2,
    bagi: branch === 'manual' ? 2 : 3,
    bayar: branch === 'manual' ? 3 : 4,
    tinjau: branch === 'manual' ? 3 : 4,
    sukses: steps.length - 1,
  }

  const showIndicator = phase !== 'choose' && phase !== 'sukses'
  const wide = phase === 'bagi' && branch === 'scan'

  if (loadingEdit || !hydrated) {
    return (
      <AppShell nav={false}>
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Memuat">
          <div className="h-6 w-1/2 rounded bg-surface-container animate-pulse" />
          <div className="h-40 rounded-2xl bg-surface-container animate-pulse" />
        </div>
      </AppShell>
    )
  }

  if (editFailed) {
    return (
      <AppShell nav={false}>
        <div className="mt-8 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 text-center flex flex-col gap-3">
          <h1 className="text-lg font-bold text-on-surface">Split bill tidak bisa diedit</h1>
          <p className="text-sm text-on-surface-variant">{error}</p>
          <Link href="/" className="py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm">
            Ke Beranda
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell nav={false} width={wide ? 'wide' : 'narrow'}>
      <div className="flex flex-col gap-5">
        {edit && phase !== 'sukses' && (
          <div className="bg-amber-100 dark:bg-amber-950/40 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
            <span>Kamu sedang mengedit split bill. Perubahan memengaruhi nominal tiap orang.</span>
            <button type="button" onClick={leaveEdit} className="shrink-0 font-semibold underline h-9">
              Batal
            </button>
          </div>
        )}

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
            isGuest={userReady && !user}
            onRetry={() => receiptImage && void runScan(receiptImage)}
            onRescan={() => {
              cancelScan()
              setPhase('capture')
            }}
            onManual={goManual}
            onCancel={() => {
              cancelScan()
              setPhase('capture')
            }}
          />
        )}

        {/* Mounted for the whole scan branch so a token is ready before the user taps "Pindai". */}
        {branch === 'scan' && (phase === 'capture' || phase === 'loading') && <Turnstile ref={turnstileRef} />}

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
              setError(null)
              setPhase('anggota')
            }}
            onManual={goManual}
            onBack={() => (edit ? leaveEdit() : setPhase('capture'))}
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
            onBack={() => (edit ? leaveEdit() : setPhase('choose'))}
          />
        )}

        {phase === 'anggota' && (
          <MembersStep
            members={members}
            suggestions={suggestions}
            error={error}
            onMembersChange={(next) => {
              setError(null)
              setMembers(next)
            }}
            onContinue={() => {
              const problem = validateMembers()
              if (problem) return setError(problem)
              setError(null)
              setPhase('bagi')
            }}
            onBack={() => {
              setError(null)
              setPhase(branch === 'manual' ? 'details' : 'review')
            }}
          />
        )}

        {phase === 'bagi' && branch === 'scan' && (
          <AssignStep
            items={items}
            fees={fees}
            total={total}
            members={members}
            assignments={cleanAssignments}
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
            qris={qris}
            existingQrisUrl={existingQrisUrl}
            onPaymentChange={setPayment}
            onQrisChange={setQris}
            onRemoveExistingQris={() => setExistingQrisUrl(null)}
            onContinue={() => {
              setError(null)
              setPhase('tinjau')
            }}
            onBack={() => setPhase('bagi')}
          />
        )}

        {phase === 'tinjau' && (
          <ReviewStep
            mode={branch === 'scan' ? 'receipt' : 'manual'}
            editing={edit !== null}
            merchant={merchant}
            date={date}
            total={total}
            items={items}
            fees={fees}
            members={members}
            assignments={cleanAssignments}
            manual={manual}
            payment={payment}
            hasQris={qris !== null || existingQrisUrl !== null}
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            onBack={() => setPhase('bayar')}
          />
        )}

        {phase === 'sukses' && created && <SuccessScreen created={created} merchant={merchant} onNew={reset} />}

        {!edit && phase !== 'choose' && phase !== 'sukses' && phase !== 'loading' && (
          <p className="text-[11px] text-on-surface-variant text-center">
            Progresmu tersimpan otomatis sebagai draf di perangkat ini.{' '}
            <Link href="/" className="underline underline-offset-2">
              Keluar
            </Link>
          </p>
        )}
      </div>
    </AppShell>
  )
}
