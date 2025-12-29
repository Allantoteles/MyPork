"use client"

import React, { useTransition, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/db'

export default function NewExercise() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Estados de formulario
  const [exerciseType, setExerciseType] = useState('Pesas')
  const [selectedGroup, setSelectedGroup] = useState('Pecho')
  const [imageBase64, setImageBase64] = useState<string | null>(null)

  // Listas dinámicas
  const muscleGroups = ['Pecho', 'Espalda', 'Piernas', 'Brazos', 'Hombros', 'Abdominales', 'Full Body', 'Otro'];
  const cardioGroups = ['Cinta', 'Bicicleta', 'Elíptica', 'Remo', 'Escaladora', 'Natación', 'Caminata', 'Otro'];

  // Cambiar el grupo por defecto al cambiar el tipo
  useEffect(() => {
    setSelectedGroup(exerciseType === 'Pesas' ? 'Pecho' : 'Cinta')
  }, [exerciseType])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Leer la imagen original
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Crear canvas para comprimir
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Redimensionar si es muy grande (máximo 1200px de ancho)
          const maxWidth = 1200
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            // Convertir a base64 con compresión (calidad 0.8)
            const base64String = canvas.toDataURL('image/jpeg', 0.8)
            setImageBase64(base64String)
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string
    const esFavorito = formData.get('es_favorito') === 'on'

    startTransition(async () => {
      try {
        // Guardar localmente en IndexedDB
        await db.ejerciciosPendientes.add({
          nombre,
          tipo: exerciseType,
          descripcion,
          es_favorito: esFavorito,
          grupo_muscular: selectedGroup,
          foto_base64: imageBase64 || null,
          sincronizado: 0, 
          creado_at: new Date()
        })
        router.back()
      } catch (error) {
        console.error("Error local:", error)
        alert("Error al guardar.")
      }
    })
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-screen flex flex-col pb-24 text-black dark:text-white transition-colors duration-200">
      
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        {/* Top App Bar */}
        <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 h-14 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => router.back()}
            className="text-base text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors font-normal"
          >
            Cancelar
          </button>
          <h1 className="text-lg font-bold tracking-tight text-black dark:text-white">Nuevo Ejercicio</h1>
          <button 
            type="submit"
            disabled={isPending}
            className="text-base text-primary font-bold hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {isPending ? '...' : 'Guardar'}
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-6">
          
          {/* Category Selector (Segmented Button) */}
          <div className="bg-gray-200 dark:bg-white/5 p-1 rounded-xl flex gap-1">
            <button 
              type="button"
              onClick={() => setExerciseType('Pesas')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                exerciseType === 'Pesas' 
                ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">fitness_center</span>
              <span>Pesas</span>
            </button>
            <button 
              type="button"
              onClick={() => setExerciseType('Cardio')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                exerciseType === 'Cardio' 
                ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">directions_run</span>
              <span>Cardio</span>
            </button>
          </div>

          {/* Sub-Category Selector (Horizontal Chips) - Dinámico */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 ml-1">
              {exerciseType === 'Pesas' ? 'Grupo Muscular' : 'Tipo de Cardio'}
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(exerciseType === 'Pesas' ? muscleGroups : cardioGroups).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    selectedGroup === group
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Input Fields Group */}
          <div className="space-y-5">
            <div className="group">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Nombre del ejercicio</label>
              <input 
                name="nombre"
                required
                className="w-full h-14 bg-white dark:bg-white/5 border-none rounded-xl px-4 text-base text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-primary shadow-sm outline-none transition-all" 
                placeholder={exerciseType === 'Pesas' ? 'Ej. Press Inclinado' : 'Ej. Running matutino'} 
                type="text"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Descripción y Ajustes</label>
              <textarea 
                name="descripcion"
                className="w-full py-4 bg-white dark:bg-white/5 border-none rounded-xl px-4 text-base text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-primary shadow-sm resize-none outline-none transition-all" 
                placeholder={exerciseType === 'Pesas' ? 'Altura del asiento, agarre...' : 'Ritmo, inclinación deseada...'} 
                rows={4}
              ></textarea>
            </div>
          </div>

          {/* Imagen de referencia */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 ml-1">Foto de referencia (opcional)</label>
            <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
              {imageBase64 ? (
                <div className="relative">
                  <img src={imageBase64} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setImageBase64(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {(imageBase64.length / 1024).toFixed(1)} KB
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-gray-400 text-[32px]">add_photo_alternate</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Toca para seleccionar imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">La imagen se guarda como texto en la base de datos</p>
            </div>
          </div>

          {/* Favoritos */}
          <div className="pt-2">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[20px]">star</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-black dark:text-white">Añadir a Favoritos</span>
                  <span className="text-xs text-slate-500 dark:text-gray-400">Acceso rápido</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input name="es_favorito" className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </main>
      </form>
    </div>
  )
}