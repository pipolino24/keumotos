-- 0002_storage_documentos.sql
-- RLS policies para o bucket "documentos".
-- Convenção do path: {user_id}/{tipo}_{timestamp}.{ext}
-- (o primeiro segmento do nome do arquivo é o UID do dono)

-- Usuário autenticado upload em sua própria pasta
DROP POLICY IF EXISTS "documentos_owner_insert" ON storage.objects;
CREATE POLICY "documentos_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuário autenticado lê seus próprios arquivos
DROP POLICY IF EXISTS "documentos_owner_select" ON storage.objects;
CREATE POLICY "documentos_owner_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuário autenticado atualiza seus próprios arquivos
DROP POLICY IF EXISTS "documentos_owner_update" ON storage.objects;
CREATE POLICY "documentos_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuário autenticado deleta seus próprios arquivos
DROP POLICY IF EXISTS "documentos_owner_delete" ON storage.objects;
CREATE POLICY "documentos_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin lê todos os documentos
DROP POLICY IF EXISTS "documentos_admin_select_all" ON storage.objects;
CREATE POLICY "documentos_admin_select_all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documentos'
    AND public.current_user_role() = 'admin'
  );

-- Admin gerencia todos os documentos
DROP POLICY IF EXISTS "documentos_admin_all" ON storage.objects;
CREATE POLICY "documentos_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'documentos'
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    bucket_id = 'documentos'
    AND public.current_user_role() = 'admin'
  );
