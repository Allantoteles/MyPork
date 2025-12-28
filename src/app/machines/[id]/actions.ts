'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateExercise(id: string, formData: FormData) {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string
  const esFavorito = formData.get('es_favorito') === 'on'
  const tipo = formData.get('tipo') as string
  const grupoMuscular = formData.get('grupo_muscular') as string

  const { error } = await supabase
    .from('ejercicios')
    .update({
      nombre,
      descripcion,
      es_favorito: esFavorito,
      tipo,
      grupo_muscular: grupoMuscular,
      icono: tipo === 'Pesas' ? 'fitness_center' : 'directions_run'
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/machines')
  redirect('/machines')
}

export async function deleteExercise(id: string) {
  const supabase = await createClient()

  console.log("Intentando eliminar ejercicio con ID:", id)

  const { data, error } = await supabase
    .from('ejercicios')
    .delete()
    .eq('id', id)
    .select()

  if (error) {
    console.error("❌ ERROR SQL:", error)
    return { error: error.message }
  }

  if (data.length === 0) {
    console.error("⚠️ ALERTA: La operación fue exitosa pero NO se borró ninguna fila. Posible causa: RLS (Permisos) o ID incorrecto.")
    return { error: "No se pudo borrar. Verifica tus permisos." }
  }

  console.log("✅ Ejercicio eliminado realmenta. Filas afectadas:", data.length)
  revalidatePath('/machines')
  redirect('/machines')
}
