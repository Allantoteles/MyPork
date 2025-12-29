import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { createClient } from '@/utils/supabase/client'

/**
 * Hook para trabajar CACHE-FIRST:
 * 1. Lee primero del cache local (IndexedDB)
 * 2. Si no hay datos o están desactualizados, consulta Supabase
 * 3. Actualiza el cache con datos frescos
 * 
 * Esto minimiza las llamadas a Supabase y funciona offline
 */

type CacheOptions = {
  maxAge?: number // Edad máxima del cache en milisegundos (default: 5 minutos)
  forceRefresh?: boolean // Forzar actualización desde Supabase
}

export function useCacheFirst<T>(
  table: string,
  cacheTable: 'perfilCache' | 'ejerciciosCache' | 'rutinasCache',
  userId?: string,
  options: CacheOptions = {}
) {
  const { maxAge = 5 * 60 * 1000, forceRefresh = false } = options
  
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [isFromCache, setIsFromCache] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      setLoading(true)
      
      try {
        // 1. Cargar ejercicios pendientes locales (sin sincronizar)
        let localData: any[] = []
        if (table === 'ejercicios') {
          localData = await db.ejerciciosPendientes.where('sincronizado').equals(0).toArray()
        }

        // 2. Intentar cargar desde cache local
        const cachedData = await (db as any)[cacheTable].toArray()
        
        if (cachedData && cachedData.length > 0 && !forceRefresh) {
          // Verificar si el cache está fresco
          const firstItem = cachedData[0]
          const cacheAge = Date.now() - new Date(firstItem.actualizado_at).getTime()
          
          if (cacheAge < maxAge) {
            // Cache fresco, usarlo directamente + locales
            if (mounted) {
              setData([...localData, ...cachedData])
              setIsFromCache(true)
              setLoading(false)
            }
            return
          }
        }

        // 3. Si no hay cache o está viejo, ir a Supabase (solo si hay internet)
        if (!navigator.onLine) {
          // Offline: usar cache aunque esté viejo + locales
          if (mounted && cachedData) {
            setData([...localData, ...cachedData])
            setIsFromCache(true)
          }
          setLoading(false)
          return
        }

        const supabase = createClient()
        let query = supabase.from(table).select('*')
        
        if (userId) {
          query = query.eq('usuario_id', userId)
        }
        
        const { data: remoteData, error } = await query

        if (error) {
          console.error(`Supabase error fetching ${table}:`, error)
        }

        if (!error && remoteData && mounted) {
          // 4. Actualizar cache con datos frescos
          const now = new Date()
          for (const item of remoteData) {
            await (db as any)[cacheTable].put({
              ...item,
              actualizado_at: now
            })
          }
          
          setData([...localData, ...remoteData])
          setIsFromCache(false)
        } else if (cachedData && mounted) {
          // Error en Supabase, usar cache como fallback + locales
          setData([...localData, ...cachedData])
          setIsFromCache(true)
        }
        
      } catch (error) {
        console.error('Error en useCacheFirst:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [table, cacheTable, userId, maxAge, forceRefresh])

  return { data, loading, isFromCache }
}

/**
 * Hook especializado para perfil (solo uno por usuario)
 */
export function usePerfilCache(userId: string, options?: CacheOptions) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isFromCache, setIsFromCache] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadPerfil = async () => {
      setLoading(true)
      if (!userId) {
        setLoading(false)
        return
      }
      
      try {
        // 1. Buscar en cache
        const cached = await db.perfilCache.get(userId)
        
        if (cached && !options?.forceRefresh) {
          const cacheAge = Date.now() - new Date(cached.actualizado_at).getTime()
          
          if (cacheAge < (options?.maxAge || 5 * 60 * 1000)) {
            if (mounted) {
              setData(cached)
              setIsFromCache(true)
              setLoading(false)
            }
            return
          }
        }

        // 2. Ir a Supabase si hay conexión
        if (!navigator.onLine) {
          if (mounted && cached) {
            setData(cached)
            setIsFromCache(true)
          }
          setLoading(false)
          return
        }

        const supabase = createClient()
        const { data: perfil, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (!error && perfil && mounted) {
          // Actualizar cache
          await db.perfilCache.put({
            ...perfil,
            actualizado_at: new Date()
          })
          
          setData(perfil)
          setIsFromCache(false)
        } else if (cached && mounted) {
          setData(cached)
          setIsFromCache(true)
        }
        
      } catch (error) {
        console.error('Error en usePerfilCache:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPerfil()

    return () => {
      mounted = false
    }
  }, [userId, options?.maxAge, options?.forceRefresh])

  return { data, loading, isFromCache }
}
