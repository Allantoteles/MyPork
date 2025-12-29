import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function History() {
  const supabase = await createClient();

  // 1. Obtener Usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Obtener Sesiones
  const { data: sesiones } = await supabase
    .from('sesiones_entrenamiento')
    .select('*')
    .eq('usuario_id', user.id)
    .order('creado_at', { ascending: false });

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-20 flex items-center bg-background-dark/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/5">
        <h2 className="text-xl font-bold tracking-tight flex-1">Historial</h2>
        <div className="flex items-center justify-end gap-3">
          <button className="size-10 flex items-center justify-center rounded-full bg-surface-dark text-primary hover:bg-primary/10">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
          <button className="size-10 flex items-center justify-center rounded-full bg-surface-dark text-primary hover:bg-primary/10">
            <span className="material-symbols-outlined">calendar_today</span>
          </button>
        </div>
      </header>

      <div className="px-4 py-4 sticky top-[68px] z-10 bg-background-dark">
        <div className="flex h-12 items-center justify-center rounded-xl bg-surface-dark p-1">
          <button className="flex-1 flex items-center justify-center h-full rounded-lg bg-[#4a3b2a] shadow-sm text-primary text-sm font-semibold transition-all">
            Lista
          </button>
          <button className="flex-1 flex items-center justify-center h-full rounded-lg text-sm font-semibold text-gray-500 hover:text-white transition-all">
            Estadísticas
          </button>
        </div>
      </div>

      <main className="flex flex-col gap-6 pb-24">
        {/* Resumen de Sesiones */}
        {sesiones && sesiones.length > 0 ? (
          <section className="flex flex-col gap-4">
             {sesiones.map((sesion) => {
               const fecha = new Date(sesion.creado_at);
               const dia = fecha.getDate();
               const mes = fecha.toLocaleString('es-ES', { month: 'short' }).replace('.', '');

               return (
                 <div key={sesion.id} className="px-4">
                   <Link href={`/history/${sesion.id}`} className="flex flex-col rounded-xl bg-white dark:bg-surface-dark shadow-sm overflow-hidden border border-slate-100 dark:border-white/5 active:scale-[0.99] transition-transform">
                     <div className="flex items-stretch p-4 gap-4">
                       <div className="flex flex-col items-center justify-center rounded-lg bg-background-light dark:bg-background-dark p-2 min-w-[60px]">
                         <span className="text-[10px] font-bold text-gray-500 uppercase">{mes}</span>
                         <span className="text-xl font-bold text-primary">{dia}</span>
                       </div>
                       <div className="flex-1 flex flex-col justify-center">
                         <h4 className="text-base font-bold text-slate-900 dark:text-white">{sesion.nombre_rutina || 'Entrenamiento'}</h4>
                         <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                           <span className="flex items-center gap-1">
                             <span className="material-symbols-outlined text-[16px]">schedule</span> 
                             {sesion.duracion_minutos || '--'} min
                           </span>
                           <span className="flex items-center gap-1">
                             <span className="material-symbols-outlined text-[16px]">fitness_center</span> 
                             Detalles
                           </span>
                         </div>
                       </div>
                       <button className="text-gray-400">
                         <span className="material-symbols-outlined">chevron_right</span>
                       </button>
                     </div>
                   </Link>
                 </div>
               );
             })}
          </section>
        ) : (
          <section className="px-4 py-10 text-center">
            <div className="size-20 bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
              <span className="material-symbols-outlined text-4xl text-gray-600">history</span>
            </div>
            <p className="text-text-secondary font-medium">No hay entrenamientos registrados aún.</p>
            <Link href="/machines?intent=log_session" className="text-primary text-sm font-bold mt-2 inline-block">¡Empieza tu primer entrenamiento!</Link>
          </section>
        )}

        {/* Gráfico de Progreso (Visual) */}
        <section className="px-4">
          <div className="rounded-2xl bg-surface-dark p-5 border border-white/5">
             <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-4">Progreso Mensual</p>
             <div className="h-[100px] flex items-end justify-between gap-1">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group">
                    <div className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all group-hover:bg-primary-hover" style={{ height: `${h}%` }} />
                  </div>
                ))}
             </div>
             <div className="flex justify-between mt-2 text-[8px] text-text-secondary uppercase font-bold">
               <span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}