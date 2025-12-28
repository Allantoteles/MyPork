-- ==========================================
-- SCRIPT DE BASE DE DATOS - MYPORK
-- ==========================================

-- 1. TABLA DE PERFILES (Extensión de los usuarios de Auth)
-- Guarda información adicional de los usuarios
create table perfiles (
  id uuid references auth.users on delete cascade primary key,
  actualizado_at timestamp with time zone,
  nombre_completo text,
  avatar_url text,
  peso_kg decimal,
  racha_dias integer default 0
);

-- 2. TABLA DE RUTINAS
-- Ej: "Empuje A", "Tirón B", "Pierna"
create table rutinas (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references perfiles(id) on delete cascade not null,
  nombre text not null,
  dia_asignado text, -- 'L', 'M', 'X', 'J', 'V', 'S', 'D'
  creado_at timestamp with time zone default now()
);

-- 3. TABLA DE EJERCICIOS (Biblioteca de ejercicios)
create table ejercicios (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  grupo_muscular text,
  equipamiento text,
  icono text,
  creado_at timestamp with time zone default now()
);

-- 4. TABLA INTERMEDIA: EJERCICIOS POR RUTINA
-- Define qué ejercicios pertenecen a cada rutina y sus objetivos
create table ejercicios_rutina (
  id uuid default gen_random_uuid() primary key,
  rutina_id uuid references rutinas(id) on delete cascade not null,
  ejercicio_id uuid references ejercicios(id) not null,
  series integer,
  repeticiones integer,
  peso_sugerido_kg decimal,
  orden integer -- Para mantener el orden visual en la rutina
);

-- 5. TABLA DE SESIONES DE ENTRENAMIENTO (Historial)
-- Registra cada vez que el usuario completa un entrenamiento
create table sesiones_entrenamiento (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references perfiles(id) on delete cascade not null,
  nombre_rutina text,
  duracion_minutos integer,
  creado_at timestamp with time zone default now()
);

-- ==========================================
-- CONFIGURACIÓN DE SEGURIDAD (RLS)
-- ==========================================

alter table perfiles enable row level security;
alter table rutinas enable row level security;
alter table ejercicios enable row level security;
alter table ejercicios_rutina enable row level security;
alter table sesiones_entrenamiento enable row level security;

-- Políticas para Perfiles
create policy "Usuarios pueden ver su propio perfil" on perfiles for select using (auth.uid() = id);
create policy "Usuarios pueden actualizar su propio perfil" on perfiles for update using (auth.uid() = id);

-- Políticas para Rutinas (Solo el dueño)
create policy "Usuarios gestionan sus propias rutinas" on rutinas for all using (auth.uid() = usuario_id);

-- Políticas para Ejercicios (Todos pueden leer la biblioteca)
create policy "Todos pueden ver la biblioteca de ejercicios" on ejercicios for select using (true);

-- Políticas para Sesiones (Solo el dueño)
create policy "Usuarios ven su propio historial" on sesiones_entrenamiento for all using (auth.uid() = usuario_id);

-- ==========================================
-- FUNCIONES AUTOMÁTICAS (Triggers)
-- ==========================================

-- Función para crear un perfil automáticamente cuando alguien se registra
create function public.crear_perfil_nuevo_usuario()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre_completo, avatar_url)
  values (new.id, new.raw_user_meta_data->>'nombre_completo', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que dispara la función anterior
create trigger tras_crear_usuario_auth
  after insert on auth.users
  for each row execute procedure public.crear_perfil_nuevo_usuario();

-- ==========================================
-- DATOS INICIALES (Opcional)
-- ==========================================
insert into ejercicios (nombre, grupo_muscular, equipamiento, icono) values
('Press de Banca', 'Pecho', 'Barra', 'fitness_center'),
('Sentadilla', 'Piernas', 'Barra', 'directions_run'),
('Dominadas', 'Espalda', 'Peso Corporal', 'vertical_align_bottom'),
('Curl de Bíceps', 'Brazos', 'Mancuernas', 'fitness_center');
