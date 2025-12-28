'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateSessionData(sessionId: string, nombre: string, setsJson: string) {
  const supabase = await createClient()
  const sets = JSON.parse(setsJson)

  try {
    // 1. Actualizar cabecera
    await supabase
      .from('sesiones_entrenamiento')
      .update({ nombre_rutina: nombre })
      .eq('id', sessionId)

    // 2. Borrar detalles viejos
    await supabase
      .from('detalles_sesion')
      .delete()
      .eq('sesion_id', sessionId)

    // 3. Insertar detalles actualizados
    const inserts = sets.map((s: any, index: number) => ({
      sesion_id: sessionId,
      ejercicio_id: s.ejercicio_id || null,
      nombre_ejercicio: s.nombre_ejercicio,
      nro_serie: index + 1,
      reps: parseInt(s.reps) || 0,
      peso_kg: parseFloat(s.weight) || 0
    }))

    if (inserts.length > 0) {
      await supabase.from('detalles_sesion').insert(inserts)
    }

    revalidatePath('/history')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteSession(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sesiones_entrenamiento')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/history')
  revalidatePath('/')
  redirect('/history')
}
