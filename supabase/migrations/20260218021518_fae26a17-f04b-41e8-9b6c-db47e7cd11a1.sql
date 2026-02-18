ALTER TABLE public.assistance_records DROP CONSTRAINT assistance_records_status_check;

ALTER TABLE public.assistance_records ADD CONSTRAINT assistance_records_status_check 
  CHECK (status = ANY (ARRAY['AGENDADO'::text, 'AGUARDANDO'::text, 'EM_ANDAMENTO'::text, 'CONCLUIDO'::text, 'CANCELADO'::text]));