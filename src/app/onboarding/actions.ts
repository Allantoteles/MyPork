'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const peso = parseFloat(formData.get('peso') as string)
  const altura = parseInt(formData.get('altura') as string)
  const fechaNacimiento = formData.get('fecha_nacimiento') as string
  const genero = formData.get('genero') as string

  const { error } = await supabase
    .from('perfiles')
    .update({
      peso_kg: peso,
      altura_cm: altura,
      fecha_nacimiento: fechaNacimiento,
      genero: genero,
      actualizado_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}
