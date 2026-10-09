/**
 * Browser-only conveniences for guests (plan.md §4.5). Nothing here is
 * required: every read tolerates missing, blocked, or corrupt storage.
 */

const BILLS_KEY = 'sb:bills'
const DRAFT_KEY = 'sb:draft'
const NAMES_KEY = 'sb:names'
const MAX_BILLS = 30
const MAX_NAMES = 40

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked */
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** A bill created in this browser. `token` is the secret manage token (guests). */
export interface LocalBill {
  id: string
  token: string | null
  merchant: string
  total: number
  createdAt: string
}

export function getLocalBills(): LocalBill[] {
  const list = read<LocalBill[]>(BILLS_KEY, [])
  return Array.isArray(list) ? list.filter((b) => b && typeof b.id === 'string') : []
}

export function saveLocalBill(bill: LocalBill): void {
  const rest = getLocalBills().filter((b) => b.id !== bill.id)
  write(BILLS_KEY, [bill, ...rest].slice(0, MAX_BILLS))
}

export function removeLocalBill(id: string): void {
  write(
    BILLS_KEY,
    getLocalBills().filter((b) => b.id !== id),
  )
}

export function getDraft<T>(): T | null {
  return read<T | null>(DRAFT_KEY, null)
}

export function saveDraft(draft: unknown): void {
  write(DRAFT_KEY, draft)
}

export function clearDraft(): void {
  remove(DRAFT_KEY)
}

/** Names used before, offered as quick suggestions on the members step. */
export function getSavedNames(): string[] {
  const list = read<string[]>(NAMES_KEY, [])
  return Array.isArray(list) ? list.filter((n) => typeof n === 'string') : []
}

export function rememberNames(names: string[]): void {
  const merged = [...new Set([...names.map((n) => n.trim()).filter(Boolean), ...getSavedNames()])]
  write(NAMES_KEY, merged.slice(0, MAX_NAMES))
}

/** Which member the viewer picked on a bill page ("Kamu yang mana?"). */
export function getPickedMember(billId: string): string | null {
  return read<string | null>(`sb:me:${billId}`, null)
}

export function setPickedMember(billId: string, memberId: string): void {
  write(`sb:me:${billId}`, memberId)
}

export function clearLocalData(): void {
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('sb:')) window.localStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
}
