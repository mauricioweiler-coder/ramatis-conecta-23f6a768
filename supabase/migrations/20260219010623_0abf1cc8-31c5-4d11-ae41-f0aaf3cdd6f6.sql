-- Add level column to courses
ALTER TABLE public.courses ADD COLUMN level integer NOT NULL DEFAULT 1;

-- Create index for filtering by level
CREATE INDEX idx_courses_level ON public.courses (level);