-- Ejecutar en SQL Editor de Supabase
create table detalles_sesion (
  id uuid default gen_random_uuid() primary key,
  sesion_id uuid references sesiones_entrenamiento(id) on delete cascade not null,
  ejercicio_id uuid references ejercicios(id),
  nombre_ejercicio text,
  nro_serie integer,
  reps integer,
  peso_kg decimal,
  creado_at timestamp with time zone default now()
);

alter table detalles_sesion enable row level security;

-- Política de seguridad: Solo puedes ver/editar detalles de TUS sesiones
create policy "Usuarios gestionan sus propios detalles" 
on detalles_sesion for all using (
  auth.uid() = (select usuario_id from sesiones_entrenamiento where id = sesion_id)
);
