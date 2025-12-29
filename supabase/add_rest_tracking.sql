-- Agregar campo de tiempo total descansado a sesiones_entrenamiento
-- Ejecutar en SQL Editor de Supabase

ALTER TABLE public.sesiones_entrenamiento
ADD COLUMN IF NOT EXISTS tiempo_descansado_total_segundos INTEGER DEFAULT 0;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_sesiones_tiempo_descansado ON public.sesiones_entrenamiento(tiempo_descansado_total_segundos);

-- Agregar columna de timestamp del descanso más reciente (opcional, para estadísticas)
ALTER TABLE public.sesiones_entrenamiento
ADD COLUMN IF NOT EXISTS actualizado_descanso_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
