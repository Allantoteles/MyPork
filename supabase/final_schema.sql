-- ==============================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS - MYPORK (Gym Tracker PWA)
-- ==============================================================================

-- 1. CONFIGURACIÓN INICIAL
-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. TABLAS PRINCIPALES
-- ==============================================================================

-- A. PERFILES (Extensión de Auth User)
create table if not exists public.perfiles (
  id uuid references auth.users on delete cascade primary key,
  actualizado_at timestamp with time zone default now(),
  
  -- Información Personal
  nombre_completo text,
  avatar_url text,
  genero text, -- 'Hombre', 'Mujer'
  fecha_nacimiento date,
  
  -- Métricas de Salud
  peso_kg decimal,
  altura_cm integer,
  
  -- Gamification
  racha_dias integer default 0,
  
  -- Configuración / Preferencias
  unidades text default 'Métrico (kg)',
  descanso_predeterminado integer default 60
);

-- B. EJERCICIOS (Biblioteca)
create table if not exists public.ejercicios (
  id uuid default gen_random_uuid() primary key,
  creado_at timestamp with time zone default now(),
  
  -- Datos del Ejercicio
  nombre text not null,
  descripcion text,
  tipo text default 'Pesas', -- 'Pesas' o 'Cardio'
  grupo_muscular text, -- 'Pecho', 'Espalda', etc.
  equipamiento text, -- 'Barra', 'Mancuerna', 'Máquina'
  
  -- Recursos Visuales
  icono text default 'fitness_center', -- Nombre de Material Symbol
  foto_url text, -- URL de Supabase Storage
  
  -- Flags
  es_favorito boolean default false,
  
  -- Propiedad (Opcional: si null es público, si tiene ID es privado del usuario)
  usuario_id uuid references public.perfiles(id) on delete cascade
);

-- C. RUTINAS (Cabecera de planes)
create table if not exists public.rutinas (
  id uuid default gen_random_uuid() primary key,
  creado_at timestamp with time zone default now(),
  
  usuario_id uuid references public.perfiles(id) on delete cascade not null,
  nombre text not null,
  dia_asignado text -- 'L', 'M', 'X', ...
);

-- D. EJERCICIOS DE RUTINA (Detalle del plan)
create table if not exists public.ejercicios_rutina (
  id uuid default gen_random_uuid() primary key,
  
  rutina_id uuid references public.rutinas(id) on delete cascade not null,
  ejercicio_id uuid references public.ejercicios(id) on delete set null,
  
  -- Metas
  series integer default 3,
  repeticiones integer default 10,
  peso_sugerido_kg decimal,
  orden integer default 0
);

-- E. SESIONES DE ENTRENAMIENTO (Historial - Cabecera)
create table if not exists public.sesiones_entrenamiento (
  id uuid default gen_random_uuid() primary key,
  creado_at timestamp with time zone default now(),
  
  usuario_id uuid references public.perfiles(id) on delete cascade not null,
  nombre_rutina text, -- Guardamos el nombre histórico
  duracion_minutos integer,
  notas text
);

-- F. DETALLES DE SESIÓN (Historial - Sets reales)
create table if not exists public.detalles_sesion (
  id uuid default gen_random_uuid() primary key,
  creado_at timestamp with time zone default now(),
  
  sesion_id uuid references public.sesiones_entrenamiento(id) on delete cascade not null,
  ejercicio_id uuid references public.ejercicios(id) on delete set null,
  
  nombre_ejercicio text, -- Snapshot del nombre
  nro_serie integer,
  reps integer,
  peso_kg decimal,
  rpe integer -- Esfuerzo percibido (1-10)
);

-- ==============================================================================
-- 3. SEGURIDAD (Row Level Security - RLS)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
alter table public.perfiles enable row level security;
alter table public.ejercicios enable row level security;
alter table public.rutinas enable row level security;
alter table public.ejercicios_rutina enable row level security;
alter table public.sesiones_entrenamiento enable row level security;
alter table public.detalles_sesion enable row level security;

-- POLÍTICAS

-- Perfiles: Ver y editar el propio
create policy "Usuario ve su perfil" on public.perfiles for select using (auth.uid() = id);
create policy "Usuario edita su perfil" on public.perfiles for update using (auth.uid() = id);

-- Ejercicios: Ver públicos O propios. Crear/Editar propios.
create policy "Ver ejercicios" on public.ejercicios for select 
  using (usuario_id is null or usuario_id = auth.uid());
create policy "Crear ejercicios" on public.ejercicios for insert 
  with check (auth.uid() = usuario_id);
create policy "Editar ejercicios" on public.ejercicios for update 
  using (auth.uid() = usuario_id);

-- Rutinas: Gestión total de propias
create policy "Gestión rutinas" on public.rutinas for all 
  using (auth.uid() = usuario_id);

-- Ejercicios Rutina: Gestión si la rutina es propia
create policy "Gestión ejercicios rutina" on public.ejercicios_rutina for all 
  using (exists (select 1 from public.rutinas where id = rutina_id and usuario_id = auth.uid()));

-- Sesiones: Gestión total de propias
create policy "Gestión sesiones" on public.sesiones_entrenamiento for all 
  using (auth.uid() = usuario_id);

-- Detalles Sesión: Gestión si la sesión es propia
create policy "Gestión detalles sesión" on public.detalles_sesion for all 
  using (exists (select 1 from public.sesiones_entrenamiento where id = sesion_id and usuario_id = auth.uid()));

-- ==============================================================================
-- 4. AUTOMATIZACIÓN (Triggers)
-- ==============================================================================

-- Función para crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre_completo, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 5. ALMACENAMIENTO (Storage)
-- ==============================================================================

-- Insertar el bucket 'ejercicios' si no existe (Nota: Esto suele hacerse en UI, pero el SQL ayuda)
insert into storage.buckets (id, name, public)
values ('ejercicios', 'ejercicios', true)
on conflict (id) do nothing;

-- Política de Storage: Cualquiera ve, solo autenticados suben
create policy "Cualquiera ve imagenes" on storage.objects for select
  using ( bucket_id = 'ejercicios' );

create policy "Autenticados suben imagenes" on storage.objects for insert
  with check ( bucket_id = 'ejercicios' and auth.role() = 'authenticated' );
