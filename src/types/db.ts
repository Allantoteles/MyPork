export type Perfil = {
  id: string;
  actualizado_at: string | null;
  nombre_completo: string | null;
  avatar_url: string | null;
  peso_kg: number | null;
  racha_dias: number;
};

export type Ejercicio = {
  id: string;
  nombre: string;
  grupo_muscular: string | null;
  equipamiento: string | null;
  icono: string | null;
  creado_at: string;
};

export type Rutina = {
  id: string;
  usuario_id: string;
  nombre: string;
  dia_asignado: string | null;
  creado_at: string;
};

export type EjercicioRutina = {
  id: string;
  rutina_id: string;
  ejercicio_id: string;
  series: number | null;
  repeticiones: number | null;
  peso_sugerido_kg: number | null;
  orden: number | null;
  dia: string | null; // 'L', 'M', 'X', etc.
  // Join fields
  ejercicios?: Ejercicio;
};

export type SesionEntrenamiento = {
  id: string;
  usuario_id: string;
  nombre_rutina: string | null;
  duracion_minutos: number | null;
  creado_at: string;
};
