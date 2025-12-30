"use client";

import React, { useState, useEffect } from 'react';
import { fetchWgerExercises, WgerExercise } from '@/lib/wger';
import { fetchFreeDBExercises, FreeDBExercise, getFreeDBImageUrl } from '@/lib/freeDB';
import { translate, translateFullText, translateBatch } from '@/utils/translator';

export function ExploreClient() {
    const [source, setSource] = useState<'wger' | 'freedb'>('wger');
    const [exercises, setExercises] = useState<any[]>([]);
    const [allFreeDBTranslated, setAllFreeDBTranslated] = useState<any[]>([]); // Cache de FreeDB en español
    const [loading, setLoading] = useState(true);
    const [translating, setTranslating] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
    const [mounted, setMounted] = useState(false);

    const handleSelectExercise = async (ex: any) => {
        if (source === 'freedb' && ex.instructions && !ex.translated) {
            setSelectedExercise(ex); 
            setTranslating(true);
            try {
                const translatedSteps = await Promise.all(
                    ex.instructions.map((step: string) => translateFullText(step))
                );
                setSelectedExercise({ ...ex, instructions: translatedSteps, translated: true });
            } catch (e) {
                console.error("Error al traducir instrucciones");
            } finally {
                setTranslating(false);
            }
        } else {
            setSelectedExercise(ex);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, mounted]);

    useEffect(() => {
        if (!mounted) return;
        const load = async () => {
            setLoading(true);
            
            if (source === 'wger') {
                const data = await fetchWgerExercises(debouncedSearch);
                setExercises(data);
            } else {
                // 1. Si no tenemos la base de datos traducida, la cargamos (solo la primera vez)
                let baseData = allFreeDBTranslated;
                if (baseData.length === 0) {
                    const rawData = await fetchFreeDBExercises(''); // Carga inicial masiva
                    
                    // Traducimos solo los campos necesarios para la búsqueda rápida (Nombres)
                    const namesToTranslate = rawData.map((ex: any) => ex.name);
                    const translatedNames = await translateBatch(namesToTranslate);
                    
                    baseData = rawData.map((ex: any, index: number) => ({
                        ...ex,
                        name: translatedNames[index] || ex.name,
                        translatedPrimaryMuscles: translate(ex.primaryMuscles),
                        translatedCategory: translate(ex.category),
                        translatedEquipment: translate(ex.equipment)
                    }));
                    setAllFreeDBTranslated(baseData);
                }

                // 2. BUSCADOR EN ESPAÑOL: Filtramos sobre los datos ya traducidos
                if (!debouncedSearch) {
                    setExercises(baseData.slice(0, 100));
                } else {
                    const term = debouncedSearch.toLowerCase();
                    const filtered = baseData.filter(ex => 
                        ex.name.toLowerCase().includes(term) || 
                        ex.translatedPrimaryMuscles?.some((m: string) => m.toLowerCase().includes(term)) ||
                        ex.translatedCategory?.toLowerCase().includes(term) ||
                        ex.translatedEquipment?.toLowerCase().includes(term)
                    );
                    setExercises(filtered.slice(0, 150));
                }
            }
            setLoading(false);
        };
        load();
    }, [debouncedSearch, source, mounted, allFreeDBTranslated]);

    if (!mounted) {
        return <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-2xl w-full" />
            <div className="h-14 bg-slate-100 dark:bg-white/5 rounded-2xl w-full" />
        </div>;
    }

        const getMuscleIcon = (muscles: any[] | undefined, category: any) => {
            // Normalizar músculos para ambas fuentes
            const safeMuscles = muscles || [];
            let muscleName = '';
            
            if (source === 'wger') {
                muscleName = safeMuscles[0]?.name_en?.toLowerCase() || '';
            } else {
                muscleName = (safeMuscles[0] || '').toString().toLowerCase();
            }
            
            const catName = (typeof category === 'string' ? category : category?.name)?.toLowerCase() || '';
            
            if (muscleName.includes('chest') || muscleName.includes('pectoral')) return { icon: 'stat_3', color: 'bg-blue-500' };
            if (muscleName.includes('back') || muscleName.includes('lats')) return { icon: 'accessibility_new', color: 'bg-emerald-500' };
            if (muscleName.includes('leg') || muscleName.includes('quad') || muscleName.includes('glute')) return { icon: 'directions_walk', color: 'bg-purple-500' };
            if (muscleName.includes('arm') || muscleName.includes('bicep') || muscleName.includes('tricep')) return { icon: 'fitness_center', color: 'bg-orange-500' };
            if (muscleName.includes('shoulder') || muscleName.includes('deltoid')) return { icon: 'frame_person', color: 'bg-cyan-500' };
            if (catName.includes('cardio')) return { icon: 'speed', color: 'bg-red-500' };
            
            return { icon: 'exercise', color: 'bg-slate-400' };
        };
    
        // FUNCIÓN PARA RENDERIZAR TEXTO SEGURO (Evita el error de "Objects are not valid as React child")
        const safeText = (val: any): string => {
            if (!val) return '';
            if (typeof val === 'string') return val;
            if (typeof val === 'object' && val.name) return val.name;
            return 'Ejercicio';
        };
    const handleSourceChange = (newSource: 'wger' | 'freedb') => {
        setSource(newSource);
        setExercises([]);
        setSelectedExercise(null);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Selector de Fuente */}
            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
                <button 
                    onClick={() => handleSourceChange('wger')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${source === 'wger' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">public</span>
                    WGER (ES)
                </button>
                <button 
                    onClick={() => handleSourceChange('freedb')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${source === 'freedb' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">book</span>
                    FREE DB (EN)
                </button>
            </div>

            {/* Buscador Mejorado */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                        search
                    </span>
                </div>
                <input 
                    type="text"
                    placeholder="Buscar ejercicios en español..."
                    className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 border-b-2 focus:border-b-primary transition-all dark:text-white shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Listado de Ejercicios */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="relative size-16">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-700 dark:text-white">Conectando con Wger DB</p>
                        <p className="text-xs text-slate-500 dark:text-text-secondary">Obteniendo atlas de ejercicios...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {exercises.length > 0 ? (
                        exercises.map((ex) => (
                            <div 
                                key={ex.id}
                                onClick={() => handleSelectExercise(ex)}
                                className="bg-white dark:bg-surface-dark rounded-3xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                            >
                                <div className="flex p-4 gap-4">
                                    {/* Imagen/Icono */}
                                    <div className="size-24 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-white/5">
                                        {ex.images && ex.images.length > 0 ? (
                                            <img 
                                                src={source === 'wger' ? ex.images[0] : getFreeDBImageUrl(ex.images[0])} 
                                                alt={ex.name} 
                                                className="w-full h-full object-contain p-2 bg-slate-50 dark:bg-white/5"
                                            />
                                        ) : (
                                            <div className={`w-full h-full ${getMuscleIcon(source === 'wger' ? ex.muscles : ex.primaryMuscles, source === 'wger' ? ex.category : ex.category).color} flex flex-col items-center justify-center text-white p-2`}>
                                                <span className="material-symbols-outlined text-3xl mb-1">
                                                    {getMuscleIcon(source === 'wger' ? ex.muscles : ex.primaryMuscles, source === 'wger' ? ex.category : ex.category).icon}
                                                </span>
                                                <span className="text-[8px] font-black uppercase text-center opacity-80 leading-tight">
                                                    {source === 'wger' 
                                                        ? safeText(ex.muscles?.[0] || ex.category) 
                                                        : translate(ex.primaryMuscles?.[0] || ex.category)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info básica */}
                                    <div className="flex flex-col justify-center flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded uppercase">
                                                {source === 'wger' ? safeText(ex.category) : translate(ex.category)}
                                            </span>
                                            {source === 'freedb' && ex.level && (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                                    ex.level === 'beginner' ? 'bg-green-100 text-green-600' : 
                                                    ex.level === 'intermediate' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {translate(ex.level)}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight group-hover:text-primary transition-colors truncate">
                                            {ex.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-text-secondary line-clamp-1 mt-1 font-medium">
                                            {source === 'wger' 
                                                ? (ex.muscles?.map((m: any) => m.name).join(', ') || 'Varios músculos')
                                                : (translate(ex.primaryMuscles)?.join(', ') || 'Varios músculos')
                                            }
                                        </p>
                                        
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="flex -space-x-2">
                                                {(source === 'wger' ? (ex.muscles || []) : (ex.primaryMuscles || [])).slice(0, 3).map((m: any, i: number) => (
                                                    <div key={i} className="size-5 rounded-full bg-primary border-2 border-white dark:border-surface-dark flex items-center justify-center">
                                                        <span className="text-[8px] text-white font-bold">{(source === 'wger' ? m?.name : m)?.[0] || '?'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500">
                                                {source === 'wger' ? `+${ex.equipment?.length || 0} equipos` : (ex.equipment || 'No equip')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="self-center pr-2">
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                                            chevron_right
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-surface-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
                            <div className="size-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl text-slate-300">sentiment_dissatisfied</span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white">Sin resultados</h4>
                            <p className="text-sm text-slate-500 dark:text-text-secondary px-8">No hemos encontrado ejercicios para "{search}". Prueba con términos generales.</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE DETALLES (ESTILO iOS/MODERN) */}
            {selectedExercise && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in" 
                        onClick={() => setSelectedExercise(null)}
                    />
                    
                    {/* Panel del Modal */}
                    <div className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
                        
                        {/* Header con Imagen */}
                        <div className="relative h-64 bg-slate-50 dark:bg-white/5 flex-shrink-0">
                            {selectedExercise.images && selectedExercise.images.length > 0 ? (
                                <img 
                                    src={source === 'wger' ? selectedExercise.images[0] : getFreeDBImageUrl(selectedExercise.images[0])} 
                                    alt={selectedExercise.name} 
                                    className="w-full h-full object-contain p-8"
                                />
                            ) : (
                                <div className={`w-full h-full ${getMuscleIcon(source === 'wger' ? selectedExercise.muscles : selectedExercise.primaryMuscles, source === 'wger' ? selectedExercise.category : selectedExercise.category).color} flex flex-col items-center justify-center text-white`}>
                                    <span className="material-symbols-outlined text-8xl mb-2">
                                        {getMuscleIcon(source === 'wger' ? selectedExercise.muscles : selectedExercise.primaryMuscles, source === 'wger' ? selectedExercise.category : selectedExercise.category).icon}
                                    </span>
                                    <h4 className="font-black text-xl uppercase tracking-tighter opacity-80">
                                        {source === 'wger' 
                                            ? safeText(selectedExercise.muscles?.[0] || selectedExercise.category) 
                                            : translate(selectedExercise.primaryMuscles?.[0] || selectedExercise.category)}
                                    </h4>
                                </div>
                            )}
                            <button 
                                onClick={() => setSelectedExercise(null)}
                                className="absolute top-6 right-6 size-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Contenido Scrolleable */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full uppercase tracking-widest">
                                    {source === 'wger' ? safeText(selectedExercise.category) : translate(selectedExercise.category)}
                                </span>
                                {source === 'freedb' && selectedExercise.level && (
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-black rounded-full uppercase tracking-widest">
                                        {translate(selectedExercise.level)}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                                {source === 'wger' ? selectedExercise.name : translate(selectedExercise.name)}
                            </h2>

                            {/* Músculos */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-text-secondary uppercase tracking-widest mb-2">Músculos Primarios</p>
                                    <div className="flex flex-wrap gap-1">
                                        {(source === 'wger' ? (selectedExercise.muscles || []) : (selectedExercise.primaryMuscles || [])).map((m: any, i: number) => (
                                            <span key={i} className="text-xs font-bold text-slate-700 dark:text-white bg-white dark:bg-white/10 px-2 py-1 rounded-lg">
                                                {source === 'wger' ? safeText(m) : translate(m)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-text-secondary uppercase tracking-widest mb-2">Equipamiento</p>
                                    <div className="flex flex-wrap gap-1">
                                        {(source === 'wger' ? (selectedExercise.equipment || []) : [selectedExercise.equipment]).filter(Boolean).map((e: any, i: number) => (
                                            <span key={i} className="text-xs font-bold text-slate-700 dark:text-white bg-white dark:bg-white/10 px-2 py-1 rounded-lg">
                                                {source === 'wger' ? safeText(e) : translate(e)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Datos Extra (Solo FreeDB) */}
                            {source === 'freedb' && (
                                <div className="flex flex-wrap gap-3 mb-8">
                                    {selectedExercise.force && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                            <span className="material-symbols-outlined text-sm text-primary">swap_calls</span>
                                            <span className="text-xs font-bold dark:text-white uppercase">{translate(selectedExercise.force)}</span>
                                        </div>
                                    )}
                                    {selectedExercise.mechanic && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                            <span className="material-symbols-outlined text-sm text-primary">settings_input_component</span>
                                            <span className="text-xs font-bold dark:text-white uppercase">{translate(selectedExercise.mechanic)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                        <span className="material-symbols-outlined text-sm text-primary">signal_cellular_alt</span>
                                        <span className="text-xs font-bold dark:text-white uppercase">{translate(selectedExercise.level)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Descripción */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">description</span>
                                        Instrucciones
                                    </h4>
                                    {source === 'freedb' && (
                                        <div className="flex items-center gap-1.5">
                                            {translating ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 animate-pulse">
                                                    <span className="material-symbols-outlined text-[14px] animate-spin">translate</span>
                                                    TRADUCIENDO...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                    ESPAÑOL (IA)
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {source === 'wger' ? (
                                    <div 
                                        className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed space-y-2 prose dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: selectedExercise.description || '<p>No hay instrucciones detalladas disponibles.</p>' }}
                                    />
                                ) : (
                                    <ul className="space-y-3">
                                        {(selectedExercise.instructions || []).map((step: string, i: number) => (
                                            <li key={i} className="flex gap-3">
                                                <span className="flex-shrink-0 size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                                                <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">{step}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Botón Acción */}
                            <button className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                <span className="material-symbols-outlined">add_circle</span>
                                AÑADIR A MI BIBLIOTECA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}