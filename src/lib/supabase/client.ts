import { createBrowserClient } from '@supabase/ssr'

/** Browser Supabase client — Auth only (sign in with Google, sign out). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
