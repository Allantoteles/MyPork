'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { usePreferences } from '@/hooks/usePreferences';
import { useRestTimer } from '@/hooks/useRestTimer';
import { RestTimerComponent } from '@/components/RestTimerComponent';
import { db, SesionLocal } from '@/lib/db';

interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: string;
  nombre: string;
  grupo_muscular: string | null;
  icono: string;
  sets: WorkoutSet[];
}

export default function TrainRoutine({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isImperial, toDisplayWeight } = usePreferences();
  const unitLabel = isImperial ? 'lbs' : 'kg';

  const [rutina, setRutina] = useState<any>(null);
  const [ejercicios, setEjercicios] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [sesionLocalId, setSesionLocalId] = useState<number>();
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalRestTime, setTotalRestTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [activeRestTarget, setActiveRestTarget] = useState<{ exerciseIdx: number; setIdx: number } | null>(null);
  const timer = useRestTimer(90, sesionLocalId);

  useEffect(() => {
    const fetchRoutine = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data: rutinaData } = await supabase
          .from('rutinas')
          .select('*')
          .eq('id', id)
          .single();
        if (rutinaData) setRutina(rutinaData);

        const { data: ejerciciosData } = await supabase
          .from('ejercicios_rutina')
          .select('*, ejercicios(*)')
          .eq('rutina_id', id)
          .order('orden');

        if (ejerciciosData) {
          const mapped: WorkoutExercise[] = ejerciciosData.map((item: any) => ({
            id: item.ejercicios?.id ?? item.id,
            nombre: item.ejercicios?.nombre ?? item.nombre ?? 'Ejercicio',
            grupo_muscular: item.ejercicios?.grupo_muscular ?? null,
            icono: item.ejercicios?.icono ?? 'fitness_center',
            sets:
              Array.isArray(item.plan_sets) && item.plan_sets.length > 0
                ? item.plan_sets.map((s: any) => ({
                    reps: s.reps ?? s.repeticiones ?? 10,
                    weight: s.weight ?? s.peso ?? 0,
                    completed: false,
                  }))
                : [
                    {
                      reps: item.reps ?? 10,
                      weight: item.peso ?? 0,
                      completed: false,
                    },
                  ],
          }));
          setEjercicios(mapped);
        }
      } catch (error) {
        console.error('Error cargando rutina', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutine();
  }, [id]);

  const startSession = async () => {
    try {
      const now = new Date();
      setStartTime(now);
      setIsSessionActive(true);

      const sesion: SesionLocal = {
        usuario_id: 'local',
        nombre_rutina: rutina?.nombre || 'Entrenamiento',
        duracion_minutos: 0,
        creado_at: now,
        sincronizado: 0,
      };

      const sesionId = await db.sesionesPendientes.add(sesion);
      setSesionLocalId(sesionId);
    } catch (error) {
      console.error('Error iniciando sesión:', error);
    }
  };

  const finishSession = async () => {
    try {
      if (!startTime || !sesionLocalId) return;

      const endTime = new Date();
      const duracionMinutos = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      await db.sesionesPendientes.update(sesionLocalId, {
        duracion_minutos: duracionMinutos,
      });

      setIsSessionActive(false);
      alert(`Entrenamiento completado en ${duracionMinutos} minutos`);
      router.push('/machines');
    } catch (error) {
      console.error('Error finalizando sesión:', error);
    }
  };

  const toggleSetCompletion = (exerciseIdx: number, setIdx: number) => {
    const newEjercicios = [...ejercicios];
    newEjercicios[exerciseIdx].sets[setIdx].completed = !newEjercicios[exerciseIdx].sets[setIdx].completed;
    setEjercicios(newEjercicios);
    setShowTimer(false);
    setActiveRestTarget(null);
  };

  const getIconStyles = (muscle: string | null) => {
    if (muscle === 'Piernas') return 'bg-blue-900/30 text-blue-400';
    if (muscle === 'Pecho') return 'bg-primary/30 text-primary';
    if (muscle === 'Hombros') return 'bg-purple-900/30 text-purple-400';
    return 'bg-white/5 text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark p-4 flex items-center justify-center">
        <p className="text-text-secondary">Cargando rutina...</p>
      </div>
    );
  }

  if (ejercicios.length === 0) {
    return (
      <div className="min-h-screen bg-background-dark p-4 flex flex-col items-center justify-center text-center text-white gap-4">
        <p className="text-text-secondary">No encontramos ejercicios en esta rutina.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-surface-dark border border-white/10 text-white"
        >
          Volver
        </button>
      </div>
    );
  }

  const currentExercise = ejercicios[activeExerciseIdx];
  const completedSets = currentExercise?.sets.filter((s) => s.completed).length || 0;
  const totalSets = currentExercise?.sets.length || 0;

  return (
    <div className="bg-background-dark text-white min-h-screen flex flex-col pb-20">
      <header className="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-sm border-b border-white/5 p-4 flex items-center justify-between">
        <Link href="/machines" className="size-10 flex items-center justify-center rounded-full hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold">{rutina?.nombre}</h1>
        <div className="w-10" />
      </header>

      {!isSessionActive ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-primary">play_arrow</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Iniciar Entrenamiento</h2>
            <p className="text-text-secondary mb-6 max-w-xs">
              {ejercicios.length} ejercicio{ejercicios.length !== 1 ? 's' : ''} -
              {' '}
              {ejercicios.reduce((sum, ex) => sum + ex.sets.length, 0)} series totales
            </p>
            <button
              onClick={startSession}
              className="w-full py-4 bg-primary text-background-dark font-bold rounded-2xl active:scale-95 transition-all mb-3"
            >
              Comenzar
            </button>
            <button
              onClick={() => router.back()}
              className="w-full py-3 bg-surface-dark text-text-secondary font-bold rounded-2xl border border-white/10 active:scale-95 transition-all"
            >
              Volver
            </button>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {currentExercise && (
            <>
              <div className="bg-surface-dark rounded-2xl p-4 border border-white/5">
                <p className="text-xs text-text-secondary mb-2">
                  Ejercicio {activeExerciseIdx + 1} de {ejercicios.length}
                </p>
                <div className="flex items-center gap-3">
                  <div className={`size-14 rounded-xl flex items-center justify-center ${getIconStyles(currentExercise.grupo_muscular)}`}>
                    <span className="material-symbols-outlined">{currentExercise.icono}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{currentExercise.nombre}</h2>
                    <p className="text-sm text-text-secondary">{currentExercise.grupo_muscular}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                <p className="text-xs text-text-secondary mb-2">Progreso</p>
                <div className="flex items-end gap-3">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {completedSets}/{totalSets}
                    </p>
                    <p className="text-xs text-text-secondary">Series completadas</p>
                  </div>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider px-2">Series</p>
                {currentExercise.sets.map((set, setIdx) => (
                  <div key={setIdx} className="space-y-2">
                    <button
                      onClick={() => toggleSetCompletion(activeExerciseIdx, setIdx)}
                      className={`w-full p-3 rounded-xl border-2 transition-all ${
                        set.completed
                          ? 'bg-green-500/10 border-green-500 text-green-400'
                          : 'bg-surface-dark border-white/10 text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="font-bold">Serie {setIdx + 1}</p>
                          <p className="text-sm text-text-secondary">
                            {set.reps} reps × {toDisplayWeight(set.weight)} {unitLabel}
                          </p>
                        </div>
                        <span className="material-symbols-outlined">
                          {set.completed ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </div>
                    </button>

                    {set.completed && (
                      <div className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-text-secondary text-sm">
                            <span className="material-symbols-outlined text-base">timer</span>
                            Descanso para serie {setIdx + 1}
                          </div>
                          <button
                            onClick={() => {
                              setActiveRestTarget({ exerciseIdx: activeExerciseIdx, setIdx });
                              setShowTimer(true);
                              timer.reset();
                            }}
                            className="px-3 py-1 bg-primary text-background-dark text-sm font-bold rounded-lg active:scale-95 transition-all"
                          >
                            Iniciar descanso
                          </button>
                        </div>

                        {showTimer &&
                          activeRestTarget?.exerciseIdx === activeExerciseIdx &&
                          activeRestTarget?.setIdx === setIdx && (
                            <RestTimerComponent
                              secondsLeft={timer.secondsLeft}
                              totalSeconds={timer.totalSeconds}
                              isRunning={timer.isRunning}
                              progress={timer.progress}
                              onStart={timer.start}
                              onPause={timer.pause}
                              onReset={timer.reset}
                              onFinish={() => {
                                timer.finishAndSave();
                                setTotalRestTime((prev) => prev + timer.totalSeconds);
                                setShowTimer(false);
                                setActiveRestTarget(null);
                              }}
                            />
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {completedSets === totalSets && (
                <button
                  onClick={() => {
                    if (activeExerciseIdx < ejercicios.length - 1) {
                      setActiveExerciseIdx((prev) => prev + 1);
                      setShowTimer(false);
                      setActiveRestTarget(null);
                      timer.reset();
                    }
                  }}
                  className="w-full py-3 bg-surface-dark text-white font-bold rounded-xl border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                  {activeExerciseIdx < ejercicios.length - 1 ? 'Siguiente Ejercicio' : 'Finalizar'}
                </button>
              )}
            </>
          )}

          {activeExerciseIdx === ejercicios.length - 1 && completedSets === totalSets && (
            <button
              onClick={finishSession}
              className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Finalizar Entrenamiento
            </button>
          )}
        </main>
      )}
    </div>
  );
}
