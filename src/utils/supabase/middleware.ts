import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const isCallbackRoute = request.nextUrl.pathname === '/auth/callback'

  // Permitir callback sin redirecciones para que OAuth funcione
  if (isCallbackRoute) {
    return supabaseResponse
  }

  // 1. Si no hay usuario y trata de entrar a la app, al login
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Si hay usuario, redirigir desde auth routes
  if (user) {
    // Si ya está logueado e intenta ir a login, al home
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Nota: La verificación del perfil se hace en el servidor,
    // no en el middleware para evitar timeouts en edge (Cloudflare)
    // Ver: src/app/layout.tsx
  }

  return supabaseResponse
}
