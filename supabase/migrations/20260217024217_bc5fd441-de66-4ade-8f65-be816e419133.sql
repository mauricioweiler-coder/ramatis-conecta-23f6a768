
-- Trigger function: when course_students.status changes to 'CONCLUIDO',
-- update the member's role based on the course's graduation_role
CREATE OR REPLACE FUNCTION public.handle_course_graduation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _graduation_role text;
  _member_email text;
  _user_id uuid;
BEGIN
  -- Only fire when status changes to CONCLUIDO
  IF NEW.status = 'CONCLUIDO' AND (OLD.status IS NULL OR OLD.status <> 'CONCLUIDO') THEN
    -- Get the graduation_role from the course
    SELECT graduation_role INTO _graduation_role
    FROM public.courses
    WHERE id = NEW.course_id;

    -- If no graduation_role defined, do nothing
    IF _graduation_role IS NULL OR _graduation_role = '' THEN
      RETURN NEW;
    END IF;

    -- Update member's role in members table
    UPDATE public.members
    SET role = _graduation_role
    WHERE id = NEW.member_id;

    -- Try to find a matching user by email and update user_roles + profiles
    SELECT m.email INTO _member_email
    FROM public.members m
    WHERE m.id = NEW.member_id AND m.email IS NOT NULL;

    IF _member_email IS NOT NULL THEN
      SELECT p.id INTO _user_id
      FROM public.profiles p
      WHERE p.email = _member_email
      LIMIT 1;

      IF _user_id IS NOT NULL THEN
        -- Update or insert user_role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (_user_id, _graduation_role::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Update profile role
        UPDATE public.profiles
        SET role = UPPER(_graduation_role)
        WHERE id = _user_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on course_students
CREATE TRIGGER on_course_student_graduation
  BEFORE UPDATE ON public.course_students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_course_graduation();
