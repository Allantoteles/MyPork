-- Ejecutar en SQL Editor de Supabase
alter table perfiles 
add column unidades text default 'Métrico (kg)',
add column descanso_predeterminado integer default 60;
