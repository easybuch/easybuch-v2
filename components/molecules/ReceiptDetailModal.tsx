'use client';

import { useState, useEffect } from 'react';
import { X, Download, Trash2, Save, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import type { Receipt } from '@/lib/database.types';
import { cn } from '@/utils/cn';

interface ReceiptDetailModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Receipt>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  signedUrl: string | null;
}

const CATEGORIES = [
  'Büromaterial & Ausstattung',
  'Fahrtkosten (Kraftstoff & Parkplatz)',
  'Fahrtkosten (ÖPNV & Bahn)',
  'Verpflegung & Bewirtung',
  'Unterkunft & Reisen',
  'Software & Lizenzen',
  'Hardware & Elektronik',
  'Telekommunikation & Internet',
  'Marketing & Werbung',
  'Website & Online-Dienste',
  'Steuerberatung',
  'Rechtsberatung',
  'Versicherungen',
  'Miete & Nebenkosten',
  'Weiterbildung',
  'Sonstiges',
];

export const ReceiptDetailModal = ({
  receipt,
  isOpen,
  onClose,
  onSave,
  onDelete,
  signedUrl,
}: ReceiptDetailModalProps) => {
  const [formData, setFormData] = useState({
    receipt_date: '',
    category: '',
    vendor: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(receipt.id, {
        receipt_date: formData.receipt_date || null,
        category: formData.category || null,
        vendor: formData.vendor || null,
        notes: formData.notes || null,
      });
      
      // Show success toast
      setShowSuccessToast(true);
      
      // Hide toast after 2 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
      
      // Close modal after 2.5 seconds
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Error saving receipt:', error);
      alert('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

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
    if (!confirm('Möchten Sie diesen Beleg wirklich löschen?')) return;

    try {
      setIsDeleting(true);
      await onDelete(receipt.id);
      onClose();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Fehler beim Löschen');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    if (signedUrl) {
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = receipt.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] animate-fade-in animate-slide-in-from-top">
          <div className="bg-green-600 text-white px-6 py-4 rounded-button shadow-lg flex items-center gap-3">
            <CheckCircle size={24} className="flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-semibold">Erfolgreich gespeichert!</p>
              <p className="text-sm text-green-100">Ihre Änderungen wurden übernommen.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-card shadow-card-hover w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-text-primary">Beleg Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-button transition-colors"
            aria-label="Schließen"
          >
            <X size={24} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Vorschau</h3>
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
              <div className="text-sm text-text-footer">
                <p>Dateiname: {receipt.file_name}</p>
                <p>Typ: {receipt.file_type.toUpperCase()}</p>
                <p>
                  Hochgeladen:{' '}
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
              <h3 className="text-lg font-semibold text-text-primary">Beleg-Informationen</h3>

              {/* Amount Breakdown - READ ONLY */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Betragsaufschlüsselung
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-button p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Netto-Betrag:</span>
                    <span className="font-medium text-text-primary">{formatAmount(receipt.amount_net)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">
                      MwSt. {formatTaxRate(receipt.tax_rate)}:
                    </span>
                    <span className="font-medium text-text-primary">{formatAmount(receipt.amount_tax)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base pt-2 border-t border-blue-300">
                    <span className="font-semibold text-text-primary">Brutto-Betrag:</span>
                    <span className="font-bold text-lg text-brand">{formatAmount(receipt.amount_gross)}</span>
                  </div>
                </div>
                <p className="text-xs text-text-footer mt-2">
                  Beträge werden automatisch aus dem Beleg ausgelesen und können nicht manuell geändert werden.
                </p>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-text-primary mb-2">
                  Belegdatum
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
                  Kategorie
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
                  <option value="">Kategorie auswählen...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor */}
              <div>
                <label htmlFor="vendor" className="block text-sm font-medium text-text-primary mb-2">
                  Lieferant / Händler
                </label>
                <Input
                  id="vendor"
                  type="text"
                  placeholder="z.B. Amazon, Rewe, etc."
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-text-primary mb-2">
                  Notizen (optional)
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Zusätzliche Informationen..."
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="secondary"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Wird gelöscht...
              </>
            ) : (
              <>
                <Trash2 size={20} className="mr-2" />
                Löschen
              </>
            )}
          </Button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={!signedUrl || isSaving || isDeleting}
              className="w-full sm:w-auto"
            >
              <Download size={20} className="mr-2" />
              Herunterladen
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
