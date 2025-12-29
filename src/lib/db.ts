import Dexie, { Table } from 'dexie';

// Datos pendientes de sincronizar
export interface EjercicioLocal {
  id?: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  es_favorito: boolean;
  grupo_muscular: string;
  icono?: string;
  foto_base64?: string | null;
  sincronizado: number; // 0 = Pendiente, 1 = Subido
  creado_at: Date;
}

export interface SesionLocal {
  id?: number;
  usuario_id: string;
  nombre_rutina: string;
  duracion_minutos: number;
  tiempo_descansado_total_segundos?: number; // Total de segundos descansados en esta sesión
  creado_at: Date;
  sincronizado: number;
}

export interface DetalleSetLocal {
  id?: number;
  sesion_local_id?: number; // FK local temporal
  sesion_remota_id?: string; // FK remota después de sync
  ejercicio_id: string;
  serie_num: number;
  repeticiones: number;
  peso_kg: number;
  completado: boolean;
  sincronizado: number;
  creado_at: Date;
}

export interface EjercicioBorrado {
  id?: number;
  ejercicio_id: string; // UUID de Supabase
  borrado_at: Date;
  sincronizado: number; // 0 = Pendiente, 1 = Sincronizado
}

// Cache de datos remotos para lectura offline
export interface PerfilCache {
  id: string;
  nombre_completo: string | null;
  avatar_url: string | null;
  peso_kg: number | null;
  unidades: string | null;
  descanso_predeterminado: number | null;
  altura_cm?: number | null;
  genero?: string | null;
  racha_dias: number;
  actualizado_at: Date;
}

export interface EjercicioCache {
  id: string;
  nombre: string;
  grupo_muscular: string | null;
  equipamiento: string | null;
  icono: string | null;
  actualizado_at: Date;
}

export interface RutinaCache {
  id: string;
  usuario_id: string;
  nombre: string;
  dia_asignado: string | null;
  actualizado_at: Date;
}

export class MyPorkDB extends Dexie {
  // Tablas de datos pendientes de sincronizar
  ejerciciosPendientes!: Table<EjercicioLocal>;
  sesionesPendientes!: Table<SesionLocal>;
  detallesSetsPendientes!: Table<DetalleSetLocal>;
  ejerciciosBorrados!: Table<EjercicioBorrado>;
  
  // Cache de datos remotos para uso offline
  perfilCache!: Table<PerfilCache>;
  ejerciciosCache!: Table<EjercicioCache>;
  rutinasCache!: Table<RutinaCache>;

  constructor() {
    super('MyPorkOfflineDB');
    this.version(3).stores({
      // Pendientes de sync
      ejerciciosPendientes: '++id, sincronizado, creado_at',
      sesionesPendientes: '++id, sincronizado, creado_at, usuario_id',
      detallesSetsPendientes: '++id, sincronizado, sesion_local_id, sesion_remota_id',
      ejerciciosBorrados: '++id, ejercicio_id, sincronizado, borrado_at',
      // Cache
      perfilCache: 'id, actualizado_at',
      ejerciciosCache: 'id, actualizado_at',
      rutinasCache: 'id, usuario_id, actualizado_at',
    });
  }
}

export const db = new MyPorkDB();
