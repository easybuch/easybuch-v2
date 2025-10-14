'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { FileUploadZone, UploadedFile } from '@/components/molecules/FileUploadZone';
import { Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { ReceiptInsert } from '@/lib/database.types';

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: 'Neuen Beleg hochladen' },
  ];

  const handleFileSelect = (file: UploadedFile | null) => {
    setUploadedFile(file);
    setError(null);
    setShowSuccess(false);
  };

  const handleSave = async () => {
    if (!uploadedFile || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {

      const file = uploadedFile.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      // 1. Upload file to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // 2. Store the storage path (not public URL, since bucket is private)
      const storagePath = storageData.path;

      // 3. Determine file type
      const fileType: 'image' | 'pdf' = file.type.includes('pdf') ? 'pdf' : 'image';

      // 4. Create database entry
      const receiptData: ReceiptInsert = {
        user_id: user.id,
        file_url: storagePath, // Store path, not URL
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        processed: false,
      };

      const { error: dbError } = await supabase.from('receipts').insert(receiptData);

      if (dbError) {
        // Cleanup: Delete uploaded file if DB insert fails
        await supabase.storage.from('receipts').remove([filePath]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      // Success feedback
      setShowSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push('/belege');
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Speichern des Belegs.';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-section font-bold text-text-primary mb-2">
            Neuen Beleg hochladen
          </h1>
          <p className="text-text-secondary">
            Laden Sie ein Foto oder PDF Ihres Belegs hoch. EasyBuch erkennt und speichert die
            Informationen automatisch.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="mb-6">
          <FileUploadZone
            onFileSelect={handleFileSelect}
            uploadedFile={uploadedFile}
            error={error}
          />
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-button flex items-center gap-3">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Fehler beim Hochladen</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-button flex items-center gap-3">
            <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Beleg erfolgreich gespeichert!</p>
              <p className="text-sm text-green-700">Sie werden zu Ihren Belegen weitergeleitet...</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="sm:w-auto"
          >
            <X size={20} className="mr-2" />
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!uploadedFile || isSubmitting}
            className="sm:w-auto"
          >
            <Save size={20} className="mr-2" />
            {isSubmitting ? 'Wird gespeichert...' : 'Beleg speichern'}
          </Button>
        </div>

        {/* Info Box - Placeholder for future fields */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-button">
          <p className="text-sm text-text-footer text-center">
            💡 <strong>Bald verfügbar:</strong> Automatische Erkennung von Betrag, Datum und
            Kategorie
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
