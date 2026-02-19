
-- First drop the restrictive check constraint on members.role
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_role_check;

-- Populate members table from profiles
INSERT INTO public.members (id, name, email, phone, role)
SELECT 
  p.id,
  COALESCE(p.full_name, 'Sem nome'),
  p.email,
  p.mobile_phone,
  CASE UPPER(COALESCE(p.role, 'ALUNO'))
    WHEN 'ADMIN' THEN 'Administrador'
    WHEN 'DIRETOR' THEN 'Administrador'
    WHEN 'ALUNO' THEN 'Aluno'
    WHEN 'TRABALHADOR' THEN 'Trabalhador'
    WHEN 'WORKER' THEN 'Trabalhador'
    WHEN 'PROFESSOR' THEN 'Trabalhador'
    WHEN 'ESTAGIARIO' THEN 'Trabalhador'
    ELSE 'Visitante'
  END
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.members m WHERE m.id = p.id
);

-- Create trigger function to auto-sync new profiles to members
CREATE OR REPLACE FUNCTION public.sync_profile_to_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.members (id, name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.full_name, 'Sem nome'),
    NEW.email,
    NEW.mobile_phone,
    CASE UPPER(COALESCE(NEW.role, 'ALUNO'))
      WHEN 'ADMIN' THEN 'Administrador'
      WHEN 'DIRETOR' THEN 'Administrador'
      WHEN 'ALUNO' THEN 'Aluno'
      WHEN 'TRABALHADOR' THEN 'Trabalhador'
      WHEN 'WORKER' THEN 'Trabalhador'
      WHEN 'PROFESSOR' THEN 'Trabalhador'
      WHEN 'ESTAGIARIO' THEN 'Trabalhador'
      ELSE 'Visitante'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles for INSERT and UPDATE
DROP TRIGGER IF EXISTS sync_profile_to_member_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_member_trigger
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_member();
