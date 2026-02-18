
-- Tabela de permissões por usuário por módulo
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module),
  CONSTRAINT user_permissions_module_check CHECK (
    module = ANY(ARRAY['colaboradores', 'financeiro', 'cursos', 'atendimentos', 'presenca'])
  )
);

-- RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Admin/Diretor pode gerenciar todas as permissões
CREATE POLICY "Admin gerencia permissões"
  ON public.user_permissions
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'diretor')
  );

-- Usuário pode ver suas próprias permissões
CREATE POLICY "Usuário vê próprias permissões"
  ON public.user_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Função para verificar permissão (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text, _type text DEFAULT 'view')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Admin e Diretor sempre têm acesso total
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'diretor'))
    THEN true
    -- Verificar permissão específica
    WHEN _type = 'edit' THEN
      EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND module = _module AND can_edit = true)
    ELSE
      EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND module = _module AND can_view = true)
  END
$$;

-- Trigger para updated_at
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_atendidos_updated_at();
