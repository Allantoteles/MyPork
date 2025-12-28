'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function saveWeeklyPlan(nombrePlan: string, planJson: string) {
  const supabase = await createClient()

  // 1. Obtener usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }

  const plan = JSON.parse(planJson) // Estructura: { L: [], M: [], ... }

  try {
    // A. Crear la Rutina Maestra
    const { data: rutina, error: rutinaError } = await supabase
      .from('rutinas')
      .insert({
        usuario_id: user.id,
        nombre: nombrePlan || 'Mi Plan Semanal'
      })
      .select()
      .single()

    if (rutinaError) throw rutinaError;

    // B. Preparar ejercicios
    const todosLosEjercicios: any[] = []

    for (const [dia, ejercicios] of Object.entries(plan) as any) {
      if (!Array.isArray(ejercicios) || ejercicios.length === 0) continue;

      ejercicios.forEach((ex: any, index: number) => {
        todosLosEjercicios.push({
          rutina_id: rutina.id,
          ejercicio_id: ex.id,
          orden: index,
          dia: dia,
          plan_sets: ex.sets || []
        })
      })
    }

    if (todosLosEjercicios.length > 0) {
      const { error: exercisesError } = await supabase
        .from('ejercicios_rutina')
        .insert(todosLosEjercicios)

      if (exercisesError) throw exercisesError;
    }

    revalidatePath('/machines')
    return { success: true }
  } catch (error: any) {
    console.error("Error al guardar plan:", error)
    return { error: error.message }
  }
}
