import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function ProfileCheck() {
  const supabase = await createClient()
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Solo hacer la consulta si el usuario está autenticado
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('altura_cm')
      .eq('id', user.id)
      .single()

    const profileIncomplete = !perfil || !perfil.altura_cm
    const isOnboarding = typeof window === 'undefined' ? false : window.location.pathname.includes('/onboarding')

    // Si el perfil está incompleto y no está en onboarding, redirigir
    if (profileIncomplete && !isOnboarding && user) {
      redirect('/onboarding')
    }
  } catch (error) {
    // Silenciar errores de consulta
    console.error('Error checking profile:', error)
  }

  return null
}
