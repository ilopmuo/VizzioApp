-- ============================================================
--  VIZZIO — Supabase Schema
--  Ejecuta este SQL en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  role       text not null check (role in ('jefe', 'empleado')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuario solo puede ver y editar su propio perfil
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Los jefes pueden leer todos los perfiles (para listar empleados)
create policy "profiles: jefe select all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'jefe'
    )
  );


-- 2. RESOURCES
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null,
  description text,
  status      text not null default 'activo'
                   check (status in ('activo', 'inactivo', 'mantenimiento')),
  created_by  uuid not null references public.profiles(id) on delete restrict,
  created_at  timestamptz not null default now()
);

alter table public.resources enable row level security;

-- Todos los usuarios autenticados pueden leer recursos activos
create policy "resources: authenticated select"
  on public.resources for select
  using (auth.role() = 'authenticated');

-- Solo los jefes pueden crear/editar/borrar recursos
create policy "resources: jefe insert"
  on public.resources for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'jefe'
    )
  );

create policy "resources: jefe update"
  on public.resources for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'jefe'
    )
  );

create policy "resources: jefe delete"
  on public.resources for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'jefe'
    )
  );


-- 3. WORK HOURS
create table if not exists public.work_hours (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete set null,
  date        date not null,
  hours       numeric(4,1) not null check (hours > 0 and hours <= 24),
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.work_hours enable row level security;

-- Empleados pueden gestionar sus propias horas
create policy "work_hours: employee select own"
  on public.work_hours for select
  using (auth.uid() = employee_id);

create policy "work_hours: employee insert own"
  on public.work_hours for insert
  with check (auth.uid() = employee_id);

create policy "work_hours: employee delete own"
  on public.work_hours for delete
  using (auth.uid() = employee_id);

-- Jefes pueden leer todas las horas
create policy "work_hours: jefe select all"
  on public.work_hours for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'jefe'
    )
  );
