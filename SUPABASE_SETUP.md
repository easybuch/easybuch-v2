# Supabase Setup Anleitung - Phase 1

## 1. Database Schema erstellen

Gehen Sie zu Ihrem Supabase Dashboard → SQL Editor und führen Sie folgendes SQL-Script aus:

```sql
-- Tabelle für Belege
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf')),
  file_size INTEGER,
  
  -- OCR Ergebnisse (später gefüllt)
  amount DECIMAL(10,2),
  receipt_date DATE,
  category TEXT,
  vendor TEXT,
  raw_ocr_text TEXT,
  
  -- Metadaten
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Index für user_id (Performance)
CREATE INDEX idx_receipts_user_id ON receipts(user_id);

-- Row Level Security aktivieren
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy: User sieht nur eigene Belege
CREATE POLICY "Users can view own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: User kann eigene Belege erstellen
CREATE POLICY "Users can insert own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: User kann eigene Belege aktualisieren
CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: User kann eigene Belege löschen
CREATE POLICY "Users can delete own receipts"
  ON receipts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 2. Storage Bucket erstellen

Gehen Sie zu Supabase Dashboard → Storage:

### Bucket erstellen:
1. Klicken Sie auf "New bucket"
2. **Bucket Name:** `receipts`
3. **Public bucket:** ❌ NEIN (privat)
4. **File size limit:** 10 MB
5. **Allowed MIME types:** 
   - `image/jpeg`
   - `image/png`
   - `image/jpg`
   - `application/pdf`

### Storage Policies erstellen:

Gehen Sie zum erstellten `receipts` Bucket → Policies und fügen Sie folgende Policies hinzu:

#### Policy 1: Users can upload to own folder
```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Users can read own files
```sql
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Users can delete own files
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4: Users can update own files
```sql
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 3. Temporäre Test-Policy (für Development ohne Auth)

**WICHTIG:** Nur für Testing! Später entfernen wenn Authentication implementiert ist.

### Temporäre Database Policy:
```sql
-- TEMPORARY: Allow test user to insert/select receipts
CREATE POLICY "Allow test user access"
ON receipts FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);
```

### Temporäre Storage Policies:
```sql
-- TEMPORARY: Allow uploads to test folder
CREATE POLICY "Allow test uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000'
);

-- TEMPORARY: Allow reading from test folder (for signed URLs)
CREATE POLICY "Allow test reads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000'
);

-- TEMPORARY: Allow deleting from test folder
CREATE POLICY "Allow test deletes"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000'
);
```

## 4. Umgebungsvariablen überprüfen

Stellen Sie sicher, dass Ihre `.env.local` Datei folgende Variablen enthält:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Testen

1. Starten Sie den Development Server:
   ```bash
   npm run dev
   ```

2. Navigieren Sie zu `/upload`

3. Laden Sie ein Testbild oder PDF hoch

4. Überprüfen Sie in Supabase:
   - **Storage → receipts:** Sollte die hochgeladene Datei im Ordner `00000000-0000-0000-0000-000000000000` zeigen
   - **Table Editor → receipts:** Sollte einen neuen Eintrag zeigen

## Nächste Schritte (Phase 2)

- [ ] Authentication mit Supabase Auth implementieren
- [ ] Temporäre Test-Policies entfernen
- [ ] Hard-coded `TEMP_USER_ID` durch echte User ID ersetzen
- [ ] OCR Integration für automatische Datenextraktion
- [ ] Belege-Übersicht Seite mit Daten aus Supabase füllen

## Troubleshooting

### Fehler: "new row violates row-level security policy"
- Stellen Sie sicher, dass die temporären Test-Policies erstellt wurden
- Überprüfen Sie, ob RLS auf der Tabelle aktiviert ist

### Fehler: "Storage upload failed"
- Überprüfen Sie, ob der `receipts` Bucket existiert
- Stellen Sie sicher, dass die Storage Policies korrekt erstellt wurden
- Prüfen Sie die MIME types Konfiguration des Buckets

### Fehler: "Missing Supabase environment variables"
- Überprüfen Sie die `.env.local` Datei
- Starten Sie den Development Server neu nach Änderungen an `.env.local`
