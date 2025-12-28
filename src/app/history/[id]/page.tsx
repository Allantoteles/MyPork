"use client";

import React, { useState, useEffect, useTransition, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { updateSessionData, deleteSession } from './actions';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nombreSesion, setNombreSesion] = useState('');
  const [ejercicios, setEjercicios] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      const { data: session } = await supabase.from('sesiones_entrenamiento').select('*').eq('id', id).single();
      if (session) setNombreSesion(session.nombre_rutina || '');

      const { data: details } = await supabase
        .from('detalles_sesion')
        .select('*')
        .eq('sesion_id', id)
        .order('creado_at', { ascending: true });
      
      if (details) {
        const grouped: any = {};
        details.forEach(d => {
          const key = d.nombre_ejercicio || 'Desconocido';
          if (!grouped[key]) grouped[key] = { nombre: key, id: d.ejercicio_id, sets: [] };
          grouped[key].sets.push({ 
            id: d.id, 
            reps: d.reps, 
            weight: d.peso_kg,
            meta_reps: d.meta_reps, // <--- FALTABA ESTO
            meta_peso_kg: d.meta_peso_kg, // <--- Y ESTO
            ejercicio_id: d.ejercicio_id,
            nombre_ejercicio: d.nombre_ejercicio
          });
        });
        setEjercicios(Object.values(grouped));
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const updateSetValue = (exIdx: number, sIdx: number, field: string, value: string) => {
    const newExs = [...ejercicios];
    newExs[exIdx].sets[sIdx][field] = value;
    setEjercicios(newExs);
  };

  const handleUpdate = async () => {
    const allSets = ejercicios.flatMap(ex => ex.sets);
    startTransition(async () => {
      const result = await updateSessionData(id, nombreSesion, JSON.stringify(allSets));
      if (result.success) {
        router.push('/history');
      } else {
        alert("Error: " + result.error);
      }
    });
  };

  const handleDelete = async () => {
    await deleteSession(id);
  };

  if (loading) return <div className="min-h-screen bg-background-light dark:bg-background-dark p-10 text-center">Cargando...</div>;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display min-h-screen flex flex-col overflow-hidden pb-20">
      
      <header className="flex items-center justify-between p-4 pb-2 bg-background-light dark:bg-background-dark sticky top-0 z-20 border-b border-slate-100 dark:border-white/5">
        <button onClick={() => router.back()} className="size-12 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center truncate">Editar Registro</h2>
        <button onClick={handleUpdate} disabled={isPending} className="min-w-12 flex justify-end disabled:opacity-50">
          <p className="text-primary text-base font-bold">{isPending ? '...' : 'Guardar'}</p>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-8">
        
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre del entrenamiento</label>
          <input 
            value={nombreSesion}
            onChange={(e) => setNombreSesion(e.target.value)}
            className="w-full h-12 bg-white dark:bg-surface-dark border-none rounded-xl px-4 text-base font-bold mt-1 shadow-sm outline-none"
          />
        </div>

        {ejercicios.map((ex, exIdx) => (
          <section key={exIdx} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">fitness_center</span>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">{ex.nombre}</h3>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-10 gap-2 text-[10px] font-bold text-slate-400 uppercase px-2">
                <div className="col-span-2 text-center">SERIE</div>
                <div className="col-span-4 text-center">REPS</div>
                <div className="col-span-4 text-center">KG</div>
              </div>

              {ex.sets.map((set: any, sIdx: number) => {
                // Lógica de comparación robusta
                const hasMeta = set.meta_reps !== null && set.meta_reps !== undefined && set.meta_peso_kg !== null && set.meta_peso_kg !== undefined;
                
                const actualWeight = parseFloat(set.weight) || 0;
                const actualReps = parseInt(set.reps) || 0;
                const goalWeight = parseFloat(set.meta_peso_kg) || 0;
                const goalReps = parseInt(set.meta_reps) || 0;

                const completed = hasMeta && (actualWeight >= goalWeight) && (actualReps >= goalReps);
                
                let borderColor = 'border-slate-100 dark:border-white/5';
                let bgColor = 'bg-white dark:bg-[#2d241b]';
                
                if (hasMeta) {
                  borderColor = completed ? 'border-green-500/50' : 'border-red-500/50';
                  bgColor = completed ? 'bg-green-500/5 dark:bg-green-500/10' : 'bg-red-500/5 dark:bg-red-500/10';
                }

                return (
                  <div key={sIdx} className={`grid grid-cols-10 gap-2 items-center p-2 rounded-2xl border shadow-sm transition-colors ${borderColor} ${bgColor}`}>
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${hasMeta ? (completed ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                        {sIdx + 1}
                      </div>
                      {hasMeta && <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Objetivo</span>}
                    </div>
                    <div className="col-span-4 text-center">
                      <input 
                        type="number" 
                        value={set.reps} 
                        onChange={(e) => updateSetValue(exIdx, sIdx, 'reps', e.target.value)}
                        className="w-full bg-slate-50/50 dark:bg-black/20 border-none rounded-xl text-center font-bold h-10 outline-none" 
                      />
                      {hasMeta && <p className="text-[10px] text-slate-400 mt-1">{set.meta_reps} reps</p>}
                    </div>
                    <div className="col-span-4 text-center">
                      <input 
                        type="number" 
                        value={set.weight} 
                        onChange={(e) => updateSetValue(exIdx, sIdx, 'weight', e.target.value)}
                        className="w-full bg-slate-50/50 dark:bg-black/20 border-none rounded-xl text-center font-bold h-10 outline-none" 
                      />
                      {hasMeta && <p className="text-[10px] text-slate-400 mt-1">{set.meta_peso_kg} kg</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="pt-10 pb-20">
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full py-4 bg-red-500/10 text-red-600 dark:text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined">delete_forever</span>
            Eliminar Registro por completo
          </button>
        </div>
      </main>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="¿Borrar Registro?"
        message="Esta acción eliminará permanentemente esta sesión de entrenamiento de tu historial."
      />
    </div>
  );
}