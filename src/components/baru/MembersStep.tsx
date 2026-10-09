'use client'

import React, { useState } from 'react'
import { MemberAvatar } from './MemberChip'
import { DEFAULT_COLORS } from './types'
import type { BillMember } from '@/lib/schemas'

interface MembersStepProps {
  members: BillMember[]
  error: string | null
  onMembersChange: (members: BillMember[]) => void
  onContinue: () => void
  onBack: () => void
}

export function MembersStep({ members, error, onMembersChange, onContinue, onBack }: MembersStepProps) {
  const [newName, setNewName] = useState('')

  const addMember = () => {
    if (!newName.trim()) return
    const id = `m_${Date.now().toString(36)}`
    const color = DEFAULT_COLORS[members.length % DEFAULT_COLORS.length]
    onMembersChange([...members, { id, name: newName.trim(), color, is_payer: false, paid_at: null }])
    setNewName('')
  }

  const removeMember = (id: string) => {
    if (members.length <= 2) return
    onMembersChange(members.filter((m) => m.id !== id))
  }

  const setPayer = (id: string) => {
    onMembersChange(members.map((m) => ({ ...m, is_payer: m.id === id })))
  }

  return (
    <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
      <h1 className="text-lg font-bold text-on-surface">Siapa Saja Yang Patungan?</h1>

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addMember()}
          placeholder="Nama teman..."
          className="flex-1 p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-on-surface"
        />
        <button
          type="button"
          onClick={addMember}
          className="px-4 bg-primary text-on-primary font-semibold rounded-xl text-sm"
        >
          + Tambah
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-on-surface-variant font-semibold">Daftar Anggota &amp; Penalang:</span>
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-900"
          >
            <div className="flex items-center gap-2">
              <MemberAvatar member={m} />
              <span className="text-sm text-on-surface font-medium">{m.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPayer(m.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  m.is_payer ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {m.is_payer ? 'Penalang ✓' : 'Set Penalang'}
              </button>
              {members.length > 2 && (
                <button type="button" onClick={() => removeMember(m.id)} className="text-error text-xs p-1">
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-on-surface-variant">Cukup nama panggilan, gak perlu nomor HP.</p>
      {error && <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">{error}</div>}

      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
        >
          ← Kembali
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm"
        >
          Lanjut Cara Bagi →
        </button>
      </div>
    </div>
  )
}
