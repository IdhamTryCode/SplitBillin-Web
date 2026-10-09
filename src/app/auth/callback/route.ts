import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Only same-site relative paths are allowed as the post-login destination. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/'
  return next
}

/** OAuth return leg: swap the code for a session cookie, then go back in. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error('[auth/callback]', error.message)
  }
  return NextResponse.redirect(`${origin}/masuk?error=1&next=${encodeURIComponent(next)}`)
}
