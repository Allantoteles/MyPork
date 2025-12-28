'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfilePreference(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const updates: any = {}
  
  const unidades = formData.get('unidades')
  if (unidades) updates.unidades = unidades

  const descanso = formData.get('descanso')
  if (descanso) updates.descanso_predeterminado = parseInt(descanso as string)

  const peso = formData.get('peso')
  if (peso) updates.peso_kg = parseFloat(peso as string)

  if (Object.keys(updates).length > 0) {
    await supabase
      .from('perfiles')
      .update(updates)
      .eq('id', user.id)
    
    revalidatePath('/settings')
  }
}
