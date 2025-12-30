"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const Navigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Don't show nav on login screen
  if (isActive('/login')) return null;

  const handleNavigation = (path: string) => {
    setShowMenu(false);
    router.push(path);
  };

  return (
    <>
      {/* --- MENU DESPLEGABLE (Action Sheet iOS Style) --- */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop (Cierra al tocar fuera) */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-fade-in"
            onClick={() => setShowMenu(false)}
          />

          {/* Panel de Opciones */}
          <div className="relative z-10 w-full px-4 pb-6 animate-slide-up">
            <div className="flex flex-col gap-2">
              
              {/* Grupo de Acciones */}
              <div className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-xl border border-gray-100 dark:border-white/5">
                <div className="px-4 py-3 text-center text-xs font-bold text-gray-400 dark:text-text-secondary/50 border-b border-gray-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  ¿QUÉ QUIERES HACER HOY?
                </div>
                
                <button 
                  onClick={() => handleNavigation('/machines?intent=log_session')}
                  className="flex items-center gap-4 px-4 py-4 w-full text-left active:bg-slate-100 dark:active:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                >
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">fitness_center</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-slate-900 dark:text-white">Registrar Entrenamiento</span>
                    <span className="text-xs text-slate-500 dark:text-text-secondary/60">Loguear una sesión rápida</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigation('/create-routine')}
                  className="flex items-center gap-4 px-4 py-4 w-full text-left active:bg-slate-100 dark:active:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                >
                  <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <span className="material-symbols-outlined">list_alt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-slate-900 dark:text-white">Crear Rutina</span>
                    <span className="text-xs text-slate-500 dark:text-text-secondary/60">Diseñar un nuevo plan</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigation('/machines/new')}
                  className="flex items-center gap-4 px-4 py-4 w-full text-left active:bg-slate-100 dark:active:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5"
                >
                  <div className="size-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-slate-900 dark:text-white">Nuevo Ejercicio</span>
                    <span className="text-xs text-slate-500 dark:text-text-secondary/60">Añadir a la biblioteca</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigation('/explore')}
                  className="flex items-center gap-4 px-4 py-4 w-full text-left active:bg-slate-100 dark:active:bg-white/5 transition-colors"
                >
                  <div className="size-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                    <span className="material-symbols-outlined">explore</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-slate-900 dark:text-white">Explorar Wger</span>
                    <span className="text-xs text-slate-500 dark:text-text-secondary/60">Buscar en base de datos externa</span>
                  </div>
                </button>
              </div>

              {/* Botón Cancelar */}
              <button 
                onClick={() => setShowMenu(false)}
                className="w-full py-4 bg-white dark:bg-surface-dark rounded-2xl text-primary font-black text-lg active:scale-[0.98] transition-all shadow-lg border border-gray-100 dark:border-white/5"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BARRA DE NAVEGACIÓN --- */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-surface-dark/90 backdrop-blur-lg border-t border-border-dark px-6 py-2 pb-6 z-50 transition-colors duration-300"
        suppressHydrationWarning={true}
      >
        <div 
          className="flex items-center justify-between max-w-md mx-auto"
          suppressHydrationWarning={true}
        >
          <button 
            onClick={() => router.push('/')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/') ? 'text-primary' : 'text-text-secondary hover:text-primary/70'}`}
          >
            <span className={`material-symbols-outlined ${isActive('/') ? 'filled' : ''}`}>home</span>
            <span className="text-[10px] font-medium">Inicio</span>
          </button>

          <button 
            onClick={() => router.push('/machines')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/machines') && !isActive('/machines?intent=log_session') ? 'text-primary' : 'text-text-secondary hover:text-primary/70'}`}
          >
            <span className={`material-symbols-outlined ${isActive('/machines') && !isActive('/machines?intent=log_session') ? 'filled' : ''}`}>library_books</span>
            <span className="text-[10px] font-medium">Biblioteca</span>
          </button>

          <div 
            className="relative -top-5"
            suppressHydrationWarning={true}
          >
            <button 
              onClick={() => setShowMenu(true)} // AHORA ABRE EL MENÚ
              className={`flex items-center justify-center size-14 rounded-full text-[#221910] shadow-[0_4px_12px_rgba(242,127,13,0.4)] hover:scale-105 transition-transform ${showMenu ? 'bg-white rotate-45' : 'bg-primary'}`}
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>

          <button 
            onClick={() => router.push('/history')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/history') ? 'text-primary' : 'text-text-secondary hover:text-primary/70'}`}
          >
            <span className={`material-symbols-outlined ${isActive('/history') ? 'filled' : ''}`}>bar_chart</span>
            <span className="text-[10px] font-medium">Progreso</span>
          </button>

          <button 
            onClick={() => router.push('/settings')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/settings') ? 'text-primary' : 'text-text-secondary hover:text-primary/70'}`}
          >
            <span className={`material-symbols-outlined ${isActive('/settings') ? 'filled' : ''}`}>person</span>
            <span className="text-[10px] font-medium">Perfil</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
