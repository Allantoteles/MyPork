"use client";

import React, { useState, useEffect, useTransition, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Ejercicio } from '@/types/db';
import { updateWeeklyPlan, deleteRoutine } from './actions';
import { ConfirmModal } from '@/components/ConfirmModal';
import { usePreferences } from '@/hooks/usePreferences';

export default function EditRoutine({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isImperial, toDisplayWeight, toKg, loading: prefsLoading } = usePreferences();
  const [mounted, setMounted] = useState(false);
  
  const [selectedDay, setSelectedDay] = useState('L');
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Estado para borrar
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState<Ejercicio[]>([]);
  
  const [nombrePlan, setNombrePlan] = useState('');
  const [loading, setLoading] = useState(true);

  // Estado del plan semanal (Series Dinámicas)
  const [weeklyExercises, setWeeklyExercises] = useState<Record<string, any[]>>({
    'L': [], 'M': [], 'X': [], 'J': [], 'V': [], 'S': [], 'D': [],
  });

  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || prefsLoading) return;

    const fetchData = async () => {
      const supabase = createClient();
      
      // 1. Cargar biblioteca de ejercicios
      const { data: exercises } = await supabase.from('ejercicios').select('*').order('nombre');
      if (exercises) setEjerciciosDisponibles(exercises);

      // 2. Cargar datos de la rutina
      const { data: rutina } = await supabase.from('rutinas').select('*').eq('id', id).single();
      if (rutina) setNombrePlan(rutina.nombre);

      // 3. Cargar ejercicios vinculados (usando plan_sets)
      const { data: routineExercises } = await supabase
        .from('ejercicios_rutina')
        .select('*, ejercicios(*)')
        .eq('rutina_id', id)
        .order('orden');

      if (routineExercises) {
        const newWeeklyPlan: Record<string, any[]> = { 'L': [], 'M': [], 'X': [], 'J': [], 'V': [], 'S': [], 'D': [] };
        
        routineExercises.forEach(item => {
          const dia = item.dia || 'L';
          const sets = Array.isArray(item.plan_sets) 
            ? item.plan_sets.map((s: any) => ({
                ...s,
                weight: toDisplayWeight(parseFloat(s.weight) || 0)
              }))
            : [{ reps: 10, weight: 0 }];

          newWeeklyPlan[dia].push({
            id: item.ejercicios?.id,
            nombre: item.ejercicios?.nombre,
            grupo_muscular: item.ejercicios?.grupo_muscular,
            icono: item.ejercicios?.icono,
            sets
          });
        });
        setWeeklyExercises(newWeeklyPlan);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, prefsLoading, isImperial]); // Recargar si cambian las unidades

  const currentDayExercises = weeklyExercises[selectedDay] || [];

  const handleAddExercise = (ex: Ejercicio) => {
    const nuevos = [...currentDayExercises, { 
      ...ex, 
      sets: [{ reps: 10, weight: 0 }] 
    }];
    setWeeklyExercises({ ...weeklyExercises, [selectedDay]: nuevos });
    setIsModalOpen(false);
  };

  const handleRemoveExercise = (index: number) => {
    const nuevos = [...currentDayExercises];
    nuevos.splice(index, 1);
    setWeeklyExercises({ ...weeklyExercises, [selectedDay]: nuevos });
  };

  const addSet = (exerciseIndex: number) => {
    const nuevos = [...currentDayExercises];
    nuevos[exerciseIndex].sets.push({ reps: 10, weight: 0 });
    setWeeklyExercises({ ...weeklyExercises, [selectedDay]: nuevos });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const nuevos = [...currentDayExercises];
    nuevos[exerciseIndex].sets.splice(setIndex, 1);
    if (nuevos[exerciseIndex].sets.length === 0) {
      nuevos.splice(exerciseIndex, 1);
    }
    setWeeklyExercises({ ...weeklyExercises, [selectedDay]: nuevos });
  };

  const updateSetValue = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    const nuevos = [...currentDayExercises];
    nuevos[exerciseIndex].sets[setIndex][field] = value;
    setWeeklyExercises({ ...weeklyExercises, [selectedDay]: nuevos });
  };

  const handleUpdate = async () => {
    startTransition(async () => {
      // Envolver para el servidor
      const payload: any = {};
      Object.keys(weeklyExercises).forEach(d => {
        // Mapear ejercicios y convertir pesos a KG para guardar
        const exercisesForDay = weeklyExercises[d].map(ex => ({
          ...ex,
          sets: ex.sets.map((s: any) => ({
            ...s,
            weight: toKg(parseFloat(s.weight) || 0)
          }))
        }));
        payload[d] = { ejercicios: exercisesForDay };
      });

      const result = await updateWeeklyPlan(id, nombrePlan, JSON.stringify(payload));
      if (result.success) {
        router.push('/machines');
      } else {
        alert("Error: " + result.error);
      }
    });
  };

  const handleDelete = async () => {
    await deleteRoutine(id);
  };

  const getIconStyles = (muscle: string | null) => {
    if (muscle === 'Piernas') return 'bg-blue-100 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400';
    if (muscle === 'Pecho') return 'bg-orange-100 dark:bg-primary/20 text-primary';
    if (muscle === 'Hombros') return 'bg-purple-100 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400';
    return 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white';
  };

  if (!mounted || loading) return <div className="min-h-screen bg-background-light dark:bg-background-dark p-10 text-center text-gray-500">Cargando rutina...</div>;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display min-h-screen flex flex-col overflow-hidden pb-20">
      
      <header className="flex items-center justify-between p-4 pb-2 bg-background-light dark:bg-background-dark sticky top-0 z-20">
        <button onClick={() => router.back()} className="size-12 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center truncate">Editar Rutina</h2>
        <button onClick={handleUpdate} disabled={isPending} className="min-w-12 flex justify-end disabled:opacity-50">
          <p className="text-primary text-base font-bold">{isPending ? '...' : 'Guardar'}</p>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="px-4 py-4">
          <label className="block mb-2 text-sm font-medium text-slate-500 dark:text-[#cbad90]">Nombre del Plan</label>
          <input 
            className="w-full h-14 bg-white dark:bg-[#493622] border-none rounded-xl px-4 text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary shadow-sm outline-none transition-all" 
            type="text" 
            value={nombrePlan}
            onChange={(e) => setNombrePlan(e.target.value)}
          />
        </div>

        <div className="px-4 pb-6">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {days.map((d) => {
              const hasExercises = (weeklyExercises[d] || []).length > 0;
              return (
                <button 
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`size-11 rounded-full flex flex-col items-center justify-center font-medium transition-all border relative ${
                    selectedDay === d 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' 
                    : 'bg-white dark:bg-[#493622] text-slate-500 dark:text-[#cbad90] border-slate-100 dark:border-white/5'
                  }`}
                >
                  {d}
                  {hasExercises && selectedDay !== d && (
                    <div className="absolute -top-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-[#493622] mx-4 mb-6"></div>

        <div className="px-4 space-y-6 pb-10">
          {currentDayExercises.map((ex, exIdx) => (
            <div key={exIdx} className="bg-white dark:bg-[#2d241b] rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-white/5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${getIconStyles(ex.grupo_muscular)}`}>
                    <span className="material-symbols-outlined">{ex.icono || 'fitness_center'}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold leading-tight">{ex.nombre}</h4>
                    <p className="text-xs text-slate-500 dark:text-[#cbad90]">{ex.grupo_muscular}</p>
                  </div>
                </div>
                <button onClick={() => handleRemoveExercise(exIdx)} className="text-slate-300 hover:text-red-500 p-2">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>

              {/* LISTA DE SERIES DINÁMICAS */}
              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                  <div className="col-span-2 text-center">SERIE</div>
                  <div className="col-span-4 text-center">REPS</div>
                  <div className="col-span-4 text-center">{isImperial ? 'LBS' : 'KG'}</div>
                  <div className="col-span-2"></div>
                </div>
                {ex.sets.map((set: any, sIdx: number) => (
                  <div key={sIdx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 flex justify-center">
                      <div className="size-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-gray-400">
                        {sIdx + 1}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <input 
                        type="number" 
                        value={set.reps}
                        onChange={(e) => updateSetValue(exIdx, sIdx, 'reps', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#3a3026] border-none rounded-xl text-center font-bold text-sm py-2 outline-none focus:ring-1 focus:ring-primary" 
                      />
                    </div>
                    <div className="col-span-4">
                      <input 
                        type="number" 
                        value={set.weight}
                        onChange={(e) => updateSetValue(exIdx, sIdx, 'weight', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#3a3026] border-none rounded-xl text-center font-bold text-sm py-2 outline-none focus:ring-1 focus:ring-primary" 
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button onClick={() => removeSet(exIdx, sIdx)} className="text-slate-300 hover:text-red-400 p-1">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => addSet(exIdx)}
                className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Añadir Serie
              </button>
            </div>
          ))}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-gray-500 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Añadir Ejercicio al día
          </button>
        </div>

        <div className="px-4 pb-20">
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full py-4 bg-red-500/10 text-red-600 dark:text-red-500 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">delete_forever</span>
            Eliminar Rutina Completa
          </button>
        </div>
      </main>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar Rutina?"
        message="Esta acción borrará todo el plan semanal de forma permanente."
      />

      {/* Modal Selección */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2d241b] w-full max-w-md rounded-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-white/5">
            <div className="p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#231a10]">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Seleccionar Ejercicio</h3>
              <button onClick={() => setIsModalOpen(false)} className="size-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600 dark:text-white">close</span>
              </button>
            </div>
            <div className="overflow-y-auto p-3 flex-1 bg-white dark:bg-[#2d241b]">
              {ejerciciosDisponibles.map(ex => (
                <button key={ex.id} onClick={() => handleAddExercise(ex)} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl flex items-center gap-4 transition-colors mb-1">
                  <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${getIconStyles(ex.grupo_muscular)}`}>
                    <span className="material-symbols-outlined">{ex.icono || 'fitness_center'}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{ex.nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-[#cbad90]">{ex.grupo_muscular}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300">add</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}