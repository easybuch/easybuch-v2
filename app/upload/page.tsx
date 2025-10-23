'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { FileUploadZone, UploadedFile } from '@/components/molecules/FileUploadZone';
import { Save, X, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { supabase, supabaseUntyped } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getCategoryTranslationKey } from '@/lib/category-mapping';
import { generateFileHash } from '@/utils/file-hash';
import type { ReceiptInsert } from '@/lib/database.types';
import type { ReceiptData } from '@/lib/receipt-ocr';

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const breadcrumbs = [
    { label: t('navigation.dashboard'), href: '/' },
    { label: t('receipts.uploadNew') },
  ];

  // Show loading state while checking authentication
  if (authLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const handleFileSelect = async (file: UploadedFile | null) => {
    setUploadedFile(file);
    setError(null);
    setShowSuccess(false);
    setExtractedData(null);
    setExtractionError(null);
    setIsDuplicate(false);

    // Check for duplicates and extract data when file is selected
    if (file) {
      await checkForDuplicate(file);
      await extractReceiptData(file);
    }
  };

  const checkForDuplicate = async (file: UploadedFile) => {
    if (!user) return;

    try {
      // Generate hash for the uploaded file
      const fileHash = await generateFileHash(file.file);

      // Check if a receipt with this hash already exists for this user
      const { data: existingReceipts, error: checkError } = await supabase
        .from('receipts')
        .select('id, file_name, created_at')
        .eq('user_id', user.id)
        .eq('file_hash', fileHash)
        .limit(1);

      if (checkError) {
        console.error('Error checking for duplicates:', checkError);
        return;
      }

      if (existingReceipts && existingReceipts.length > 0) {
        setIsDuplicate(true);
      }
    } catch (err) {
      console.error('Error generating file hash:', err);
    }
  };

  const extractReceiptData = async (file: UploadedFile) => {
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const formData = new FormData();
      formData.append('file', file.file);

      const response = await fetch('/api/receipts/extract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('receipts.uploadError'));
      }

      setExtractedData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('receipts.uploadError');
      setExtractionError(errorMessage);
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!uploadedFile || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {

      const file = uploadedFile.file;
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

      // 4. Generate file hash for duplicate detection
      const fileHash = await generateFileHash(file);

      // 5. Create database entry with extracted data
      const receiptData: ReceiptInsert = {
        user_id: user.id,
        file_url: storagePath, // Store path, not URL
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        file_hash: fileHash,
        processed: extractedData ? true : false,
        amount_net: extractedData?.betrag_netto ?? null,
        amount_tax: extractedData?.mwst_betrag ?? null,
        amount_gross: extractedData?.betrag_brutto ?? null,
        tax_rate: extractedData?.mwst_satz ?? null,
        vat_7_net: extractedData?.vat_7_net ?? null,
        vat_7_tax: extractedData?.vat_7_tax ?? null,
        vat_19_net: extractedData?.vat_19_net ?? null,
        vat_19_tax: extractedData?.vat_19_tax ?? null,
        receipt_date: extractedData?.datum ?? null,
        category: extractedData?.kategorie ?? null,
        vendor: extractedData?.lieferant ?? null,
        raw_ocr_text: extractedData?.raw_text ?? null,
      };

      const { error: dbError } = await supabaseUntyped.from('receipts').insert(receiptData);

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
        err instanceof Error ? err.message : t('receipts.uploadError');
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-section font-bold text-text-primary mb-2">
            {t('receipts.uploadNew')}
          </h1>
          <p className="text-text-secondary">
            {t('receipts.dragDrop')}
          </p>
        </div>
      </div>

        {/* Two Column Layout: Upload + Extracted Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Upload */}
          <Card className="min-h-[500px]">
            <FileUploadZone
              onFileSelect={handleFileSelect}
              uploadedFile={uploadedFile}
              error={error}
            />
            
            {/* Duplicate Warning */}
            {isDuplicate && uploadedFile && (
              <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-button">
                <div className="flex items-start gap-3">
                  <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-900 mb-1">
                      {t('receipts.duplicateReceipt')}
                    </h4>
                    <p className="text-sm text-yellow-800">
                      {t('receipts.duplicateReceiptMessage')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

        {/* Right Column: Extracted Data or Status */}
        <Card className="flex items-center justify-center min-h-[500px]">
          {/* Loading State */}
          {isExtracting && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Loader2 size={48} className="text-brand animate-spin mb-4" />
              <p className="font-semibold text-text-primary mb-2">{t('receipts.analyzing')}</p>
              <p className="text-sm text-text-secondary">
                {t('receipts.extractedData')}
              </p>
            </div>
          )}

          {/* Extracted Data */}
          {extractedData && !isExtracting && (
              <div className="p-6 w-full bg-green-50">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={20} className="text-brand" />
                  <h3 className="font-semibold text-text-primary">{t('receipts.extractedData')}</h3>
                </div>
                <div className="space-y-4">
                  {extractedData.lieferant && (
                    <div className="pb-3 border-b border-gray-200">
                      <p className="text-xs text-text-footer mb-1">{t('receipts.merchant')}</p>
                      <p className="font-medium text-text-primary">{extractedData.lieferant}</p>
                    </div>
                  )}
                  
                  {/* MwSt-Aufschlüsselung */}
                  <div className="pb-3 border-b border-gray-200">
                    <p className="text-xs text-text-footer mb-2">{t('receipts.amountBreakdown')}</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-button p-3 space-y-2">
                      {/* Check if mixed VAT rates exist */}
                      {(extractedData.vat_7_net || extractedData.vat_19_net) ? (
                        <>
                          {/* 7% VAT Section */}
                          {extractedData.vat_7_net && (
                            <div className="space-y-1 pb-2">
                              <div className="flex justify-between items-center text-xs text-text-footer font-semibold">
                                <span>{t('receipts.vat7Rate')}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary pl-2">{t('receipts.amountNet')}:</span>
                                <span className="font-medium text-text-primary">
                                  {extractedData.vat_7_net.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary pl-2">{t('receipts.amountTax')} (7%):</span>
                                <span className="font-medium text-text-primary">
                                  {extractedData.vat_7_tax?.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* 19% VAT Section */}
                          {extractedData.vat_19_net && (
                            <div className="space-y-1 pb-2 border-t border-blue-300 pt-2">
                              <div className="flex justify-between items-center text-xs text-text-footer font-semibold">
                                <span>{t('receipts.vat19Rate')}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary pl-2">{t('receipts.amountNet')}:</span>
                                <span className="font-medium text-text-primary">
                                  {extractedData.vat_19_net.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary pl-2">{t('receipts.amountTax')} (19%):</span>
                                <span className="font-medium text-text-primary">
                                  {extractedData.vat_19_tax?.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Total Section */}
                          {extractedData.betrag_brutto && (
                            <div className="flex justify-between items-center text-base pt-2 border-t-2 border-blue-400">
                              <span className="font-semibold text-text-primary">{t('receipts.amountGross')}:</span>
                              <span className="font-bold text-lg text-brand">
                                {extractedData.betrag_brutto.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Simple receipt with single VAT rate */}
                          {extractedData.betrag_netto && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-text-secondary">{t('receipts.amountNet')}:</span>
                              <span className="font-medium text-text-primary">
                                {extractedData.betrag_netto.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                              </span>
                            </div>
                          )}
                          {extractedData.mwst_betrag && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-text-secondary">
                                {t('receipts.amountTax')} {extractedData.mwst_satz ? `(${extractedData.mwst_satz}%)` : ''}:
                              </span>
                              <span className="font-medium text-text-primary">
                                {extractedData.mwst_betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                              </span>
                            </div>
                          )}
                          {extractedData.betrag_brutto && (
                            <div className="flex justify-between items-center text-base pt-2 border-t border-blue-300">
                              <span className="font-semibold text-text-primary">{t('receipts.amountGross')}:</span>
                              <span className="font-bold text-lg text-brand">
                                {extractedData.betrag_brutto.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {extractedData.datum && (
                    <div className="pb-3 border-b border-gray-200">
                      <p className="text-xs text-text-footer mb-1">{t('receipts.date')}</p>
                      <p className="font-medium text-text-primary">
                        {new Date(extractedData.datum).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  )}
                  {extractedData.kategorie && (
                    <div className="pb-3">
                      <p className="text-xs text-text-footer mb-1">{t('receipts.category')}</p>
                      <p className="font-medium text-text-primary">{t(getCategoryTranslationKey(extractedData.kategorie))}</p>
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* Extraction Error */}
          {extractionError && !isExtracting && (
            <div className="p-8 text-center">
              <AlertCircle size={48} className="text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold text-text-primary mb-2">{t('receipts.uploadError')}</h3>
              <p className="text-sm text-text-secondary mb-3">{extractionError}</p>
              <p className="text-sm text-text-footer">
                {t('receipts.extractedData')}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!uploadedFile && !isExtracting && !extractedData && !extractionError && (
            <div className="p-8 text-center">
              <Sparkles size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-text-secondary mb-2">{t('receipts.extractedData')}</p>
              <p className="text-sm text-text-footer">
                {t('receipts.dragDrop')}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Extraction Error Banner (below cards) */}
      {extractionError && !isExtracting && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              {t('receipts.uploadError')}
            </p>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-button flex items-center gap-3">
          <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">{t('receipts.uploadError')}</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-button flex items-center gap-3">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">{t('receipts.uploadSuccess')}</p>
            <p className="text-sm text-green-700">{t('common.loading')}</p>
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
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!uploadedFile || isSubmitting}
          className="sm:w-auto"
        >
          <Save size={20} className="mr-2" />
          {isSubmitting ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </DashboardLayout>
  );
}
