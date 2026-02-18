-- Drop old insert-only trigger
DROP TRIGGER IF EXISTS trg_sync_worker_on_role_insert ON public.user_roles;
DROP FUNCTION IF EXISTS public.sync_worker_on_role_insert();

-- Create new function that handles INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.sync_worker_on_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile RECORD;
BEGIN
  -- On UPDATE: if old role was trabalhador but new is not, deactivate
  IF TG_OP = 'UPDATE' AND OLD.role = 'trabalhador' AND NEW.role <> 'trabalhador' THEN
    UPDATE public.workers SET status = 'INATIVO' WHERE id = OLD.user_id;
    RETURN NEW;
  END IF;

  -- On INSERT or UPDATE: if new role is trabalhador, activate/create worker
  IF NEW.role = 'trabalhador' THEN
    SELECT * INTO _profile FROM public.profiles WHERE id = NEW.user_id;

    INSERT INTO public.workers (id, full_name, email, mobile_phone, whatsapp, cpf, cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_country, status)
    VALUES (
      NEW.user_id,
      COALESCE(_profile.full_name, 'Sem nome'),
      _profile.email,
      _profile.mobile_phone,
      _profile.whatsapp,
      _profile.cpf,
      _profile.cep,
      _profile.address_street,
      _profile.address_number,
      _profile.address_complement,
      _profile.address_neighborhood,
      _profile.address_city,
      _profile.address_state,
      _profile.address_country,
      'ATIVO'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      mobile_phone = EXCLUDED.mobile_phone,
      status = 'ATIVO';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trg_sync_worker_on_role_change
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_worker_on_role_change();

-- Also update delete trigger function name for consistency (keep existing)
-- No change needed for delete trigger

-- Sync existing trabalhadores that are missing from workers table
INSERT INTO public.workers (id, full_name, email, mobile_phone, whatsapp, cpf, cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_country, status)
SELECT
  p.id,
  COALESCE(p.full_name, 'Sem nome'),
  p.email,
  p.mobile_phone,
  p.whatsapp,
  p.cpf,
  p.cep,
  p.address_street,
  p.address_number,
  p.address_complement,
  p.address_neighborhood,
  p.address_city,
  p.address_state,
  p.address_country,
  'ATIVO'
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role = 'trabalhador'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  mobile_phone = EXCLUDED.mobile_phone,
  status = 'ATIVO';