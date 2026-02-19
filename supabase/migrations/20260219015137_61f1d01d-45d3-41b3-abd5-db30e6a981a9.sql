ALTER TABLE public.courses ADD COLUMN status text NOT NULL DEFAULT 'Planejado';

-- Set initial status based on existing dates
UPDATE public.courses SET status = 
  CASE
    WHEN end_date IS NOT NULL AND end_date < CURRENT_DATE THEN 'Concluído'
    WHEN start_date IS NOT NULL AND start_date <= CURRENT_DATE THEN 'Em Andamento'
    ELSE 'Planejado'
  END;