import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const supabase = await createClient();

  // 1. Obtener Usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Obtener Perfil
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!perfil || !perfil.altura_cm) {
    redirect('/onboarding');
  }

  // 3. Obtener Sesiones
  const { data: sesiones } = await supabase
    .from('sesiones_entrenamiento')
    .select('*')
    .eq('usuario_id', user.id)
    .order('creado_at', { ascending: false });
  
  return (
    <DashboardClient 
      user={user}
      perfil={perfil}
      sesiones={sesiones || []}
    />
  );
}