"use client"

import React, { useState, useEffect, useRef } from 'react'

interface IOSDatePickerProps {
  label: string
  onChange: (date: string) => void
  initialDate?: string
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function IOSDatePicker({ label, onChange, initialDate }: IOSDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Parsear fecha inicial o usar default (2000-01-01)
  const defaultDate = initialDate ? new Date(initialDate) : new Date('2000-01-01');
  
  const [selectedDay, setSelectedDay] = useState(defaultDate.getDate())
  const [selectedMonth, setSelectedMonth] = useState(defaultDate.getMonth()) // 0-11
  const [selectedYear, setSelectedYear] = useState(defaultDate.getFullYear())

  // Refs para auto-scroll
  const dayRef = useRef<HTMLDivElement>(null)
  const monthRef = useRef<HTMLDivElement>(null)
  const yearRef = useRef<HTMLDivElement>(null)

  // Generar rangos
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 100 + i).reverse(); // 1924 - 2024
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Ajustar día si cambia el mes y nos pasamos (ej: 31 Feb -> 28 Feb)
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth, selectedDay]);

  // Scroll al elemento seleccionado al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToItem(dayRef, selectedDay)
        scrollToItem(monthRef, selectedMonth)
        scrollToItem(yearRef, selectedYear)
      }, 100) // Pequeño delay para render
    }
  }, [isOpen]);

  const scrollToItem = (ref: React.RefObject<HTMLDivElement | null>, value: number | string) => {
    if (ref.current) {
      const selectedEl = ref.current.querySelector(`[data-value="${value}"]`) as HTMLElement
      if (selectedEl) {
        ref.current.scrollTo({
          top: selectedEl.offsetTop - (ref.current.clientHeight / 2) + (selectedEl.clientHeight / 2),
          behavior: 'smooth'
        })
      }
    }
  }

  const handleSave = () => {
    // Formato YYYY-MM-DD
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    onChange(dateStr)
    setIsOpen(false)
  }

  const formattedDateDisplay = `${selectedDay} de ${MONTHS[selectedMonth]} ${selectedYear}`

  return (
    <>
      {/* --- TRIGGER (La fila estilo iOS) --- */}
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center cursor-pointer active:bg-slate-50 dark:active:bg-white/5 transition-colors"
      >
        {label && <span className="text-xs text-slate-400 mb-1 block">{label}</span>}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
          <span className={`text-lg font-bold ${initialDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
            {initialDate ? formattedDateDisplay : 'Seleccionar'}
          </span>
        </div>
      </div>

      {/* --- BOTTOM SHEET MODAL --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full bg-white dark:bg-[#1c1c1e] rounded-t-2xl shadow-2xl pb-safe animate-slide-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-t-2xl">
              <button onClick={() => setIsOpen(false)} className="text-slate-500 dark:text-gray-400">Cancelar</button>
              <span className="font-semibold text-slate-900 dark:text-white">Fecha</span>
              <button onClick={handleSave} className="text-primary font-bold">Listo</button>
            </div>

            {/* Picker Columns */}
            <div className="flex h-64 relative overflow-hidden">
              {/* Highlight Bar (Centro) */}
              <div className="absolute top-1/2 left-0 w-full h-10 -mt-5 bg-slate-100/50 dark:bg-white/10 pointer-events-none border-t border-b border-slate-200 dark:border-white/10" />

              {/* Columna DÍAS */}
              <div className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar py-24 text-center relative z-10" ref={dayRef}>
                {days.map(d => (
                  <div 
                    key={d} 
                    data-value={d}
                    onClick={() => { setSelectedDay(d); scrollToItem(dayRef, d) }}
                    className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${selectedDay === d ? 'text-slate-900 dark:text-white font-bold text-xl' : 'text-slate-400 dark:text-gray-500'}`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Columna MESES */}
              <div className="flex-[2] overflow-y-auto snap-y snap-mandatory no-scrollbar py-24 text-center relative z-10" ref={monthRef}>
                {MONTHS.map((m, idx) => (
                  <div 
                    key={m} 
                    data-value={idx}
                    onClick={() => { setSelectedMonth(idx); scrollToItem(monthRef, idx) }}
                    className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${selectedMonth === idx ? 'text-slate-900 dark:text-white font-bold text-xl' : 'text-slate-400 dark:text-gray-500'}`}
                  >
                    {m}
                  </div>
                ))}
              </div>

              {/* Columna AÑOS */}
              <div className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar py-24 text-center relative z-10" ref={yearRef}>
                {years.map(y => (
                  <div 
                    key={y} 
                    data-value={y}
                    onClick={() => { setSelectedYear(y); scrollToItem(yearRef, y) }}
                    className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${selectedYear === y ? 'text-slate-900 dark:text-white font-bold text-xl' : 'text-slate-400 dark:text-gray-500'}`}
                  >
                    {y}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
