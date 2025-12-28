'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function logWorkoutSession(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const nombreRutina = formData.get('nombre') as string
  const duracion = parseInt(formData.get('duracion') as string) || 45
  const setsJson = formData.get('sets') as string
  const fechaManual = formData.get('fecha') as string

  // 1. Obtener usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // 2. Insertar Sesión (Cabecera)
  const { data: sesion, error: sessionError } = await supabase
    .from('sesiones_entrenamiento')
    .insert({
      usuario_id: user.id,
      nombre_rutina: nombreRutina,
      duracion_minutos: duracion,
      creado_at: fechaManual ? new Date(fechaManual).toISOString() : new Date().toISOString()
    })
    .select()
    .single()

  if (sessionError) return { error: sessionError.message }

  // 3. Insertar Detalles (Sets con Metas)
  if (setsJson) {
    const sets = JSON.parse(setsJson)
    
    const setsToInsert = sets.map((s: any, index: number) => ({
      sesion_id: sesion.id,
      ejercicio_id: s.ejercicio_id || null,
      nombre_ejercicio: s.nombre_ejercicio,
      nro_serie: index + 1,
      reps: parseInt(s.reps) || 0,
      peso_kg: parseFloat(s.weight) || 0,
      // Guardamos la meta que venía del plan
      meta_reps: parseInt(s.meta_reps) || null,
      meta_peso_kg: parseFloat(s.meta_weight) || null
    }))

    if (setsToInsert.length > 0) {
      await supabase.from('detalles_sesion').insert(setsToInsert)
    }
  }

  revalidatePath('/history')
  revalidatePath('/')
  redirect('/history')
}
