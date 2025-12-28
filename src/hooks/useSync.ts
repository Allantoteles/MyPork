import { useState } from 'react'
import { db } from '@/lib/db'
import { createClient } from '@/utils/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false)

  const syncExercises = async () => {
    if (!navigator.onLine) return // No intentar si no hay red

    setIsSyncing(true)
    const supabase = createClient()
    
    try {
      // 0. Obtener usuario actual para asignar propiedad
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsSyncing(false)
        return
      }

      // 1. Buscar pendientes
      const pendientes = await db.ejerciciosPendientes
        .where('sincronizado')
        .equals(0)
        .toArray()

      if (pendientes.length === 0) {
        setIsSyncing(false)
        return
      }

      console.log(`Sincronizando ${pendientes.length} ejercicios...`)

      for (const ex of pendientes) {
        let fotoUrl = null

        // 2. Subir Foto (si existe)
        if (ex.foto_blob) {
          const fileName = `${user.id}/${uuidv4()}.jpg` // Organizar por usuario
          const { data, error: uploadError } = await supabase
            .storage
            .from('ejercicios')
            .upload(fileName, ex.foto_blob)

          if (!uploadError && data) {
            const { data: publicUrl } = supabase.storage.from('ejercicios').getPublicUrl(fileName)
            fotoUrl = publicUrl.publicUrl
          }
        }

        // 3. Insertar en Supabase
        const payload = {
            usuario_id: user.id,
            nombre: ex.nombre,
            tipo: ex.tipo,
            descripcion: ex.descripcion || '', // Evitar undefined
            es_favorito: !!ex.es_favorito, // Asegurar boolean
            grupo_muscular: ex.grupo_muscular,
            icono: ex.tipo === 'Pesas' ? 'fitness_center' : 'directions_run',
            foto_url: fotoUrl
        }

        const { error: insertError } = await supabase
          .from('ejercicios')
          .insert(payload)

        if (insertError) {
          console.error("Error detallado al insertar ejercicio:", insertError)
          console.log("Payload enviado:", payload)
        }

        if (!insertError) {
          // 4. Marcar como sincronizado (o borrar local)
          if (ex.id) {
            await db.ejerciciosPendientes.update(ex.id, { sincronizado: 1 })
            // Opcional: await db.ejerciciosPendientes.delete(ex.id) // Para limpiar espacio
          }
        }
      }

    } catch (error) {
      console.error("Error en sync:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  return { syncExercises, isSyncing }
}
