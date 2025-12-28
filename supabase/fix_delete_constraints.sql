-- Ejecutar en SQL Editor de Supabase

-- 1. Permitir borrar ejercicios aunque estén en el historial (pone el ID en NULL, mantiene el nombre)
alter table detalles_sesion drop constraint if exists detalles_sesion_ejercicio_id_fkey;

alter table detalles_sesion
add constraint detalles_sesion_ejercicio_id_fkey
foreign key (ejercicio_id)
references ejercicios(id)
on delete set null;

-- 2. Permitir borrar ejercicios aunque estén en rutinas guardadas (elimina el paso de la rutina)
alter table ejercicios_rutina drop constraint if exists ejercicios_rutina_ejercicio_id_fkey;

alter table ejercicios_rutina
add constraint ejercicios_rutina_ejercicio_id_fkey
foreign key (ejercicio_id)
references ejercicios(id)
on delete cascade;
