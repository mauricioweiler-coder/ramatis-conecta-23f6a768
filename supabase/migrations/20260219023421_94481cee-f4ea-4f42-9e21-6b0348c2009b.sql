
-- Add justification columns to course_attendance
ALTER TABLE public.course_attendance
  ADD COLUMN justification text,
  ADD COLUMN justification_status text;

-- justification_status: NULL (sem justificativa), 'PENDENTE', 'ACEITA', 'REJEITADA'
