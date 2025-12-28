-- Ejecutar en SQL Editor de Supabase
alter table ejercicios 
add column descripcion text,
add column es_favorito boolean default false,
add column tipo text default 'Pesas';
