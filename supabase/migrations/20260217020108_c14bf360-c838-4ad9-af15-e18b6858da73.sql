
-- 1. Adicionar novos valores ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'estagiario';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trabalhador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno';

-- 2. Adicionar coluna graduation_role ao courses (role que aluno recebe ao concluir)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS graduation_role text DEFAULT NULL;

-- 3. Atualizar handle_new_user para inserir profile como ALUNO e criar user_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  -- Inserir perfil
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'ALUNO'
  );
  -- Inserir role padrão como aluno
  insert into public.user_roles (user_id, role)
  values (new.id, 'aluno');
  return new;
end;
$function$;
