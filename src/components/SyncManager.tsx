"use client";

import { useEffect } from 'react';
import { useSync } from '@/hooks/useSync';

export function SyncManager() {
  const { syncExercises, isSyncing } = useSync();

  useEffect(() => {
    // Sincronizar al montar el componente (abrir la app)
    syncExercises();
    
    // Opcional: Sincronizar cada vez que volvemos a tener foco o red
    window.addEventListener('online', syncExercises);
    return () => window.removeEventListener('online', syncExercises);
  }, []);

  if (!isSyncing) return null;

  // Indicador visual discreto
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-primary/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md animate-fade-in">
      <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
      Sincronizando...
    </div>
  );
}
