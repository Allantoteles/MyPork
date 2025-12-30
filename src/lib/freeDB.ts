const FREEDB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FREEDB_IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export interface FreeDBExercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

let cachedExercises: FreeDBExercise[] = [];

export async function fetchFreeDBExercises(search: string = '') {
  try {
    if (cachedExercises.length === 0) {
      const response = await fetch(FREEDB_URL);
      cachedExercises = await response.json();
    }

    if (!search) return cachedExercises.slice(0, 150);

    const term = search.toLowerCase();
    return cachedExercises.filter(ex => 
      ex.name.toLowerCase().includes(term) || 
      ex.primaryMuscles.some(m => m.toLowerCase().includes(term)) ||
      ex.secondaryMuscles.some(m => m.toLowerCase().includes(term)) ||
      ex.category.toLowerCase().includes(term) ||
      (ex.equipment && ex.equipment.toLowerCase().includes(term))
    ).slice(0, 300);
  } catch (error) {
    console.error('Error fetching FreeDB:', error);
    return [];
  }
}

export function getFreeDBImageUrl(imagePath: string) {
    return `${FREEDB_IMG_BASE}${imagePath}`;
}
