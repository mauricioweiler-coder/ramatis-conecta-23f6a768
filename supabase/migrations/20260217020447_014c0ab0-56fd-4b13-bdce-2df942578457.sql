
-- Remover constraint antigo e recriar com novos valores
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['ADMIN', 'WORKER', 'ALUNO', 'PROFESSOR', 'ESTAGIARIO']));
