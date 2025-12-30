import React from 'react';
import { ExploreClient } from './ExploreClient';
import { DashboardHeader } from '@/components/DashboardHeader';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ExplorePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const displayName = perfil?.nombre_completo?.split(' ')[0] || user.email?.split('@')[0] || 'Atleta';
    const avatarUrl = perfil?.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&background=f27f0d&color=fff`;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24" suppressHydrationWarning={true}>
            <DashboardHeader 
                user={{
                    displayName,
                    avatarUrl,
                    email: user.email || ''
                }}
            />
            
            <main className="px-4 mt-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Explorar</h1>
                    <p className="text-sm text-slate-500 dark:text-text-secondary">
                        Busca ejercicios en la base de datos de Wger
                    </p>
                </div>

                <ExploreClient />
            </main>
        </div>
    );
}
