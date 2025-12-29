import { useState } from 'react'
import { db } from '@/lib/db'
import { createClient } from '@/utils/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false)

  // Sincronizar ejercicios pendientes
  const syncExercises = async () => {
    if (!navigator.onLine) return

    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Sincronizar ejercicios nuevos
      const pendientes = await db.ejerciciosPendientes
        .where('sincronizado')
        .equals(0)
        .toArray()

      if (pendientes.length > 0) {
        console.log(`Sincronizando ${pendientes.length} ejercicios nuevos...`)

        for (const ex of pendientes) {
          const payload = {
              usuario_id: user.id,
              nombre: ex.nombre,
              tipo: ex.tipo,
              descripcion: ex.descripcion || '',
              es_favorito: !!ex.es_favorito,
              grupo_muscular: ex.grupo_muscular,
              icono: ex.tipo === 'Pesas' ? 'fitness_center' : 'directions_run',
              foto_url: ex.foto_base64 || null
          }

          const { error: insertError } = await supabase
            .from('ejercicios')
            .insert(payload)

          if (insertError) {
            console.error("Error al insertar ejercicio:", insertError)
          }

          if (!insertError && ex.id) {
            await db.ejerciciosPendientes.update(ex.id, { sincronizado: 1 })
          }
        }
      }

      // 2. Sincronizar ejercicios borrados
      const borrados = await db.ejerciciosBorrados
        .where('sincronizado')
        .equals(0)
        .toArray()

      if (borrados.length > 0) {
        console.log(`Sincronizando ${borrados.length} ejercicios borrados...`)

        for (const borrado of borrados) {
          const { error: deleteError } = await supabase
            .from('ejercicios')
            .delete()
            .eq('id', borrado.ejercicio_id)

          if (deleteError) {
            console.error("Error al borrar ejercicio:", deleteError)
          }

          if (!deleteError && borrado.id) {
            await db.ejerciciosBorrados.update(borrado.id, { sincronizado: 1 })
          }
        }
      }

    } catch (error) {
      console.error("Error en syncExercises:", error)
    }
  }

  // Sincronizar sesiones de entrenamiento
  const syncSessions = async () => {
    if (!navigator.onLine) return

    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const sesionesPendientes = await db.sesionesPendientes
        .where('sincronizado')
        .equals(0)
        .toArray()

      if (sesionesPendientes.length === 0) return

      console.log(`Sincronizando ${sesionesPendientes.length} sesiones...`)

      for (const sesion of sesionesPendientes) {
        // Insertar sesión
        const { data: sesionData, error: sesionError } = await supabase
          .from('sesiones_entrenamiento')
          .insert({
            usuario_id: user.id,
            nombre_rutina: sesion.nombre_rutina,
            duracion_minutos: sesion.duracion_minutos,
            tiempo_descansado_total_segundos: sesion.tiempo_descansado_total_segundos || 0,
            creado_at: sesion.creado_at.toISOString()
          })
          .select('id')
          .single()

        if (sesionError || !sesionData) {
          console.error("Error al insertar sesión:", sesionError)
          continue
        }

        // Sincronizar detalles de sets asociados
        if (sesion.id) {
          const detalles = await db.detallesSetsPendientes
            .where('sesion_local_id')
            .equals(sesion.id)
            .toArray()

          for (const detalle of detalles) {
            const { error: detalleError } = await supabase
              .from('detalles_sesion')
              .insert({
                sesion_id: sesionData.id,
                ejercicio_id: detalle.ejercicio_id,
                serie_num: detalle.serie_num,
                repeticiones: detalle.repeticiones,
                peso_kg: detalle.peso_kg,
                completado: detalle.completado
              })

            if (!detalleError && detalle.id) {
              await db.detallesSetsPendientes.update(detalle.id, { 
                sincronizado: 1,
                sesion_remota_id: sesionData.id 
              })
            }
          }

          // Marcar sesión como sincronizada
          await db.sesionesPendientes.update(sesion.id, { sincronizado: 1 })
        }
      }

    } catch (error) {
      console.error("Error en syncSessions:", error)
    }
  }

  // Sincronizar cache de datos remotos
  const syncCache = async () => {
    if (!navigator.onLine) return

    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Cache perfil
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (perfil) {
        await db.perfilCache.put({
          id: perfil.id,
          nombre_completo: perfil.nombre_completo,
          avatar_url: perfil.avatar_url,
          peso_kg: perfil.peso_kg,
          unidades: perfil.unidades || null,
          descanso_predeterminado: perfil.descanso_predeterminado ?? null,
          altura_cm: perfil.altura_cm ?? null,
          genero: perfil.genero ?? null,
          racha_dias: perfil.racha_dias,
          actualizado_at: new Date()
        })
      }

      // Cache ejercicios
      const { data: ejercicios } = await supabase
        .from('ejercicios')
        .select('*')
        .eq('usuario_id', user.id)

      if (ejercicios) {
        for (const ej of ejercicios) {
          await db.ejerciciosCache.put({
            id: ej.id,
            nombre: ej.nombre,
            grupo_muscular: ej.grupo_muscular,
            equipamiento: ej.equipamiento,
            icono: ej.icono,
            actualizado_at: new Date()
          })
        }
      }

      // Cache rutinas
      const { data: rutinas } = await supabase
        .from('rutinas')
        .select('*')
        .eq('usuario_id', user.id)

      if (rutinas) {
        for (const rut of rutinas) {
          await db.rutinasCache.put({
            id: rut.id,
            usuario_id: rut.usuario_id,
            nombre: rut.nombre,
            dia_asignado: rut.dia_asignado,
            actualizado_at: new Date()
          })
        }
      }

      console.log('Cache actualizado')

    } catch (error) {
      console.error("Error en syncCache:", error)
    }
  }

  // Sincronización completa (solo al inicio o cuando el usuario lo solicita)
  const syncAll = async () => {
    if (!navigator.onLine) return

    setIsSyncing(true)
    try {
      // Primero sincronizar cambios pendientes (escrituras)
      await syncExercises()
      await syncSessions()
      
      // Luego actualizar cache (lecturas)
      await syncCache()
      
      console.log('✅ Sincronización completa exitosa')
    } catch (error) {
      console.error('❌ Error en sincronización:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  return { syncAll, syncExercises, syncSessions, syncCache, isSyncing }
}
