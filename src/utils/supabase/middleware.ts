import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
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

  // 1. Si no hay usuario y trata de entrar a la app, al login
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Si hay usuario, verificar estado del perfil
  if (user) {
    // Si ya está logueado e intenta ir a login, al home (o onboarding)
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Verificar si el perfil está completo
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('altura_cm')
      .eq('id', user.id)
      .single()

    const profileIncomplete = !perfil || !perfil.altura_cm

    // BLOQUEO: Si el perfil está incompleto y NO está en onboarding, redirigir a onboarding
    if (profileIncomplete && !isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Si el perfil está completo e intenta volver a onboarding, al home
    if (!profileIncomplete && isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
