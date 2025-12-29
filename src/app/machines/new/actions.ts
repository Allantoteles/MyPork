'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createExercise(formData: FormData) {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string
  const tipo = formData.get('tipo') as string
  const descripcion = formData.get('descripcion') as string
  const grupoMuscular = formData.get('grupo_muscular') as string
  const esFavorito = formData.get('es_favorito') === 'on'
  const fotoBase64 = formData.get('foto_base64') as string

  if (!nombre) return { error: 'El nombre es obligatorio' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('ejercicios')
    .insert({
      usuario_id: user.id,
      nombre,
      tipo,
      descripcion,
      es_favorito: esFavorito,
      icono: tipo === 'Pesas' ? 'fitness_center' : 'directions_run',
      grupo_muscular: grupoMuscular || 'General',
      foto_url: fotoBase64 || null
    })

  if (error) return { error: error.message }

  revalidatePath('/machines')
  redirect('/machines')
}
