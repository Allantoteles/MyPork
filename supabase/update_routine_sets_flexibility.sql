-- Ejecutar en SQL Editor de Supabase
alter table public.ejercicios_rutina 
add column if not exists plan_sets jsonb default '[]'::jsonb;
