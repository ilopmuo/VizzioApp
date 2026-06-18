-- ============================================================
--  VIZZIO — Fix RLS recursion
--  Ejecuta esto en Supabase SQL Editor para arreglar el error 500
-- ============================================================

-- 1. Función que obtiene el rol del usuario actual sin aplicar RLS
--    (SECURITY DEFINER = corre como el dueño, evita la recursión)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. Eliminar las políticas recursivas de profiles
DROP POLICY IF EXISTS "profiles: jefe select all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: jefe update employees" ON public.profiles;
DROP POLICY IF EXISTS "profiles: jefe update employee rate" ON public.profiles;

-- 3. Recrear sin recursión
CREATE POLICY "profiles: jefe select all"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'jefe');

CREATE POLICY "profiles: jefe update employee rate"
  ON public.profiles FOR UPDATE
  USING (
    public.get_user_role() = 'jefe'
    AND role = 'empleado'
  );

-- 4. Arreglar work_hours
DROP POLICY IF EXISTS "work_hours: jefe select all" ON public.work_hours;
CREATE POLICY "work_hours: jefe select all"
  ON public.work_hours FOR SELECT
  USING (public.get_user_role() = 'jefe');

-- 5. Arreglar resources
DROP POLICY IF EXISTS "resources: jefe insert" ON public.resources;
DROP POLICY IF EXISTS "resources: jefe update" ON public.resources;
DROP POLICY IF EXISTS "resources: jefe delete" ON public.resources;

CREATE POLICY "resources: jefe insert"
  ON public.resources FOR INSERT
  WITH CHECK (public.get_user_role() = 'jefe');

CREATE POLICY "resources: jefe update"
  ON public.resources FOR UPDATE
  USING (public.get_user_role() = 'jefe');

CREATE POLICY "resources: jefe delete"
  ON public.resources FOR DELETE
  USING (public.get_user_role() = 'jefe');

-- 6. Añadir columna hourly_rate si no existe aún
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hourly_rate numeric(8,2) NOT NULL DEFAULT 0;

-- 7. Crear tabla firma_horas si no existe
CREATE TABLE IF NOT EXISTS public.firma_horas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date        date NOT NULL,
  hours       numeric(4,1) NOT NULL CHECK (hours >= 0 AND hours <= 24),
  created_by  uuid NOT NULL REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

ALTER TABLE public.firma_horas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "firma_horas: jefe all" ON public.firma_horas;
CREATE POLICY "firma_horas: jefe all"
  ON public.firma_horas FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'jefe')
  WITH CHECK (public.get_user_role() = 'jefe');
