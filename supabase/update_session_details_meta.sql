-- Ejecutar en SQL Editor de Supabase
alter table public.detalles_sesion 
add column if not exists meta_reps integer,
add column if not exists meta_peso_kg decimal;
