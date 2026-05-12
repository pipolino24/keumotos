-- Trava o campo `role` (e `setor`) em UPDATE feitos pelo próprio usuário.
-- Antes da migration, um cliente podia rodar
--   UPDATE profiles SET role='admin' WHERE id = auth.uid();
-- e se promover. Agora um trigger BEFORE UPDATE força esses dois campos a
-- continuarem com o valor anterior quando o caller não é admin.

CREATE OR REPLACE FUNCTION public.profiles_block_self_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Admins podem mudar qualquer campo.
  SELECT (raw_user_meta_data ->> 'role') INTO caller_role
  FROM auth.users
  WHERE id = auth.uid();

  IF caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Caller não-admin: força role e setor a permanecerem como estavam.
  NEW.role := OLD.role;
  NEW.setor := OLD.setor;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_block_self_role_change ON public.profiles;

CREATE TRIGGER trg_profiles_block_self_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_block_self_role_change();

COMMENT ON FUNCTION public.profiles_block_self_role_change IS
  'Impede que usuários não-admin alterem o próprio role/setor — fix de escalação de privilégio (auditoria iter 2)';
