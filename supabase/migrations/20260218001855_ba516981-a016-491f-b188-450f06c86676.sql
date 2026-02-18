
-- Tabela de cadastro de atendidos (pessoas que recebem atendimento individual)
CREATE TABLE public.atendidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.atendidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total a autenticados" ON public.atendidos
  FOR ALL USING (auth.role() = 'authenticated'::text);

-- Adicionar referência ao atendido na tabela de assistance_records
ALTER TABLE public.assistance_records
  ADD COLUMN atendido_id UUID REFERENCES public.atendidos(id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_atendidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_atendidos_updated_at
  BEFORE UPDATE ON public.atendidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_atendidos_updated_at();
