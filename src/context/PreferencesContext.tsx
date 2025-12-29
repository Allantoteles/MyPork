"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

interface PreferencesState {
  units: string;
  restSeconds: number;
  loading: boolean;
  updatePreferences: (newUnits: string, newRest: number) => void;
  refreshPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesState | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<string>('Métrico (kg)');
  const [restSeconds, setRestSeconds] = useState<number>(60);
  const [loading, setLoading] = useState(true);

  const refreshPreferences = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('unidades, descanso_predeterminado')
        .eq('id', user.id)
        .single();

      if (perfil) {
        setUnits(perfil.unidades || 'Métrico (kg)');
        setRestSeconds(perfil.descanso_predeterminado || 60);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPreferences();
  }, []);

  const updatePreferences = (newUnits: string, newRest: number) => {
    setUnits(newUnits);
    setRestSeconds(newRest);
  };

  const value = useMemo(() => ({
    units,
    restSeconds,
    loading,
    updatePreferences,
    refreshPreferences
  }), [units, restSeconds, loading]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within a PreferencesProvider');
  }
  return context;
}
