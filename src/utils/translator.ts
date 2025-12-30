const translationMap: { [key: string]: string } = {
    // Músculos
    'abdominals': 'Abdominales',
    'hamstrings': 'Isquiotibiales',
    'adductors': 'Aductores',
    'quadriceps': 'Cuádriceps',
    'biceps': 'Bíceps',
    'shoulders': 'Hombros',
    'chest': 'Pecho',
    'middle back': 'Espalda Media',
    'lower back': 'Espalda Baja',
    'lats': 'Dorsales',
    'triceps': 'Tríceps',
    'traps': 'Trapecios',
    'forearms': 'Antebrazos',
    'glutes': 'Glúteos',
    'calves': 'Pantorrillas',
    'neck': 'Cuello',
    'abductors': 'Abductores',

    // Equipamiento
    'body only': 'Peso Corporal',
    'dumbbell': 'Mancuerna',
    'barbell': 'Barra',
    'machine': 'Máquina',
    'cable': 'Polea',
    'kettlebells': 'Pesa Rusa',
    'medicine ball': 'Balón Medicinal',
    'exercise ball': 'Pelota de Ejercicio',
    'foam roll': 'Rodillo de Espuma',
    'e-z curl bar': 'Barra Z',
    'bands': 'Bandas Elásticas',
    'other': 'Otro',

    // Categorías
    'strength': 'Fuerza',
    'stretching': 'Estiramiento',
    'plyometrics': 'Pliometría',
    'strongman': 'Strongman',
    'powerlifting': 'Powerlifting',
    'cardio': 'Cardio',
    'olympic weightlifting': 'Halterofilia'
};

export function translate(text: string | string[] | null | undefined): any {
    if (!text) return text;
    if (Array.isArray(text)) return text.map(t => translate(t));

    const lower = text.toLowerCase().trim();
    if (translationMap[lower]) return translationMap[lower];

    let translated = lower;
    Object.keys(translationMap).forEach(key => {
        if (translated.includes(key)) {
            translated = translated.replace(new RegExp(`\b${key}\b`, 'g'), translationMap[key]);
        }
    });

    return translated.charAt(0).toUpperCase() + translated.slice(1);
}

export async function translateFullText(text: string): Promise<string> {
    if (!text) return '';
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        return data[0].map((item: any) => item[0]).join(' ');
    } catch (error) {
        return text;
    }
}

// NUEVA FUNCIÓN: Traducir una lista de títulos en una sola petición
export async function translateBatch(texts: string[]): Promise<string[]> {
    if (texts.length === 0) return [];
    
    // Unimos los títulos con un separador que la IA no rompa
    const separator = " ### ";
    const combinedText = texts.join(separator);
    
    try {
        const translatedCombined = await translateFullText(combinedText);
        // Volvemos a separar por el separador
        return translatedCombined.split("###").map(t => t.trim());
    } catch (error) {
        return texts;
    }
}
