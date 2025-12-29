'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function updateExercise(id: string, formData: FormData) {
  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string
  const esFavorito = formData.get('es_favorito') === 'on'
  const tipo = formData.get('tipo') as string
  const grupoMuscular = formData.get('grupo_muscular') as string
  const isLocalOnly = formData.get('isLocalOnly') === 'true'

  if (isLocalOnly) {
    // Ejercicio local: actualizar en IndexedDB
    try {
      const localId = parseInt(id)
      await db.ejerciciosPendientes.update(localId, {
        nombre,
        descripcion,
        es_favorito: esFavorito,
        tipo,
        grupo_muscular: grupoMuscular,
        icono: tipo === 'Pesas' ? 'fitness_center' : 'directions_run'
      })
      revalidatePath('/machines')
      redirect('/machines')
    } catch (error) {
      return { error: 'Error al actualizar ejercicio local' }
    }
  } else {
    // Ejercicio remoto: actualizar en Supabase
    const supabase = await createClient()

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
}

export async function deleteExercise(id: string, isLocalOnly: boolean = false) {
  if (isLocalOnly) {
    // Ejercicio local: eliminar de IndexedDB
    try {
      const localId = parseInt(id)
      await db.ejerciciosPendientes.delete(localId)
      revalidatePath('/machines')
      redirect('/machines')
    } catch (error) {
      return { error: 'Error al eliminar ejercicio local' }
    }
  } else {
    // Ejercicio remoto: registrar como borrado para sincronizar después
    try {
      // Guardar el borrado en IndexedDB para sincronizar después
      await db.ejerciciosBorrados.add({
        ejercicio_id: id,
        borrado_at: new Date(),
        sincronizado: 0 // Pendiente de sincronizar
      })
      revalidatePath('/machines')
      redirect('/machines')
    } catch (error) {
      console.error('Error registrando borrado:', error)
      return { error: 'Error al eliminar ejercicio' }
    }
  }
}
