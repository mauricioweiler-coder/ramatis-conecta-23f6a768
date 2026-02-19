-- Drop existing foreign keys referencing workers
ALTER TABLE public.courses DROP CONSTRAINT courses_coordinator_id_fkey;
ALTER TABLE public.courses DROP CONSTRAINT courses_main_teacher_id_fkey;

-- Add new foreign keys referencing profiles
ALTER TABLE public.courses 
  ADD CONSTRAINT courses_coordinator_id_fkey 
  FOREIGN KEY (coordinator_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.courses 
  ADD CONSTRAINT courses_main_teacher_id_fkey 
  FOREIGN KEY (main_teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;