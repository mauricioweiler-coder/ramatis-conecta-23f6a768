
-- Corrigir search_path nas funções existentes
CREATE OR REPLACE FUNCTION public.enable_authenticated_access(tbl text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  execute format('alter table public.%I enable row level security', tbl);
  execute format('create policy "Acesso total a autenticados" on public.%I for all using (auth.role() = ''authenticated'')', tbl);
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'WORKER')
  );
  return new;
end;
$function$;
