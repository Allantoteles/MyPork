'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signOut } from '@/app/login/actions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PreferencesSection } from '@/components/PreferencesSection';
import { WeightEditor } from '@/components/WeightEditor';
import { useSync } from '@/hooks/useSync';

interface SettingsClientProps {
  perfil: any;
  displayName: string;
  avatarUrl: string;
  edad: string;
}

export function SettingsClient({ perfil, displayName, avatarUrl, edad }: SettingsClientProps) {
  const { syncAll } = useSync();
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    setSyncMessage('');
    try {
      await syncAll();
      setSyncMessage('✅ Sincronización completada');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (error) {
      setSyncMessage('❌ Error en sincronización');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setIsSyncingManual(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background-dark/95 backdrop-blur-sm border-b border-white/5 p-4 flex items-center justify-between">
        <Link href="/" className="size-10 flex items-center justify-center rounded-full hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold">Configuraciones</h1>
        <div className="w-10" />
      </header>

      <main className="p-4 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {/* Profile Card */}
        <section className="bg-surface-dark rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-full bg-cover bg-center border-2 border-primary overflow-hidden" 
                style={{ backgroundImage: `url('${avatarUrl}')` }} 
              />
              <button className="absolute bottom-0 right-0 bg-primary text-background-dark rounded-full p-1 border-2 border-surface-dark">
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold leading-tight">{displayName}</h2>
              <p className="text-sm text-text-secondary">{perfil?.racha_dias > 10 ? 'Miembro Pro' : 'Atleta'}</p>
            </div>
            <span className="material-symbols-outlined text-primary">chevron_right</span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
            <WeightEditor initialWeight={perfil?.peso_kg} units={perfil?.unidades || 'Métrico (kg)'} />
            <div className="flex flex-col items-center p-2 bg-background-dark rounded-xl flex-1">
              <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Racha</span>
              <span className="text-lg font-bold text-primary">{perfil?.racha_dias || 0} Días</span>
            </div>
          </div>

          {/* Información Adicional (Altura, Edad, Género) */}
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 bg-background-dark/50 rounded-xl">
              <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Altura</span>
              <span className="text-base font-bold text-white">{perfil?.altura_cm || '--'} cm</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-background-dark/50 rounded-xl">
              <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Edad</span>
              <span className="text-base font-bold text-white">{edad} años</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-background-dark/50 rounded-xl">
              <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Sexo</span>
              <span className="text-base font-bold text-white">{perfil?.genero || '--'}</span>
            </div>
          </div>
        </section>

        {/* Preferences (Interactive) */}
        <PreferencesSection 
          initialUnits={perfil?.unidades || 'Métrico (kg)'} 
          initialRest={perfil?.descanso_predeterminado || 60} 
        />

        {/* General */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-2">General</h3>
          <div className="bg-surface-dark rounded-2xl overflow-hidden border border-white/5">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined">notifications</span>
                </div>
                <span className="font-medium">Notificaciones</span>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 size-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined">dark_mode</span>
                </div>
                <span className="font-medium">Modo Oscuro</span>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={handleManualSync}
              disabled={isSyncingManual}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                  <span className={`material-symbols-outlined ${isSyncingManual ? 'animate-spin' : ''}`}>sync</span>
                </div>
                <div className="text-left">
                  <span className="font-medium block">Sincronizar</span>
                  {syncMessage && <span className="text-xs text-gray-400">{syncMessage}</span>}
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
          </div>
        </section>

        <form action={signOut}>
          <button 
            type="submit"
            className="w-full mt-4 py-4 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold text-base flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </form>

        <div className="py-6 text-center">
          <p className="text-xs text-text-secondary opacity-50">MyPork v1.0.0 • Supabase Cloud</p>
        </div>
      </main>
    </div>
  );
}
