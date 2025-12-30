"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SyncManager } from '@/components/SyncManager';
import { DashboardHeader } from '@/components/DashboardHeader';

function StatCard({ icon, color, value, label }: { icon: string, color: string, value: string | number, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl p-3 bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5 transition-colors">
      <span className={`material-symbols-outlined ${color} text-2xl mb-1`}>{icon}</span>
      <p className="text-xl font-bold leading-tight text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-text-secondary font-medium">{label}</p>
    </div>
  );
}

function ActivityChart({ sesiones }: { sesiones: any[] }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-32 flex items-end justify-center text-xs text-gray-500">Cargando gráfica...</div>;

  const daysMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const todayDate = new Date();
  const todayDayIndex = todayDate.getDay(); 
  
  const startOfWeek = new Date(todayDate);
  const diff = todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1; 
  startOfWeek.setDate(todayDate.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const chartData = daysMap.map((dayLabel, index) => {
    const count = sesiones.filter(s => {
      const sessionDate = new Date(s.creado_at);
      return sessionDate.getDay() === index && sessionDate >= startOfWeek;
    }).length;

    const height = count === 0 ? 12 : Math.min(count * 35, 100);
    
    return { 
      day: dayLabel, 
      val: height, 
      count: count,
      active: index === todayDayIndex
    };
  });

  const orderedData = [...chartData.slice(1), chartData[0]];

  return (
    <div className="grid grid-cols-7 gap-3 h-32 items-end justify-items-center">
      {orderedData.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
          <div 
            className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
              item.count > 0 
                ? 'bg-primary shadow-[0_0_15px_rgba(242,127,13,0.4)]' 
                : 'bg-slate-100 dark:bg-white/5'
            }`} 
            style={{ height: `${item.val}%` }}
          />
          <span className={`text-[10px] font-bold ${item.active ? 'text-primary' : 'text-slate-400 dark:text-gray-500'}`}>
            {item.day}
          </span>
        </div>
      ))}
    </div>
  );
}

interface DashboardClientProps {
  user: any;
  perfil: any;
  sesiones: any[];
}

export function DashboardClient({ user, perfil, sesiones }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background-light dark:bg-background-dark" suppressHydrationWarning={true} />;
  }

  const allSesiones = sesiones || [];
  const totalWorkouts = allSesiones.length;
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const sesionesThisWeek = allSesiones.filter(s => new Date(s.creado_at) > oneWeekAgo);
  const workoutsThisWeek = sesionesThisWeek.length;

  const totalMinutes = allSesiones.reduce((acc, curr) => acc + (curr.duracion_minutos || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const peso = perfil.peso_kg || 70;
  const caloriesThisWeek = sesionesThisWeek.reduce((acc, s) => {
    const mins = s.duracion_minutos || 45;
    return acc + (5 * peso * (mins / 60));
  }, 0);

  const lastSession = allSesiones[0];
  const displayName = perfil.nombre_completo?.split(' ')[0] || user.email?.split('@')[0] || 'Atleta';
  const avatarUrl = perfil.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&background=f27f0d&color=fff`;

  return (
    <div 
      className="flex flex-col gap-6 pb-24 bg-background-light dark:bg-background-dark min-h-screen transition-colors duration-200"
      suppressHydrationWarning={true}
    >
      
      <DashboardHeader 
        user={{
          displayName: displayName,
          avatarUrl: avatarUrl,
          email: user.email || ''
        }}
      />

      <section className="px-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-slate-500 dark:text-text-secondary text-sm font-medium">Tu actividad</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalWorkouts} Entrenamientos</h3>
          </div>
          <div className="flex items-center gap-1 bg-green-100 dark:bg-green-500/10 px-2 py-1 rounded-md">
            <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-sm">trending_up</span>
            <p className="text-green-700 dark:text-green-400 text-xs font-bold">+{workoutsThisWeek} esta semana</p>
          </div>
        </div>
        <div className="w-full bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-white/5">
          <ActivityChart sesiones={allSesiones} />
        </div>
      </section>

      <section className="px-4 grid grid-cols-3 gap-3">
        <StatCard icon="fitness_center" color="text-primary" value={totalWorkouts} label="Workouts" />
        <StatCard icon="local_fire_department" color="text-red-500" value={Math.round(caloriesThisWeek)} label="Calorías" />
        <StatCard icon="schedule" color="text-blue-500" value={totalHours} label="Horas" />
      </section>

      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Próxima Rutina</h3>
          <Link href="/machines" className="text-sm font-medium text-primary hover:text-primary/80">Ver todo</Link>
        </div>
        <Link 
          href="/log-session"
          className="block group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-md border border-slate-100 dark:border-white/5 cursor-pointer"
        >
          <div className="flex flex-col">
            <div className="relative h-40">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <img 
                src="https://picsum.photos/seed/gym/600/300" 
                alt="Gym" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
              />
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                  Sugerencia
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between p-4">
              <div className="mb-4">
                <h4 className="text-xl font-bold leading-tight mb-1 text-slate-900 dark:text-white">Entrenamiento Libre</h4>
                <p className="text-sm text-slate-500 dark:text-text-secondary">Registra tu sesión manualmente</p>
              </div>
              <div className="flex items-center justify-between gap-3 mt-auto">
                <div className="text-xs text-slate-500 dark:text-text-secondary font-medium">
                  Última vez: <span className="text-slate-700 dark:text-gray-300">{lastSession ? new Date(lastSession.creado_at).toLocaleDateString() : 'Nunca'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white dark:text-background-dark shadow-lg shadow-primary/20 hover:bg-primary/90 transition-transform active:scale-95">
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  Iniciar
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      <section className="px-4">
        <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/machines" className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left shadow-sm">
            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <span className="material-symbols-outlined">add</span>
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">Crear Rutina</p>
              <p className="text-[10px] text-slate-500 dark:text-text-secondary">Personalizada</p>
            </div>
          </Link>
          <Link href="/explore" className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left shadow-sm">
            <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
              <span className="material-symbols-outlined">explore</span>
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">Explorar</p>
              <p className="text-[10px] text-slate-500 dark:text-text-secondary">Base de datos</p>
            </div>
          </Link>
          <Link href="/history" className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left shadow-sm">
            <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
              <span className="material-symbols-outlined">history</span>
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">Historial</p>
              <p className="text-[10px] text-slate-500 dark:text-text-secondary">Ver progreso</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="px-4 mb-4">
        <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Historial Reciente</h3>
        <div className="flex flex-col gap-2">
          {allSesiones.length > 0 ? (
            allSesiones.slice(0, 3).map((sesion) => (
              <div key={sesion.id} className="flex items-center justify-between p-3 rounded-xl bg-transparent border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-slate-100 dark:bg-white/5 rounded-md flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400 dark:text-gray-400">fitness_center</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{sesion.nombre_rutina || 'Entrenamiento'}</p>
                    <p className="text-xs text-slate-500 dark:text-text-secondary">{sesion.duracion_minutos ? `${sesion.duracion_minutos} min` : 'Sin duración'}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 dark:text-gray-500">{new Date(sesion.creado_at).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
             <div className="text-center p-4 text-slate-500 dark:text-text-secondary text-sm bg-white dark:bg-surface-dark rounded-xl border border-dashed border-slate-200 dark:border-white/10">
               No hay entrenamientos recientes
             </div>
          )}
        </div>
      </section>
      
      <SyncManager />
    </div>
  );
}
