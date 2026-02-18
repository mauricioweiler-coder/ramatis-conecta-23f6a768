
ALTER TABLE public.service_types
  ADD COLUMN level integer NOT NULL DEFAULT 1;

-- Set existing coletivo to level 1, individual to level 2
UPDATE public.service_types SET level = 1 WHERE mode = 'coletivo';
UPDATE public.service_types SET level = 2 WHERE mode = 'individual';

-- Add constraint for valid levels
ALTER TABLE public.service_types
  ADD CONSTRAINT service_types_level_check CHECK (level >= 1 AND level <= 10);
