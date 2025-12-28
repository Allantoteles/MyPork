"use client"

import React, { useTransition, useState, useEffect } from 'react'
import { updateProfilePreference } from '@/app/settings/actions'

interface WeightEditorProps {
  initialWeight: number | null
}

export function WeightEditor({ initialWeight }: WeightEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [weight, setWeight] = useState(initialWeight || '')
  const [isOpen, setIsOpen] = useState(false)
  
  // Estado temporal para el valor mientras se edita en el modal
  const [tempWeight, setTempWeight] = useState(initialWeight || '')

  const openModal = () => {
    setTempWeight(weight)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const handleSave = () => {
    const val = parseFloat(tempWeight.toString())
    if (!isNaN(val)) {
      setWeight(val)
      startTransition(async () => {
        const formData = new FormData()
        formData.append('peso', val.toString())
        await updateProfilePreference(formData)
      })
    }
    closeModal()
  }

  return (
    <>
      {/* --- TARJETA VISUAL (TRIGGER) --- */}
      <button 
        onClick={openModal}
        className="relative flex flex-col items-center p-2 bg-background-dark/50 active:bg-white/10 rounded-xl flex-1 transition-all duration-200 group"
      >
        <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Peso</span>
        
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-bold text-primary group-hover:scale-105 transition-transform">
            {weight || '--'}
          </span>
          <span className="text-sm font-bold text-primary/60">kg</span>
        </div>
      </button>

      {/* --- BOTTOM SHEET MODAL (Estilo iOS) --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop (Click para cerrar) */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={closeModal}
          />

          {/* Panel Deslizante */}
          <div className="relative w-full bg-[#1c1c1e] dark:bg-[#1c1c1e] bg-slate-50 rounded-t-[20px] shadow-2xl overflow-hidden pb-8 animate-slide-up">
            
            {/* Header del Panel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5 backdrop-blur-md">
              <button 
                onClick={closeModal}
                className="text-primary text-base font-normal hover:opacity-80 transition-opacity"
              >
                Cancelar
              </button>
              <span className="font-semibold text-white text-base">Registrar Peso</span>
              <button 
                onClick={handleSave}
                className="text-primary text-base font-bold hover:opacity-80 transition-opacity"
              >
                Listo
              </button>
            </div>

            {/* Contenido del Panel */}
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="flex items-baseline gap-1 relative">
                <input 
                  type="number" 
                  step="0.1"
                  autoFocus
                  value={tempWeight}
                  onChange={(e) => setTempWeight(e.target.value)}
                  className="bg-transparent text-5xl font-bold text-white text-center w-40 focus:outline-none appearance-none p-0 m-0 border-none placeholder-gray-600"
                  placeholder="0.0"
                />
                <span className="text-xl text-gray-400 font-medium absolute -right-8 bottom-2">kg</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ingresa tu peso corporal actual</p>
            </div>

            {/* Teclado numérico simulado o nativo */}
            {/* En móviles reales, el input autoFocus abrirá el teclado nativo numérico, que es lo ideal */}
          </div>
        </div>
      )}
    </>
  )
}