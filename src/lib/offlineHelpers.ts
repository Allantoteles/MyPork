import { db } from '@/lib/db'

/**
 * Guardar sesión de entrenamiento offline
 */
export async function saveSessionOffline(
  userId: string,
  nombreRutina: string,
  duracionMinutos: number,
  tiempoDescansadoTotalSegundos: number,
  detalles: Array<{
    ejercicio_id: string
    serie_num: number
    repeticiones: number
    peso_kg: number
    completado: boolean
  }>
) {
  try {
    // Guardar sesión
    const sesionId = await db.sesionesPendientes.add({
      usuario_id: userId,
      nombre_rutina: nombreRutina,
      duracion_minutos: duracionMinutos,
      tiempo_descansado_total_segundos: tiempoDescansadoTotalSegundos,
      creado_at: new Date(),
      sincronizado: 0
    })

    // Guardar detalles asociados
    for (const detalle of detalles) {
      await db.detallesSetsPendientes.add({
        sesion_local_id: sesionId,
        ejercicio_id: detalle.ejercicio_id,
        serie_num: detalle.serie_num,
        repeticiones: detalle.repeticiones,
        peso_kg: detalle.peso_kg,
        completado: detalle.completado,
        sincronizado: 0,
        creado_at: new Date()
      })
    }

    console.log('Sesión guardada localmente, se sincronizará cuando haya conexión')
    return { success: true, localId: sesionId }
  } catch (error) {
    console.error('Error guardando sesión offline:', error)
    return { success: false, error }
  }
}

/**
 * Guardar ejercicio offline
 */
export async function saveExerciseOffline(
  nombre: string,
  tipo: string,
  descripcion: string,
  grupoMuscular: string
) {
  try {
    const id = await db.ejerciciosPendientes.add({
      nombre,
      tipo,
      descripcion,
      grupo_muscular: grupoMuscular,
      es_favorito: false,
      sincronizado: 0,
      creado_at: new Date()
    })

    console.log('✅ Ejercicio guardado localmente (solo texto)')
    return { success: true, localId: id }
  } catch (error) {
    console.error('Error guardando ejercicio offline:', error)
    return { success: false, error }
  }
}

/**
 * Obtener estadísticas de datos pendientes de sincronizar
 */
export async function getPendingSyncStats() {
  const ejerciciosPendientes = await db.ejerciciosPendientes
    .where('sincronizado')
    .equals(0)
    .count()

  const sesionesPendientes = await db.sesionesPendientes
    .where('sincronizado')
    .equals(0)
    .count()

  const detallesPendientes = await db.detallesSetsPendientes
    .where('sincronizado')
    .equals(0)
    .count()

  return {
    ejercicios: ejerciciosPendientes,
    sesiones: sesionesPendientes,
    detalles: detallesPendientes,
    total: ejerciciosPendientes + sesionesPendientes + detallesPendientes
  }
}
