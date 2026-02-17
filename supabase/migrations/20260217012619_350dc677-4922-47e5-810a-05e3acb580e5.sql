
-- 1. ROLES DE SEGURANÇA
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins gerenciam roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuario ve proprio role" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. MATRÍCULA DE ALUNOS EM CURSOS
CREATE TABLE public.course_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'ATIVO',
  UNIQUE (course_id, member_id)
);
ALTER TABLE public.course_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso autenticados course_students" ON public.course_students FOR ALL TO authenticated
  USING (auth.role() = 'authenticated');

-- 3. PRESENÇA POR ENCONTRO DE CURSO
CREATE TABLE public.course_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  present boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, member_id, date)
);
ALTER TABLE public.course_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso autenticados course_attendance" ON public.course_attendance FOR ALL TO authenticated
  USING (auth.role() = 'authenticated');

-- 4. NOTAS PRIVADAS POR ALUNO
CREATE TABLE public.course_student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_student_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso autenticados course_student_notes" ON public.course_student_notes FOR ALL TO authenticated
  USING (auth.role() = 'authenticated');

-- 5. CORRIGIR POLICY RECURSIVA EM PROFILES
DROP POLICY IF EXISTS "Admin edita qualquer profile" ON public.profiles;
CREATE POLICY "Admin edita qualquer profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema insere profiles" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
