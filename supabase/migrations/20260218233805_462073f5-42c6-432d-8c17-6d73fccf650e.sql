-- Simular alteração de role de aluno para trabalhador (teste da trigger)
UPDATE public.user_roles 
SET role = 'trabalhador' 
WHERE user_id = '2f6a0463-2461-439d-8485-e37c830e7742';