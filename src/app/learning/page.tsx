import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LearningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
  if (!perfil) redirect('/onboarding');

  // Cálculos
  const alturaM = (perfil.altura_cm || 0) / 100;
  const imc = perfil.peso_kg && alturaM ? (perfil.peso_kg / (alturaM * alturaM)).toFixed(1) : '--';
  
  const hoy = new Date();
  const nacimiento = new Date(perfil.fecha_nacimiento);
  const edad = hoy.getFullYear() - nacimiento.getFullYear();
  const fcMax = 220 - edad;
  const zona2Min = Math.round(fcMax * 0.6);
  const zona2Max = Math.round(fcMax * 0.7);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display pb-20">
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-200 dark:border-white/5">
        <Link href="/" className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-xl font-bold">Aprendizaje</h1>
      </header>

      <main className="p-4 space-y-6">
        {/* SECCIÓN IMC */}
        <section className="bg-white dark:bg-surface-dark p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined">monitor_weight</span>
            </div>
            <h2 className="text-lg font-bold">Tu IMC: {imc}</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-text-secondary leading-relaxed mb-4">
            El <strong>Índice de Masa Corporal (IMC)</strong> es un indicador simple de la relación entre el peso y la talla. Se utiliza para identificar el sobrepeso y la obesidad en los adultos.
          </p>
          <div className="grid grid-cols-4 gap-1 h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5">
            <div className="bg-blue-400" title="Bajo Peso"></div>
            <div className="bg-green-500" title="Normal"></div>
            <div className="bg-orange-500" title="Sobrepeso"></div>
            <div className="bg-red-500" title="Obesidad"></div>
          </div>
        </section>

        {/* SECCIÓN ZONA 2 */}
        <section className="bg-white dark:bg-surface-dark p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <span className="material-symbols-outlined">favorite</span>
            </div>
            <h2 className="text-lg font-bold">Zona Aeróbica (Zona 2)</h2>
          </div>
          <div className="text-center py-4 bg-orange-500/5 rounded-2xl mb-4">
            <span className="text-3xl font-black text-orange-600 dark:text-orange-400">{zona2Min} - {zona2Max}</span>
            <span className="text-xs font-bold text-orange-600/60 block uppercase">Latidos por minuto (PPM)</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-text-secondary leading-relaxed">
            La <strong>Zona 2</strong> es fundamental para construir una base sólida. Entrenar aquí mejora tu capacidad mitocondrial, oxida grasas como combustible principal y permite entrenar por más tiempo sin fatiga extrema.
          </p>
        </section>

        {/* CONCEPTOS FUNDAMENTALES */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold ml-1">Conceptos Clave 🧠</h3>
          
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <h4 className="font-bold text-primary mb-1">Sobrecarga Progresiva</h4>
            <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed">
              Es el aumento gradual de esfuerzo (más peso, más repeticiones o mejor técnica) para forzar al cuerpo a adaptarse y mejorar. ¡Sin esto, no hay progreso real!
            </p>
          </div>

          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
            <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-1">Descanso y Recuperación</h4>
            <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed">
              El músculo no crece en el gimnasio, crece cuando duermes. Asegúrate de descansar 48h el mismo grupo muscular y dormir al menos 7-8h.
            </p>
          </div>
        </section>

        {/* RECURSOS EXTERNOS */}
        <section className="space-y-4 pt-4">
          <h3 className="text-lg font-bold ml-1">Recursos de Apoyo 📚</h3>
          
          <a 
            href="https://musclewiki.com/es-es" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-5 bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">link</span>
                  <h4 className="font-bold text-slate-900 dark:text-white">MuscleWiki</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed">
                  Excelente fuente para buscar la <strong>ejecución correcta</strong> de ejercicios y descubrir nuevos movimientos filtrados por <strong>grupos musculares</strong>.
                </p>
              </div>
              <div className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">open_in_new</span>
              </div>
            </div>
          </a>
        </section>
      </main>
    </div>
  );
}
