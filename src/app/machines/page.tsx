"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Ejercicio, Rutina } from '@/types/db';

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const intent = searchParams.get('intent');
  const isSelectionMode = intent === 'log_session';

  // En ambos modos permitimos cambiar entre Rutinas y Ejercicios
  const [activeTab, setActiveTab] = useState<'ejercicios' | 'rutinas'>(isSelectionMode ? 'rutinas' : 'rutinas');
  
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Todas', 'Pecho', 'Piernas', 'Espalda', 'Brazos', 'Hombros', 'Cardio'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      
      const { data: exData } = await supabase.from('ejercicios').select('*').order('nombre');
      if (exData) setEjercicios(exData);

      const { data: rutData } = await supabase.from('rutinas').select('*').order('creado_at', { ascending: false });
      if (rutData) setRutinas(rutData);

      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredEjercicios = ejercicios.filter(e => {
    const matchesFilter = activeFilter === 'Todas' || e.grupo_muscular === activeFilter;
    const matchesSearch = e.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredRutinas = rutinas.filter(r => 
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExerciseClick = (ex: Ejercicio) => {
    if (isSelectionMode) {
      // Registrar un solo ejercicio
      router.push(`/log-session?exercise=${ex.id}`);
    } else {
      // Ver/Editar
      router.push(`/machines/${ex.id}`);
    }
  };

  const handleRoutineClick = (rutina: Rutina) => {
    if (isSelectionMode) {
      // Registrar una rutina completa (esta vista la crearemos a continuación)
      router.push(`/log-session?routine=${rutina.id}`);
    } else {
      // Ver/Editar
      router.push(`/machines/routines/${rutina.id}`);
    }
  };

  const handleAddClick = () => {
    if (activeTab === 'ejercicios') router.push('/machines/new');
    else router.push('/create-routine');
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background-light dark:bg-background-dark text-black dark:text-white transition-colors duration-200">
      
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 pt-4 pb-2 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
        <button onClick={() => router.back()} className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">
          {isSelectionMode ? 'Registrar Entrenamiento' : 'Biblioteca'}
        </h1>
        {!isSelectionMode ? (
          <button onClick={handleAddClick} className="px-2 text-primary font-bold">Añadir</button>
        ) : <div className="w-10" />}
      </header>

      <div className="px-4 py-3 sticky top-[60px] z-20 bg-background-light dark:bg-background-dark">
        <div className="group relative flex w-full items-center rounded-xl bg-white dark:bg-surface-dark shadow-sm ring-1 ring-gray-200 dark:ring-white/10 focus-within:ring-2 focus-within:ring-primary transition-all">
          <div className="absolute left-4 flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input 
            className="h-12 w-full border-none bg-transparent pl-12 pr-4 text-base text-black dark:text-white placeholder:text-gray-400 focus:ring-0 outline-none" 
            placeholder={activeTab === 'rutinas' ? "Buscar rutina..." : "Buscar ejercicio..."} 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Toggle de Pestañas - Siempre visible ahora */}
      <div className="px-4 pb-4">
        <div className="bg-gray-200 dark:bg-white/5 p-1 rounded-xl flex gap-1">
          <button 
            onClick={() => setActiveTab('rutinas')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'rutinas' ? 'bg-white dark:bg-surface-dark text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
          >
            Rutinas
          </button>
          <button 
            onClick={() => setActiveTab('ejercicios')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ejercicios' ? 'bg-white dark:bg-surface-dark text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
          >
            Ejercicios
          </button>
        </div>
      </div>

      {activeTab === 'ejercicios' && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveFilter(cat)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border ${activeFilter === cat ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-surface-dark text-gray-500 border-gray-200 dark:border-white/10'}`}>{cat}</button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 px-4 py-2">
        {loading ? (
          <div className="text-center text-gray-500 py-10">Cargando...</div>
        ) : (
          <>
            {activeTab === 'rutinas' && (
              filteredRutinas.map((rutina) => (
                <div key={rutina.id} onClick={() => handleRoutineClick(rutina)} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-white/5 cursor-pointer active:scale-[0.99] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">{isSelectionMode ? 'play_circle' : 'list_alt'}</span>
                    </div>
                    <div>
                      <h3 className="font-bold">{rutina.nombre}</h3>
                      <p className="text-xs text-gray-500 uppercase font-bold">{rutina.dia_asignado || 'Plan'}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </div>
              ))
            )}

            {activeTab === 'ejercicios' && (
              filteredEjercicios.map((ex) => (
                <div key={ex.id} onClick={() => handleExerciseClick(ex)} className="flex items-center gap-4 rounded-2xl bg-white dark:bg-surface-dark p-3 shadow-sm border border-gray-100 dark:border-white/5 cursor-pointer active:scale-[0.99] transition-all">
                  <div className="size-14 rounded-xl bg-gray-100 dark:bg-white/5 text-primary flex items-center justify-center overflow-hidden">
                    {ex.foto_url ? <img src={ex.foto_url} className="w-full h-full object-cover" alt="" /> : <span className="material-symbols-outlined text-[28px]">{ex.icono}</span>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{ex.nombre}</h3>
                    <p className="text-sm text-gray-500">{ex.grupo_muscular}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Machines() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background-light dark:bg-background-dark"></div>}>
      <LibraryContent />
    </Suspense>
  );
}
