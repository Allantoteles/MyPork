"use client";

import React, { useState, useTransition, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateExercise, deleteExercise } from './actions'
import { ConfirmModal } from '@/components/ConfirmModal';

export default function ExerciseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ex, setEx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('ejercicios').select('*').eq('id', id).single();
      if (data) {
        setEx(data);
        setIsOwner(data.usuario_id === user?.id);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSave = async (formData: FormData) => {
    startTransition(async () => {
      await updateExercise(id, formData);
    });
  };

  const handleDelete = async () => {
    await deleteExercise(id);
  };

  if (loading) return <div className="min-h-screen bg-background-light dark:bg-background-dark p-10 text-center">Cargando...</div>;
  if (!ex) return null;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col pb-24 text-black dark:text-white transition-colors duration-200">
      
      <form action={handleSave} className="flex flex-col flex-1">
        {/* Top App Bar */}
        <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 h-14 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => router.back()}
            className="text-base text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors font-normal"
          >
            Atrás
          </button>
          <h1 className="text-lg font-bold tracking-tight text-black dark:text-white">
            {isOwner ? 'Editar Ejercicio' : 'Detalle'}
          </h1>
          {isOwner ? (
            <button 
              type="submit"
              disabled={isPending}
              className="text-base text-primary font-bold hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              {isPending ? '...' : 'Guardar'}
            </button>
          ) : <div className="w-12" />}
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-6">
          {!isOwner && (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 p-3 rounded-xl text-sm text-center">
              Este es un ejercicio de la biblioteca global. No puedes editarlo.
            </div>
          )}

          <div className="space-y-5">
            <div className="group">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Nombre</label>
              <input 
                name="nombre"
                defaultValue={ex.nombre}
                disabled={!isOwner}
                className="w-full h-14 bg-white dark:bg-white/5 border-none rounded-xl px-4 text-base text-black dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-primary shadow-sm outline-none" 
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Descripción</label>
              <textarea 
                name="descripcion"
                defaultValue={ex.descripcion || ''}
                disabled={!isOwner}
                className="w-full py-4 bg-white dark:bg-white/5 border-none rounded-xl px-4 text-base text-black dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-primary shadow-sm resize-none outline-none" 
                rows={4}
              ></textarea>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 ml-1">Foto de referencia</label>
            <div className="relative w-full h-48 rounded-2xl bg-gray-50 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/5">
              {ex.foto_url ? (
                <img src={ex.foto_url} alt={ex.nombre} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="material-symbols-outlined text-4xl">image_not_supported</span>
                  <span className="text-xs mt-2">Sin foto</span>
                </div>
              )}
            </div>
          </div>
        </main>
      </form>

      {isOwner && (
        <div className="px-4 pb-8">
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full py-4 bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/20 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">delete</span>
            Eliminar Ejercicio
          </button>
        </div>
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar Ejercicio?"
        message="Esta acción borrará este ejercicio de tu biblioteca de forma permanente."
      />
    </div>
  );
}
