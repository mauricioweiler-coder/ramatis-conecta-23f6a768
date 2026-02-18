-- Add interviewer_id column to assistance_records
ALTER TABLE public.assistance_records
ADD COLUMN interviewer_id uuid REFERENCES auth.users(id) DEFAULT NULL;

-- Backfill existing records: match interviewer_name to profiles.full_name
UPDATE public.assistance_records ar
SET interviewer_id = p.id
FROM public.profiles p
WHERE ar.interviewer_name IS NOT NULL
  AND ar.interviewer_id IS NULL
  AND LOWER(TRIM(p.full_name)) = LOWER(TRIM(ar.interviewer_name));