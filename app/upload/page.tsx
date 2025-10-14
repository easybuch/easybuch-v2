'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { FileUploadZone, UploadedFile } from '@/components/molecules/FileUploadZone';
import { Save, X, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
    if (!uploadedFile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement Supabase upload
      console.log('Beleg wird gespeichert:', {
        fileName: uploadedFile.file.name,
        fileSize: uploadedFile.file.size,
        fileType: uploadedFile.file.type,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success feedback
      setShowSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push('/belege');
      }, 2000);
    } catch (err) {
      setError('Fehler beim Speichern des Belegs. Bitte versuchen Sie es erneut.');
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
