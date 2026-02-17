
-- Add mode column to service_types to distinguish collective vs individual
ALTER TABLE public.service_types
ADD COLUMN mode text NOT NULL DEFAULT 'coletivo';

-- Update existing records to be collective
UPDATE public.service_types SET mode = 'coletivo';

-- Insert "Acolhimento Fraterno" as a default individual type (always present)
INSERT INTO public.service_types (name, description, mode, active)
VALUES ('Acolhimento Fraterno', 'Atendimento inicial obrigatório para todos os assistidos', 'individual', true);

-- Add referral_service_type_id to assistance_records to link to service_types
ALTER TABLE public.assistance_records
ADD COLUMN referral_service_type_id uuid REFERENCES public.service_types(id);
