'use client'

import React, { useEffect, useImperativeHandle, useRef } from 'react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const WAIT_MS = 15_000

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export interface TurnstileHandle {
  /**
   * A fresh single-use token, or undefined when Turnstile is not configured
   * (local dev with TURNSTILE_BYPASS) or the challenge did not finish in time.
   * The server decides; a missing token is rejected there.
   */
  getToken: () => Promise<string | undefined>
}

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const el = document.createElement('script')
      el.src = SCRIPT_SRC
      el.async = true
      el.onload = () => resolve()
      el.onerror = () => {
        scriptPromise = null
        reject(new Error('turnstile_script'))
      }
      document.head.appendChild(el)
    })
  }
  return scriptPromise
}

/**
 * Cloudflare Turnstile, invisible unless Cloudflare asks for interaction.
 * Renders nothing when no site key is configured.
 */
export function Turnstile({ ref }: { ref: React.Ref<TurnstileHandle> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const token = useRef<string | undefined>(undefined)
  const waiters = useRef<Array<(t: string | undefined) => void>>([])

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false

    const settle = (value: string | undefined) => {
      token.current = value
      if (value === undefined) return
      const pending = waiters.current
      waiters.current = []
      if (pending.length > 0) {
        token.current = undefined
        pending.forEach((resolve) => resolve(value))
      }
    }

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          callback: (t: string) => settle(t),
          'expired-callback': () => settle(undefined),
          'error-callback': () => settle(undefined),
        })
      })
      .catch(() => {
        /* getToken times out and the server rejects the scan */
      })

    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [])

  useImperativeHandle(ref, () => ({
    getToken: () => {
      if (!SITE_KEY) return Promise.resolve(undefined)

      const ready = token.current
      if (ready) {
        // Tokens are single-use: hand it out and ask for the next one.
        token.current = undefined
        if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
        return Promise.resolve(ready)
      }

      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          waiters.current = waiters.current.filter((w) => w !== onToken)
          resolve(undefined)
        }, WAIT_MS)
        const onToken = (t: string | undefined) => {
          clearTimeout(timer)
          if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
          resolve(t)
        }
        waiters.current.push(onToken)
      })
    },
  }))

  if (!SITE_KEY) return null
  return <div ref={containerRef} className="flex justify-center empty:hidden" />
}
