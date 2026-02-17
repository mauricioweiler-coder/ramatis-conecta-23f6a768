
-- Tabela de tipos de atendimento (cadastro livre)
CREATE TABLE public.service_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total a autenticados" ON public.service_types FOR ALL USING (auth.role() = 'authenticated');

-- Tabela de sessões espirituais (palestras)
CREATE TABLE public.spiritual_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date date NOT NULL,
  start_time text,
  responsible_name text,
  observations text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.spiritual_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total a autenticados" ON public.spiritual_sessions FOR ALL USING (auth.role() = 'authenticated');

-- Tabela de atendimentos realizados por sessão
CREATE TABLE public.session_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.spiritual_sessions(id) ON DELETE CASCADE,
  service_type_id uuid NOT NULL REFERENCES public.service_types(id) ON DELETE RESTRICT,
  people_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.session_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total a autenticados" ON public.session_services FOR ALL USING (auth.role() = 'authenticated');
