-- ============================================================
--  VIZZIO — Hoja de Firma Schema
--  Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- 1. Añadir tarifa por hora a los perfiles de empleados
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hourly_rate numeric(8,2) NOT NULL DEFAULT 0;

-- 2. Tabla de horas de la hoja de firma (rellenada por el jefe)
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

-- Solo los jefes pueden gestionar firma_horas
CREATE POLICY "firma_horas: jefe all"
  ON public.firma_horas FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'jefe')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'jefe')
  );

-- Los jefes pueden actualizar la tarifa de los empleados
CREATE POLICY "profiles: jefe update employee rate"
  ON public.profiles FOR UPDATE
  USING (
    role = 'empleado'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'jefe')
  );
