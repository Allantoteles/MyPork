'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createExercise(formData: FormData) {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string
  const tipo = formData.get('tipo') as string
  const descripcion = formData.get('descripcion') as string
  const esFavorito = formData.get('es_favorito') === 'on'

  if (!nombre) return { error: 'El nombre es obligatorio' }

  const { error } = await supabase
    .from('ejercicios')
    .insert({
      nombre,
      tipo,
      descripcion,
      es_favorito: esFavorito,
      icono: tipo === 'Pesas' ? 'fitness_center' : 'directions_run',
      grupo_muscular: 'General' // Valor por defecto
    })

  if (error) return { error: error.message }

  revalidatePath('/machines')
  redirect('/machines')
}
