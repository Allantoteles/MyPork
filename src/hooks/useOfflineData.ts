import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { createClient } from '@/utils/supabase/client'

/**
 * Hook para obtener datos con soporte offline
 * Intenta obtener de Supabase primero, si falla usa cache local
 */
export function useOfflineData<T>(
  table: string,
  cacheTable: 'perfilCache' | 'ejerciciosCache' | 'rutinasCache',
  userId?: string
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      if (navigator.onLine) {
        // Intentar obtener datos frescos de Supabase
        try {
          const supabase = createClient()
          let query = supabase.from(table).select('*')
          
          if (userId) {
            query = query.eq('usuario_id', userId)
          }
          
          const { data: remoteData, error } = await query
          
          if (!error && remoteData) {
            setData(remoteData as T)
            setIsOffline(false)
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Error fetching from Supabase, using cache:', error)
        }
      }

      // Si no hay conexión o falló Supabase, usar cache
      try {
        const cachedData = await (db as any)[cacheTable].toArray()
        setData(cachedData as T)
        setIsOffline(true)
      } catch (error) {
        console.error('Error loading cache:', error)
      }
      
      setLoading(false)
    }

    fetchData()

    // Escuchar cambios de conectividad
    const handleOnline = () => {
      setIsOffline(false)
      fetchData()
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [table, cacheTable, userId])

  return { data, loading, isOffline }
}
