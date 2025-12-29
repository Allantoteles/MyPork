"use client";

import { useEffect, useState } from 'react';
import { useSync } from '@/hooks/useSync';

export function SyncManager() {
  const { syncAll, isSyncing } = useSync();
  const [hasInitialSync, setHasInitialSync] = useState(false);

  useEffect(() => {
    // Sincronización inicial solo una vez (cargar todo el cache)
    const doInitialSync = async () => {
      await syncAll();
      setHasInitialSync(true);
      localStorage.setItem('lastFullSync', Date.now().toString());
    };

    // Verificar si ya hubo una sincronización reciente (últimas 4 horas)
    const lastSync = localStorage.getItem('lastFullSync');
    const fourHours = 4 * 60 * 60 * 1000;
    
    if (!lastSync || (Date.now() - parseInt(lastSync)) > fourHours) {
      doInitialSync();
    } else {
      setHasInitialSync(true);
    }
    
    // Sincronizar solo cambios pendientes cuando vuelve la conexión
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada, sincronizando cambios...');
      syncAll();
    };

    // Sincronizar cuando la app vuelve al foco (solo si hay conexión)
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine && hasInitialSync) {
        // Solo sync de cambios pendientes, no cache completo
        syncAll();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sincronización periódica muy espaciada (30 minutos) solo para cambios pendientes
    const interval = setInterval(() => {
      if (navigator.onLine && hasInitialSync) {
        syncAll();
      }
    }, 30 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [hasInitialSync]);

  if (!isSyncing) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-primary/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md animate-fade-in">
      <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
      {!hasInitialSync ? 'Cargando datos...' : 'Sincronizando...'}
    </div>
  );
}
