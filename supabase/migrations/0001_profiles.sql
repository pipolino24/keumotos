-- 0001_profiles.sql
-- Cria a tabela public.profiles ligada 1:1 com auth.users.
-- CNH e demais documentos opcionais; apenas nome + email obrigatórios.

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL,
  telefone      TEXT,
  cpf           TEXT,
  rg            TEXT,
  cnh           TEXT,
  cnh_validade  DATE,
  endereco      JSONB,
  pix           TEXT,
  banco         JSONB,
  role          TEXT NOT NULL DEFAULT 'cliente'
                CHECK (role IN ('admin','vendedor','afiliado','cliente')),
  setor         TEXT NOT NULL DEFAULT 'multimarcas'
                CHECK (setor IN ('multimarcas','loca','pecas')),
  permissoes    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  documentos    JSONB NOT NULL DEFAULT '[]'::JSONB,
  avatar_url    TEXT,
  status        TEXT NOT NULL DEFAULT 'ativo'
                CHECK (status IN ('ativo','suspenso','bloqueado')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf) WHERE cpf IS NOT NULL;

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Cria um profile sempre que um auth.users for inserido
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, setor)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
    COALESCE(NEW.raw_user_meta_data->>'setor', 'multimarcas')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função auxiliar que evita recursão de RLS ao checar role do usuário logado
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Ativa RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_select_all" ON public.profiles;
CREATE POLICY "admin_select_all"
  ON public.profiles FOR SELECT
  USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_update_all" ON public.profiles;
CREATE POLICY "admin_update_all"
  ON public.profiles FOR UPDATE
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_insert" ON public.profiles;
CREATE POLICY "admin_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_delete" ON public.profiles;
CREATE POLICY "admin_delete"
  ON public.profiles FOR DELETE
  USING (public.current_user_role() = 'admin');
