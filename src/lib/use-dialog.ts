'use client'

import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Behaviour shared by every dialog/overlay: close on Escape, trap Tab/Shift+Tab
 * inside the panel, move focus into the panel on open, and return focus to the
 * trigger on close. Attach the returned ref to the panel and give it tabIndex={-1}.
 */
export function useDialog(open: boolean, onClose: () => void): RefObject<HTMLDivElement | null> {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    restoreRef.current = (document.activeElement as HTMLElement | null) ?? null

    const focusables = () =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (el) => el.tabIndex >= 0 && el.getClientRects().length > 0,
          )
        : []

    ;(focusables()[0] ?? panel)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const list = focusables()
      if (list.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }
      const active = document.activeElement as HTMLElement | null
      const index = active ? list.indexOf(active) : -1
      if (event.shiftKey) {
        if (index <= 0) {
          event.preventDefault()
          list[list.length - 1].focus()
        }
      } else if (index === -1 || index === list.length - 1) {
        event.preventDefault()
        list[0].focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      restoreRef.current?.focus?.()
    }
  }, [open])

  return panelRef
}
