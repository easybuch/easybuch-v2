-- ========================================
-- RESET POLICIES - Alle Policies löschen und neu erstellen
-- ========================================

-- 1. ALLE EXISTIERENDEN POLICIES LÖSCHEN

-- Database Policies
DROP POLICY IF EXISTS "Allow test user access" ON receipts;
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can insert own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can delete own receipts" ON receipts;

-- Storage Policies
DROP POLICY IF EXISTS "Allow test uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow test reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow test deletes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;

-- 2. FOREIGN KEY (falls noch nicht vorhanden)
ALTER TABLE receipts 
DROP CONSTRAINT IF EXISTS receipts_user_id_fkey;

ALTER TABLE receipts 
ADD CONSTRAINT receipts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. PRODUCTION DATABASE POLICIES NEU ERSTELLEN

CREATE POLICY "Users can view own receipts"
ON receipts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
ON receipts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
ON receipts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts"
ON receipts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. PRODUCTION STORAGE POLICIES NEU ERSTELLEN

CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. ÜBERPRÜFUNG

-- Database Policies anzeigen
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'receipts';

-- Storage Policies anzeigen
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- ✅ FERTIG!
