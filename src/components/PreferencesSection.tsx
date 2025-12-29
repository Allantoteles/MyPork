"use client"

import React, { useTransition, useState } from 'react'
import { updateProfilePreference } from '@/app/settings/actions'
import { usePreferences } from '@/hooks/usePreferences'

interface PreferencesProps {
  initialUnits: string
  initialRest: number
}

export function PreferencesSection({ initialUnits, initialRest }: PreferencesProps) {
  const [isPending, startTransition] = useTransition()
  
  // Consumir contexto global
  const { units, restSeconds, updatePreferences } = usePreferences()

  // Estado para saber qué menú está abierto
  const [openSection, setOpenSection] = useState<'units' | 'rest' | null>(null)

  const toggleSection = (section: 'units' | 'rest') => {
    setOpenSection(openSection === section ? null : section)
  }

  // Guardar Unidades
  const selectUnit = (val: string) => {
    // 1. Actualización optimista global
    updatePreferences(val, restSeconds)
    
    // 2. Persistencia en servidor
    startTransition(async () => {
      const formData = new FormData()
      formData.append('unidades', val)
      await updateProfilePreference(formData)
    })
    setOpenSection(null) // Cerrar al seleccionar
  }

  // Guardar Descanso
  const selectRest = (val: number) => {
    // 1. Actualización optimista global
    updatePreferences(units, val)

    // 2. Persistencia en servidor
    startTransition(async () => {
      const formData = new FormData()
      formData.append('descanso', val.toString())
      await updateProfilePreference(formData)
    })
    // No cerramos automáticamente aquí para permitir ajuste fino si se desea
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide px-2">Preferencias</h3>
      <div className="bg-surface-dark rounded-2xl overflow-hidden border border-white/5">
        
        {/* ================= SECCIÓN UNIDADES ================= */}
        <div className="flex flex-col border-b border-white/5 last:border-0">
          {/* Cabecera (Clickable) */}
          <button 
            onClick={() => toggleSection('units')}
            className={`flex items-center justify-between p-4 w-full transition-colors ${openSection === 'units' ? 'bg-white/5' : 'active:bg-white/5'}`}
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">straighten</span>
              </div>
              <span className="font-medium">Unidades</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <span className={openSection === 'units' ? 'text-primary font-bold' : ''}>{units}</span>
              <span className={`material-symbols-outlined text-gray-600 transition-transform duration-300 ${openSection === 'units' ? 'rotate-90' : ''}`}>
                chevron_right
              </span>
            </div>
          </button>

          {/* Menú Desplegable (Animado) */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'units' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-black/20 pb-2">
              {['Métrico (kg)', 'Imperial (lbs)'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => selectUnit(opt)}
                  className="w-full flex items-center justify-between px-4 py-3 pl-[68px] hover:bg-white/5 transition-colors"
                >
                  <span className={`text-sm ${units === opt ? 'text-white font-medium' : 'text-text-secondary'}`}>{opt}</span>
                  {units === opt && <span className="material-symbols-outlined text-primary text-sm">check</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= SECCIÓN DESCANSO ================= */}
        <div className="flex flex-col">
          {/* Cabecera (Clickable) */}
          <button 
            onClick={() => toggleSection('rest')}
            className={`flex items-center justify-between p-4 w-full transition-colors ${openSection === 'rest' ? 'bg-white/5' : 'active:bg-white/5'}`}
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">timer</span>
              </div>
              <span className="font-medium">Descanso Predeterminado</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <span className={openSection === 'rest' ? 'text-primary font-bold' : ''}>{restSeconds}s</span>
              <span className={`material-symbols-outlined text-gray-600 transition-transform duration-300 ${openSection === 'rest' ? 'rotate-90' : ''}`}>
                chevron_right
              </span>
            </div>
          </button>

          {/* Menú Desplegable */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'rest' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-black/20 p-4 pl-[68px] flex flex-col gap-3">
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Selecciona tiempo</p>
              
              {/* Pills de selección rápida */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {[30, 60, 90, 120, 180].map((time) => (
                  <button
                    key={time}
                    onClick={() => selectRest(time)}
                    className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                      restSeconds === time 
                        ? 'bg-primary text-background-dark border-primary' 
                        : 'bg-surface-dark border-white/10 text-text-secondary hover:border-white/30'
                    }`}
                  >
                    {time}s
                  </button>
                ))}
              </div>

              {/* Input Manual Estilizado */}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-text-secondary">Manual:</span>
                <div className="relative w-20">
                    <input 
                        type="number" 
                        value={restSeconds}
                        onChange={(e) => selectRest(parseInt(e.target.value) || 0)}
                        className="w-full bg-surface-dark border border-white/10 rounded-lg px-2 py-1 text-sm text-center text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-text-secondary pointer-events-none">s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}