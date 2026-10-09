'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface UserState {
  user: User | null
  /** False until the session cookie has been read. */
  ready: boolean
}

/**
 * Signed-in user as seen by the browser. For UI only: the server verifies the
 * session itself on every action.
 */
export function useUser(): UserState {
  const [state, setState] = useState<UserState>({ user: null, ready: false })

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      setState({ user: null, ready: true })
      return
    }
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setState({ user: data.session?.user ?? null, ready: true }))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, ready: true })
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return state
}
