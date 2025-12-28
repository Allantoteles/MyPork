import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

const getBaseUrl = (origin: string | null) => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  return (envUrl && envUrl.replace(/\/$/, '')) || origin || 'http://localhost:3000'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const baseUrl = getBaseUrl(origin)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${baseUrl}/login?error=auth-code-error`)
}
