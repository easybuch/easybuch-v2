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
import { useToast } from '@/components/atoms/Toast';
import { getCategoryTranslationKey } from '@/lib/category-mapping';
import { generateFileHash } from '@/utils/file-hash';
import type { ReceiptInsert } from '@/lib/database.types';
import type { ReceiptData } from '@/lib/receipt-ocr';

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleFileSelect = async (files: UploadedFile[]) => {
    setUploadedFiles(files);
    setError(null);
    setExtractedData(null);
    setExtractionError(null);
    setIsDuplicate(false);

    // Extract data when files are selected
    if (files.length > 0) {
      await extractReceiptData(files);
    }
  };

  // Duplicate check removed for multi-image - will be handled during save

  const extractReceiptData = async (files: UploadedFile[]) => {
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const formData = new FormData();
      
      // Add all files to FormData
      files.forEach((uploadedFile) => {
        formData.append('files', uploadedFile.file);
      });

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
    if (uploadedFiles.length === 0 || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload ALL files to Supabase Storage
      const uploadedPaths: Array<{ path: string; order: number }> = [];
      const timestamp = Date.now();
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i].file;
        const fileName = `${timestamp}_part${i + 1}_${file.name}`;
        const filePath = `${user.id}/${fileName}`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) {
          // Cleanup: Delete already uploaded files
          if (uploadedPaths.length > 0) {
            await supabase.storage.from('receipts').remove(uploadedPaths.map(p => p.path));
          }
          throw new Error(`Storage upload failed: ${storageError.message}`);
        }

        uploadedPaths.push({ path: storageData.path, order: i + 1 });
      }

      // 2. Use first file for primary metadata
      const firstFile = uploadedFiles[0].file;
      const fileType: 'image' | 'pdf' = firstFile.type.includes('pdf') ? 'pdf' : 'image';
      const fileHash = await generateFileHash(firstFile);

      // 3. Create database entry with extracted data
      const receiptData: ReceiptInsert = {
        user_id: user.id,
        file_url: uploadedPaths[0].path, // Primary file path
        file_paths: uploadedPaths, // All file paths
        file_name: uploadedFiles.length > 1 ? `${firstFile.name} (+${uploadedFiles.length - 1} weitere)` : firstFile.name,
        file_type: fileType,
        file_size: firstFile.size,
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
        // Cleanup: Delete all uploaded files if DB insert fails
        await supabase.storage.from('receipts').remove(uploadedPaths.map(p => p.path));
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      // Show toast with category
      const categoryText = extractedData?.kategorie 
        ? `${t('receipts.uploadSuccessWithCategory')} "${t(getCategoryTranslationKey(extractedData.kategorie))}"`
        : t('receipts.uploadSuccess');
      showToast(categoryText, 'success', 3500);

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
              uploadedFiles={uploadedFiles}
              error={error}
            />
            
            {/* Duplicate Warning - Removed for multi-image */}
            {false && isDuplicate && uploadedFiles.length > 0 && (
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
          {uploadedFiles.length === 0 && !isExtracting && !extractedData && !extractionError && (
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
          disabled={uploadedFiles.length === 0 || isSubmitting}
          className="sm:w-auto"
        >
          <Save size={20} className="mr-2" />
          {isSubmitting ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </DashboardLayout>
  );
}
