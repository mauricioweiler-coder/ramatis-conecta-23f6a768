-- Add FK columns to spiritual_sessions
ALTER TABLE public.spiritual_sessions 
  ADD COLUMN speaker_id uuid REFERENCES public.workers(id),
  ADD COLUMN responsible_id uuid REFERENCES public.workers(id);

-- Add FK column to transactions
ALTER TABLE public.transactions
  ADD COLUMN responsible_id uuid REFERENCES public.workers(id);

-- Add FK column to attendance (member_id already exists but member_name is redundant)
-- No schema change needed for attendance, just code cleanup