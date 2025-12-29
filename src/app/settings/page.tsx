import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { PreferencesSection } from '@/components/PreferencesSection';
import { WeightEditor } from '@/components/WeightEditor';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  const supabase = await createClient();

  // 1. Obtener Usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 2. Obtener Perfil
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const displayName = perfil?.nombre_completo || user.email?.split('@')[0] || 'Atleta';
  const avatarUrl = perfil?.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&background=f27f0d&color=fff`;

  // Calcular Edad
  let edad = '--';
  if (perfil?.fecha_nacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(perfil.fecha_nacimiento);
    let edadCalc = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edadCalc--;
    }
    edad = edadCalc.toString();
  }

  return <SettingsClient perfil={perfil} displayName={displayName} avatarUrl={avatarUrl} edad={edad} />;
}
