'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateWeeklyPlan(rutinaId: string, nombrePlan: string, planJson: string) {
  const supabase = await createClient()

  // El planJson viene como: { L: { ejercicios: [ { id, sets: [] } ] }, ... }
  const plan = JSON.parse(planJson)

  try {
    // 1. Actualizar el nombre de la rutina
    await supabase
      .from('rutinas')
      .update({ nombre: nombrePlan })
      .eq('id', rutinaId)

    // 2. Borrar ejercicios actuales para reemplazarlos (Limpieza)
    await supabase
      .from('ejercicios_rutina')
      .delete()
      .eq('rutina_id', rutinaId)

    // 3. Insertar los nuevos ejercicios con sus series dinámicas
    const todosLosEjercicios: any[] = []
    
    for (const [dia, data] of Object.entries(plan) as any) {
      if (!data.ejercicios || data.ejercicios.length === 0) continue;

      data.ejercicios.forEach((ex: any, index: number) => {
        todosLosEjercicios.push({
          rutina_id: rutinaId,
          ejercicio_id: ex.id,
          orden: index,
          dia: dia,
          plan_sets: ex.sets || [] // Guardamos el JSON de las series
        })
      })
    }

    if (todosLosEjercicios.length > 0) {
      const { error: insertError } = await supabase
        .from('ejercicios_rutina')
        .insert(todosLosEjercicios)
      
      if (insertError) throw insertError;
    }

    revalidatePath('/machines')
    return { success: true }
  } catch (error: any) {
    console.error("Error al actualizar rutina:", error)
    return { error: error.message }
  }
}

export async function deleteRoutine(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('rutinas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/machines')
  redirect('/machines')
}