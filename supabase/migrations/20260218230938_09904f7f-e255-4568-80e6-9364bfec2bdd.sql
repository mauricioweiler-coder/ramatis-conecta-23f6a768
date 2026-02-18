
-- Function to sync worker when role 'trabalhador' is assigned
CREATE OR REPLACE FUNCTION public.sync_worker_on_role_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile RECORD;
BEGIN
  -- Only act when the role is 'trabalhador'
  IF NEW.role = 'trabalhador' THEN
    -- Get profile data
    SELECT * INTO _profile FROM public.profiles WHERE id = NEW.user_id;

    -- Insert into workers if not already there
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

-- Trigger on user_roles insert
CREATE TRIGGER trg_sync_worker_on_role_insert
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_worker_on_role_insert();

-- Also handle role removal: mark worker as INATIVO when 'trabalhador' role is deleted
CREATE OR REPLACE FUNCTION public.sync_worker_on_role_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role = 'trabalhador' THEN
    UPDATE public.workers SET status = 'INATIVO' WHERE id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_sync_worker_on_role_delete
AFTER DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_worker_on_role_delete();
