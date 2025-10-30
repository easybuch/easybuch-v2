'use client';

import { useState, useEffect } from 'react';
import { X, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useLanguage } from '@/lib/language-context';
import { RECEIPT_CATEGORIES, getCategoryTranslationKey } from '@/lib/category-mapping';
import type { Receipt } from '@/lib/database.types';
import { cn } from '@/utils/cn';

interface ReceiptDetailModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  signedUrl: string | null;
  signedUrls?: string[] | null; // For multi-image receipts
}


export const ReceiptDetailModal = ({
  receipt,
  isOpen,
  onClose,
  onDelete,
  signedUrl,
  signedUrls,
}: ReceiptDetailModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    receipt_date: '',
    category: '',
    vendor: '',
    notes: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (receipt) {
      setFormData({
        receipt_date: receipt.receipt_date || '',
        category: receipt.category || '',
        vendor: receipt.vendor || '',
        notes: receipt.notes || '',
      });
    }
  }, [receipt]);

  if (!isOpen || !receipt) return null;


  const formatAmount = (amount: number | null) => {
    if (amount === null || amount === undefined) return '—';
    // Format with thousands separator (German format)
    return amount.toLocaleString('de-DE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + ' €';
  };

  const formatTaxRate = (rate: number | null) => {
    if (rate === null || rate === undefined) return '';
    return `(${rate}%)`;
  };

  const handleDelete = async () => {
    if (!confirm(t('common.delete'))) return;

    try {
      setIsDeleting(true);
      await onDelete(receipt.id);
      onClose();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert(t('receipts.uploadError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    // Multi-image: Download all images sequentially
    if (signedUrls && signedUrls.length > 1) {
      for (let i = 0; i < signedUrls.length; i++) {
        const url = signedUrls[i];
        const link = document.createElement('a');
        link.href = url;
        link.download = `${receipt.file_name.split('.')[0]}_Teil${i + 1}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Wait 300ms between downloads to avoid browser blocking
        if (i < signedUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } else if (signedUrl) {
      // Single image: Open in new tab
      window.open(signedUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-card shadow-card-hover w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-text-primary">{t('receipts.receiptDetails')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-button transition-colors"
            aria-label={t('common.close')}
          >
            <X size={24} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">{t('receipts.viewDetails')}</h3>
              
              {/* Multi-image display */}
              {signedUrls && signedUrls.length > 1 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto p-2">
                    {signedUrls.map((url, index) => (
                      <div key={index} className="border-2 border-brand rounded-button overflow-hidden bg-white">
                        <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center p-2">
                          <img
                            src={url}
                            alt={`Teil ${index + 1}`}
                            className="max-w-full max-h-full object-contain rounded"
                          />
                        </div>
                        <div className="p-2 bg-gray-50 border-t border-gray-200">
                          <p className="text-xs text-text-footer text-center font-medium">Teil {index + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Single image display */
                <div className="bg-gray-50 rounded-card p-4 min-h-[400px] flex items-center justify-center">
                  {signedUrl ? (
                    receipt.file_type === 'pdf' ? (
                      <iframe
                        src={signedUrl}
                        className="w-full h-[600px] rounded-card"
                        title="PDF Preview"
                      />
                    ) : (
                      <img
                        src={signedUrl}
                        alt={receipt.file_name}
                        className="max-w-full max-h-[600px] object-contain rounded-card"
                      />
                    )
                  ) : (
                    <Loader2 size={48} className="text-brand animate-spin" />
                  )}
                </div>
              )}
              
              <div className="text-sm text-text-footer">
                <p>{receipt.file_name}</p>
                <p>{receipt.file_type.toUpperCase()}</p>
                <p>
                  {new Date(receipt.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">{t('receipts.extractedData')}</h3>

              {/* Amount Breakdown - READ ONLY */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('receipts.amountBreakdown')}
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-button p-4 space-y-2">
                  {/* Check if mixed VAT rates exist */}
                  {(receipt.vat_7_net || receipt.vat_19_net) ? (
                    <>
                      {/* 7% VAT Section */}
                      {receipt.vat_7_net && (
                        <div className="space-y-1 pb-2">
                          <div className="flex justify-between items-center text-xs text-text-footer font-semibold">
                            <span>{t('receipts.vat7Rate')}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary pl-2">{t('receipts.amountNet')}:</span>
                            <span className="font-medium text-text-primary">{formatAmount(receipt.vat_7_net)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary pl-2">{t('receipts.amountTax')} (7%):</span>
                            <span className="font-medium text-text-primary">{formatAmount(receipt.vat_7_tax)}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 19% VAT Section */}
                      {receipt.vat_19_net && (
                        <div className="space-y-1 pb-2 border-t border-blue-300 pt-2">
                          <div className="flex justify-between items-center text-xs text-text-footer font-semibold">
                            <span>{t('receipts.vat19Rate')}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary pl-2">{t('receipts.amountNet')}:</span>
                            <span className="font-medium text-text-primary">{formatAmount(receipt.vat_19_net)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary pl-2">{t('receipts.amountTax')} (19%):</span>
                            <span className="font-medium text-text-primary">{formatAmount(receipt.vat_19_tax)}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Total Section */}
                      <div className="flex justify-between items-center text-base pt-2 border-t-2 border-blue-400">
                        <span className="font-semibold text-text-primary">{t('receipts.amountGross')}:</span>
                        <span className="font-bold text-lg text-brand">{formatAmount(receipt.amount_gross)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Simple receipt with single VAT rate */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">{t('receipts.amountNet')}:</span>
                        <span className="font-medium text-text-primary">{formatAmount(receipt.amount_net)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">
                          {t('receipts.amountTax')} {formatTaxRate(receipt.tax_rate)}:
                        </span>
                        <span className="font-medium text-text-primary">{formatAmount(receipt.amount_tax)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base pt-2 border-t border-blue-300">
                        <span className="font-semibold text-text-primary">{t('receipts.amountGross')}:</span>
                        <span className="font-bold text-lg text-brand">{formatAmount(receipt.amount_gross)}</span>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-text-footer mt-2">
                  {t('receipts.amountReadOnly')}
                </p>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-text-primary mb-2">
                  {t('receipts.receiptDate')}
                </label>
                <Input
                  id="date"
                  type="date"
                  value={formData.receipt_date}
                  onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-2">
                  {t('receipts.category')}
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 rounded-button border border-gray-300',
                    'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
                    'text-text-primary bg-white transition-all'
                  )}
                >
                  <option value="">{t('receipts.category')}</option>
                  {RECEIPT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(getCategoryTranslationKey(cat))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor */}
              <div>
                <label htmlFor="vendor" className="block text-sm font-medium text-text-primary mb-2">
                  {t('receipts.merchant')}
                </label>
                <Input
                  id="vendor"
                  type="text"
                  placeholder={t('receipts.merchant')}
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-text-primary mb-2">
                  {t('receipts.notes')}
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder={t('receipts.notes')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 rounded-button border border-gray-300',
                    'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
                    'text-text-primary bg-white transition-all resize-none'
                  )}
                />
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={!signedUrl || isDeleting}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            <Download size={20} className="mr-2" />
            {t('common.download')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {isDeleting ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Trash2 size={20} className="mr-2" />
                {t('common.delete')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
