'use client'

import React, { useState } from 'react'
import { MemberAvatar } from './MemberChip'
import { DEFAULT_COLORS } from './types'
import { MAX_MEMBERS } from '@/lib/bill-validate'
import type { BillMember } from '@/lib/schemas'

interface MembersStepProps {
  members: BillMember[]
  /** Names used before (this browser, or saved friends of the account). */
  suggestions: string[]
  error: string | null
  onMembersChange: (members: BillMember[]) => void
  onContinue: () => void
  onBack: () => void
}

function newMemberId(): string {
  return `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function MembersStep({ members, suggestions, error, onMembersChange, onContinue, onBack }: MembersStepProps) {
  const [newName, setNewName] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const taken = (name: string, exceptId?: string) =>
    members.some((m) => m.id !== exceptId && m.name.trim().toLowerCase() === name.trim().toLowerCase())

  const add = (raw: string) => {
    const name = raw.trim()
    if (!name) return
    if (taken(name)) return setLocalError(`"${name}" sudah ada. Pakai nama lain biar gak tertukar.`)
    if (members.length >= MAX_MEMBERS) return setLocalError(`Maksimal ${MAX_MEMBERS} orang.`)
    setLocalError(null)
    // Pick the first palette colour nobody uses yet, so removed members free theirs up.
    const used = new Set(members.map((m) => m.color))
    const color = DEFAULT_COLORS.find((c) => !used.has(c)) ?? DEFAULT_COLORS[members.length % DEFAULT_COLORS.length]
    onMembersChange([
      ...members,
      { id: newMemberId(), name, color, is_payer: members.length === 0, paid_at: null },
    ])
    setNewName('')
  }

  const rename = (id: string, name: string) => {
    setLocalError(null)
    onMembersChange(members.map((m) => (m.id === id ? { ...m, name } : m)))
  }

  const remove = (id: string) => {
    const rest = members.filter((m) => m.id !== id)
    // Someone always has to be the payer.
    if (rest.length > 0 && !rest.some((m) => m.is_payer)) rest[0] = { ...rest[0], is_payer: true }
    onMembersChange(rest)
  }

  const setPayer = (id: string) => onMembersChange(members.map((m) => ({ ...m, is_payer: m.id === id })))

  const openSuggestions = suggestions.filter((s) => !taken(s)).slice(0, 12)
  const shownError = localError ?? error

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-bold text-on-surface">Siapa saja yang patungan?</h1>
        <p className="text-xs text-on-surface-variant">Cukup nama panggilan, gak perlu nomor HP. Minimal 2 orang.</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          maxLength={60}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add(newName)}
          placeholder="Nama teman"
          aria-label="Nama teman"
          className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm text-on-surface"
        />
        <button
          type="button"
          onClick={() => add(newName)}
          disabled={!newName.trim()}
          className="px-4 h-11 bg-primary text-on-primary font-semibold rounded-xl text-sm disabled:opacity-50"
        >
          + Tambah
        </button>
      </div>

      {openSuggestions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-on-surface-variant font-medium">Pernah dipakai</span>
          <div className="flex flex-wrap gap-1.5">
            {openSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="px-3 h-11 rounded-full bg-surface-container text-xs font-semibold text-on-surface"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs text-on-surface-variant font-semibold">
          Anggota ({members.length}) · pilih siapa yang nalangin
        </span>
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low">
            <MemberAvatar member={m} className="w-8 h-8 text-sm" />
            <input
              type="text"
              value={m.name}
              maxLength={60}
              onChange={(e) => rename(m.id, e.target.value)}
              aria-label={`Nama anggota ${m.name}`}
              className="flex-1 min-w-0 h-10 px-2 rounded-lg bg-transparent text-sm font-medium text-on-surface focus:bg-surface-container-lowest"
            />
            <button
              type="button"
              onClick={() => setPayer(m.id)}
              aria-pressed={m.is_payer}
              className={`shrink-0 px-3 h-11 rounded-lg text-xs font-semibold ${
                m.is_payer ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {m.is_payer ? 'Nalangin ✓' : 'Nalangin?'}
            </button>
            <button
              type="button"
              onClick={() => remove(m.id)}
              aria-label={`Hapus ${m.name}`}
              className="shrink-0 w-11 h-11 text-error text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {shownError && (
        <div role="alert" className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">
          {shownError}
        </div>
      )}

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
          Lanjut →
        </button>
      </div>
    </div>
  )
}
