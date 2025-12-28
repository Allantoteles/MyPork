"use client";

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { logWorkoutSession } from './actions';
import { Ejercicio } from '@/types/db';
import { IOSDatePicker } from '@/components/IOSDatePicker';

function LogSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exerciseId = searchParams.get('exercise');
  const routineId = searchParams.get('routine');
  
  const daysMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const [activePlanDay, setActiveDay] = useState(daysMap[new Date().getDay()]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [exercises, setExercises] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [routineName, setRoutineName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      setLoading(true);

      let loadedExercises: any[] = [];

      // 1. Obtener los ejercicios (de rutina o individual)
      if (exerciseId) {
        const { data } = await supabase.from('ejercicios').select('*').eq('id', exerciseId).single();
        if (data) {
          loadedExercises = [{
            ...data,
            sets: [{ reps: '', weight: '', completed: false }]
          }];
        }
      } else if (routineId) {
        const { data: rut } = await supabase.from('rutinas').select('nombre').eq('id', routineId).single();
        if (rut) setRoutineName(rut.nombre);

        const { data: routineEx } = await supabase
          .from('ejercicios_rutina')
          .select('*, ejercicios(*)')
          .eq('rutina_id', routineId)
          .eq('dia', activePlanDay)
          .order('orden');
        
        if (routineEx) {
          loadedExercises = routineEx.map(item => ({
            ...item.ejercicios,
            sets: Array.isArray(item.plan_sets) 
              ? item.plan_sets.map((s:any) => ({
                  reps: '', 
                  weight: '', 
                  completed: false,
                  meta_reps: s.reps,
                  meta_weight: s.weight
                })) 
              : [{ reps: '', weight: '', completed: false }]
          }));
        }
      }

      // 2. BUSCAR HISTORIAL PARA CADA EJERCICIO (Sobrecarga Progresiva)
      const exercisesWithHistory = await Promise.all(loadedExercises.map(async (ex) => {
        // Buscamos la sesión más reciente de este ejercicio
        const { data: lastSets } = await supabase
          .from('detalles_sesion')
          .select('reps, peso_kg, creado_at')
          .eq('ejercicio_id', ex.id)
          .order('creado_at', { ascending: false })
          .limit(10); // Traemos los últimos sets

        // Agrupamos por la fecha más reciente encontrada
        if (lastSets && lastSets.length > 0) {
          const lastDate = lastSets[0].creado_at;
          const lastSessionSets = lastSets.filter(s => s.creado_at === lastDate);
          return { ...ex, lastHistory: lastSessionSets };
        }
        return ex;
      }));

      setExercises(exercisesWithHistory);
      setLoading(false);
    };
    fetchData();
  }, [exerciseId, routineId, activePlanDay]);

  const addSet = (exIdx: number) => {
    const newExs = [...exercises];
    newExs[exIdx].sets.push({ reps: '', weight: '', completed: false });
    setExercises(newExs);
  };

  const updateSet = (exIdx: number, sIdx: number, field: string, value: string) => {
    const newExs = [...exercises];
    newExs[exIdx].sets[sIdx][field] = value;
    setExercises(newExs);
  };

  const toggleSet = (exIdx: number, sIdx: number) => {
    const newExs = [...exercises];
    newExs[exIdx].sets[sIdx].completed = !newExs[exIdx].sets[sIdx].completed;
    setExercises(newExs);
  };

  const handleFinish = () => {
    const formData = new FormData();
    const name = routineId ? routineName : (exercises[0]?.nombre || 'Entrenamiento');
    formData.append('nombre', name);
    formData.append('duracion', '45');
    formData.append('fecha', sessionDate);
    
    const setsWithMetas = exercises.flatMap(ex => 
      ex.sets.map((s: any) => ({
        ...s, 
        nombre_ejercicio: ex.nombre,
        ejercicio_id: ex.id,
        meta_reps: s.meta_reps,
        meta_weight: s.meta_weight
      }))
    );
    
    formData.append('sets', JSON.stringify(setsWithMetas));

    startTransition(async () => {
      await logWorkoutSession(null, formData);
    });
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background-light dark:bg-background-dark font-display transition-colors duration-200">
      
      <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 p-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-lg font-bold leading-tight truncate max-w-[200px]">{routineId ? routineName : 'Ejercicio'}</h2>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            {routineId ? `Entrenando: ${activePlanDay}` : 'Sesión Libre'}
          </span>
        </div>
        <div className="w-10" />
      </header>

      <main className="p-4 flex flex-col gap-6 max-w-lg mx-auto w-full">
        
        <IOSDatePicker 
          label="Fecha del entrenamiento"
          initialDate={sessionDate}
          onChange={setSessionDate}
        />

        {routineId && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Seleccionar plan de día</p>
            <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                <button 
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={`size-11 rounded-full flex items-center justify-center font-bold transition-all border ${
                    activePlanDay === d 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' 
                    : 'bg-white dark:bg-[#2d241b] text-slate-400 border-slate-100 dark:border-white/5'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-px bg-slate-200 dark:bg-white/5" />

        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando ejercicios e historial...</div>
        ) : exercises.length > 0 ? (
          exercises.map((ex, exIdx) => (
            <section key={exIdx} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">{ex.icono || 'fitness_center'}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{ex.nombre}</h3>
              </div>

              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest px-2">
                  <div className="col-span-1 text-center">Set</div>
                  <div className="col-span-4 text-center">Kg</div>
                  <div className="col-span-4 text-center">Reps</div>
                  <div className="col-span-3" />
                </div>

                {ex.sets.map((set: any, sIdx: number) => {
                  // Obtener el registro anterior para este set específico (si existe)
                  const prevSet = ex.lastHistory?.[sIdx];

                  return (
                    <div key={sIdx} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl transition-all border ${set.completed ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/20' : 'bg-white dark:bg-[#2d241b] border-gray-200 dark:border-white/5'}`}>
                      <div className="col-span-1 flex justify-center">
                        <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${set.completed ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>{sIdx + 1}</div>
                      </div>
                      
                      <div className="col-span-4">
                        <input type="number" placeholder="0" value={set.weight} onChange={(e) => updateSet(exIdx, sIdx, 'weight', e.target.value)} className="w-full bg-slate-50 dark:bg-[#3a3026] border-none rounded-xl text-center font-bold text-slate-900 dark:text-white h-10 outline-none" />
                        {prevSet && (
                          <p className="text-[10px] text-center text-slate-400 mt-1">Anterior: {prevSet.peso_kg}kg</p>
                        )}
                      </div>

                      <div className="col-span-4">
                        <input type="number" placeholder="0" value={set.reps} onChange={(e) => updateSet(exIdx, sIdx, 'reps', e.target.value)} className="w-full bg-slate-50 dark:bg-[#3a3026] border-none rounded-xl text-center font-bold text-slate-900 dark:text-white h-10 outline-none" />
                        {prevSet && (
                          <p className="text-[10px] text-center text-slate-400 mt-1">Anterior: {prevSet.reps}</p>
                        )}
                      </div>

                      <div className="col-span-3 flex justify-center">
                        <button onClick={() => toggleSet(exIdx, sIdx)} className={`size-10 rounded-lg flex items-center justify-center transition-colors ${set.completed ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-300 dark:text-gray-400'}`}>
                          <span className="material-symbols-outlined text-[20px]">check</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => addSet(exIdx)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 text-xs font-bold mt-1">Añadir Serie</button>
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-20 px-6">
            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-white/10 mb-4">event_busy</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Día de descanso</h3>
            <p className="text-slate-500 dark:text-text-secondary text-sm">No tienes ejercicios configurados para el día {activePlanDay}.</p>
          </div>
        )}

        {exercises.length > 0 && (
          <button onClick={handleFinish} disabled={isPending} className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-lg py-5 rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70">
            {isPending ? 'Guardando...' : (<><span>Finalizar Sesión</span><span className="material-symbols-outlined">verified</span></>)}
          </button>
        )}
      </main>
    </div>
  );
}

export default function LogSession() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background-light dark:bg-background-dark"></div>}>
      <LogSessionContent />
    </Suspense>
  );
}