import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'

/**
 * Cookie-bound Supabase client. Used only for Auth (who is signed in); all
 * table and storage access goes through the service-role client.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component — the middleware refreshes the session.
          }
        },
      },
    },
  )
}

/** The signed-in user, verified against Supabase Auth, or null for guests. */
export async function getUser(): Promise<User | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    return data.user ?? null
  } catch {
    return null
  }
}
