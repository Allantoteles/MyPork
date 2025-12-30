const WGER_BASE_URL = 'https://wger.de/api/v2';
const API_KEY = 'b40c6d5e05fa2760ec4179102b14aae0290a5e44';

export interface WgerExercise {
  id: number;
  name: string;
  description: string;
  category: { id: number; name: string };
  muscles: { id: number; name: string; name_en: string; is_front: boolean }[];
  muscles_secondary: { id: number; name: string; name_en: string; is_front: boolean }[];
  equipment: { id: number; name: string }[];
  images: string[];
  variations?: number[];
}

// Caché temporal para no saturar la API con nombres de músculos y equipo
let musclesCache: any[] = [];
let equipmentCache: any[] = [];

async function getAuthHeaders() {
    return {
        'Authorization': `Token ${API_KEY}`,
        'Accept': 'application/json',
    };
}

export async function fetchWgerExercises(search: string = '') {
  try {
    const headers = await getAuthHeaders();
    
    // 1. Asegurar que tenemos músculos y equipo en caché para mapear IDs
    if (musclesCache.length === 0) {
        const res = await fetch(`${WGER_BASE_URL}/muscle/`, { headers });
        const data = await res.json();
        musclesCache = data.results;
    }
    if (equipmentCache.length === 0) {
        const res = await fetch(`${WGER_BASE_URL}/equipment/`, { headers });
        const data = await res.json();
        equipmentCache = data.results;
    }

    // 2. Buscar ejercicios
    // Usamos exerciseinfo que ya viene con más datos pre-unificados
    const url = new URL(`${WGER_BASE_URL}/exerciseinfo/`);
    url.searchParams.append('language', '2'); // 2 = Español
    if (search) url.searchParams.append('name', search);

    const response = await fetch(url.toString(), { headers });
    const data = await response.json();
    
    // Mapear los resultados de exerciseinfo
    const exercises = data.results.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        muscles: item.muscles,
        muscles_secondary: item.muscles_secondary,
        equipment: item.equipment,
        images: item.images.map((img: any) => img.image),
        variations: item.variations
    }));

    return exercises;
  } catch (error) {
    console.error('Error fetching Wger data:', error);
    return [];
  }
}

export async function fetchExerciseById(id: number) {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${WGER_BASE_URL}/exerciseinfo/${id}/`, { headers });
        return await res.json();
    } catch (error) {
        console.error('Error fetching detail:', error);
        return null;
    }
}