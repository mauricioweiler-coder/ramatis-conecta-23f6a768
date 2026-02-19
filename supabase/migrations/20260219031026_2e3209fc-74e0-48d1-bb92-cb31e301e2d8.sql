
-- Add spiritual_session_id to attendance table to link presence to sessions
ALTER TABLE public.attendance
ADD COLUMN spiritual_session_id uuid REFERENCES public.spiritual_sessions(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_attendance_spiritual_session_id ON public.attendance(spiritual_session_id);
