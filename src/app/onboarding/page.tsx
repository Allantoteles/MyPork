"use client"

import React, { useState, useEffect, useTransition } from 'react'
import { completeOnboarding } from './actions'
import { IOSDatePicker } from '@/components/IOSDatePicker'

export default function Onboarding() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  // Estados como STRING para evitar problemas de input controlado/no controlado
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [genero, setGenero] = useState('Hombre')

  // Métricas calculadas
  const [imc, setImc] = useState<number | null>(null)
  const [edad, setEdad] = useState<number | null>(null)
  const [maxHR, setMaxHR] = useState<number | null>(null)

  // Efecto para calcular IMC
  useEffect(() => {
    const p = parseFloat(peso)
    const a = parseFloat(altura)

    if (!isNaN(p) && !isNaN(a) && a > 0) {
      const alturaM = a / 100
      const calculo = p / (alturaM * alturaM)
      setImc(parseFloat(calculo.toFixed(1)))
    } else {
      setImc(null)
    }
  }, [peso, altura])

  // Efecto para calcular Edad y FC Max
  useEffect(() => {
    if (fechaNacimiento) {
      const hoy = new Date()
      const nacimiento = new Date(fechaNacimiento)
      let edadCalc = hoy.getFullYear() - nacimiento.getFullYear()
      const m = hoy.getMonth() - nacimiento.getMonth()
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edadCalc--
      }
      setEdad(edadCalc)
      setMaxHR(220 - edadCalc)
    }
  }, [fechaNacimiento])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!peso || !altura || !fechaNacimiento) {
      setError("Por favor completa todos los campos.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await completeOnboarding(formData)
      if (result?.error) {
        setError(result.error);
      }
    })
  }

  // Helpers visuales
  const getImcStatus = (valor: number) => {
    if (valor < 18.5) return { label: 'Bajo Peso', color: 'text-blue-400', bg: 'bg-blue-500/10' }
    if (valor < 25) return { label: 'Peso Normal', color: 'text-green-500', bg: 'bg-green-500/10' }
    if (valor < 30) return { label: 'Sobrepeso', color: 'text-orange-500', bg: 'bg-orange-500/10' }
    return { label: 'Obesidad', color: 'text-red-500', bg: 'bg-red-500/10' }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col p-6 font-display overflow-y-auto pb-20 transition-colors duration-200">
      
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Configuremos tu Perfil ⚙️</h1>
        <p className="text-slate-500 dark:text-text-secondary text-sm">
          Necesitamos estos datos para calcular tus zonas de entrenamiento personalizadas.
        </p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium text-center animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* INPUTS BÁSICOS */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
            <label className="block text-xs font-bold text-slate-500 dark:text-text-secondary uppercase mb-2">Tus Datos</label>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <span className="text-xs text-slate-400 mb-1 block">Peso (kg)</span>
                <input 
                  name="peso"
                  type="number" 
                  step="0.1"
                  placeholder="0.0"
                  required
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-xl text-center font-bold text-lg text-slate-900 dark:text-white py-3 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-slate-400 mb-1 block">Altura (cm)</span>
                <input 
                  name="altura"
                  type="number" 
                  placeholder="175"
                  required
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-xl text-center font-bold text-lg text-slate-900 dark:text-white py-3 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <IOSDatePicker 
                label="Fecha de Nacimiento"
                initialDate={fechaNacimiento}
                onChange={setFechaNacimiento}
              />
              <input type="hidden" name="fecha_nacimiento" value={fechaNacimiento} />
            </div>

            <div>
              <span className="text-xs text-slate-400 mb-1 block">Género</span>
              <div className="flex gap-2">
                {['Hombre', 'Mujer'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenero(g)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${
                      genero === g 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-transparent text-slate-500 dark:text-text-secondary border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <input type="hidden" name="genero" value={genero} />
              </div>
            </div>
          </div>
        </div>

        {/* TARJETAS EDUCATIVAS */}
        
        {imc && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Tu Índice Corporal (IMC)</h3>
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{imc}</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[150px]">
                  Relación entre tu peso y altura.
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl flex flex-col items-center ${getImcStatus(imc).bg}`}>
                <span className={`text-sm font-bold ${getImcStatus(imc).color}`}>
                  {getImcStatus(imc).label}
                </span>
              </div>
            </div>
          </div>
        )}

        {maxHR && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Tu Motor Cardíaco 🫀</h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-text-secondary">Frecuencia Máxima Teórica</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{maxHR} ppm</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-black/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full w-full opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-4 rounded-2xl border border-orange-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-1">Zona Aeróbica (Zona 2)</h4>
                    <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                      Mantente aquí para mejorar resistencia y oxidar grasas eficientemente.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-black text-orange-600 dark:text-orange-400">
                      {Math.round(maxHR * 0.6)} - {Math.round(maxHR * 0.7)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-orange-600/60 dark:text-orange-400/60">PPM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={isPending}
          className="w-full mt-4 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando...' : 'Comenzar mi Viaje'}
        </button>

      </form>
    </div>
  )
}