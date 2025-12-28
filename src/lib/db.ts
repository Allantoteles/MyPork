import Dexie, { Table } from 'dexie';

// Definimos la interfaz del Ejercicio Local (pendiente de sincronizar)
export interface EjercicioLocal {
  id?: number; // ID auto-incrementable local
  nombre: string;
  tipo: string;
  descripcion: string;
  es_favorito: boolean;
  grupo_muscular: string;
  foto_blob?: Blob; // Aquí guardamos la foto cruda en el celular
  sincronizado: number; // 0 = Pendiente, 1 = Subido
  creado_at: Date;
}

export class MyPorkDB extends Dexie {
  ejerciciosPendientes!: Table<EjercicioLocal>;

  constructor() {
    super('MyPorkOfflineDB');
    this.version(1).stores({
      ejerciciosPendientes: '++id, sincronizado, creado_at' // Indices para búsqueda rápida
    });
  }
}

export const db = new MyPorkDB();
