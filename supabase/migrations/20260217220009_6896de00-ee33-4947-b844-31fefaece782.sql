-- Set mauricio.weiler@ramatislajeado.org.br as admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '036db342-e571-47d9-b1db-6572b28db49d';

UPDATE public.profiles 
SET role = 'ADMIN' 
WHERE id = '036db342-e571-47d9-b1db-6572b28db49d';