
-- Tabela de aulas do curso
CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  lesson_date date,
  lesson_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso autenticados course_lessons"
  ON public.course_lessons FOR ALL
  USING (auth.role() = 'authenticated');

-- Tabela de materiais por aula
CREATE TABLE public.course_lesson_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'file', -- 'file', 'link', 'text'
  content text, -- URL do arquivo, link externo ou conteúdo texto
  file_name text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_lesson_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso autenticados course_lesson_materials"
  ON public.course_lesson_materials FOR ALL
  USING (auth.role() = 'authenticated');

-- Bucket para materiais de aula
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', true);

CREATE POLICY "Autenticados podem upload de materiais"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Autenticados podem ver materiais"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-materials');

CREATE POLICY "Autenticados podem deletar materiais"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-materials' AND auth.role() = 'authenticated');

-- Índices
CREATE INDEX idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX idx_course_lesson_materials_lesson_id ON public.course_lesson_materials(lesson_id);
CREATE INDEX idx_course_attendance_date ON public.course_attendance(date);
