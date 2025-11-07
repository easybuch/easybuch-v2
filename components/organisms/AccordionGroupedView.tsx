'use client';

import { useState } from 'react';
import { Receipt as ReceiptIcon } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { getCategoryTranslationKey } from '@/lib/category-mapping';
import type { Receipt } from '@/lib/database.types';
import { cn } from '@/utils/cn';

interface AccordionGroupedViewProps {
  receipts: Receipt[];
  onViewReceipt: (receipt: Receipt) => void;
}

interface CategoryGroup {
  category: string;
  receipts: Receipt[];
  total: number;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'Büromaterial & Ausstattung': 'from-blue-500 to-blue-600',
  'Fahrtkosten (Kraftstoff & Parkplatz)': 'from-green-500 to-green-600',
  'Fahrtkosten (ÖPNV & Bahn)': 'from-emerald-500 to-emerald-600',
  'Verpflegung & Bewirtung': 'from-orange-500 to-orange-600',
  'Unterkunft & Reisen': 'from-purple-500 to-purple-600',
  'Software & Lizenzen': 'from-indigo-500 to-indigo-600',
  'Hardware & Elektronik': 'from-slate-500 to-slate-600',
  'Telekommunikation & Internet': 'from-cyan-500 to-cyan-600',
  'Marketing & Werbung': 'from-pink-500 to-pink-600',
  'Website & Online-Dienste': 'from-violet-500 to-violet-600',
  'Steuerberatung': 'from-amber-500 to-amber-600',
  'Rechtsberatung': 'from-red-500 to-red-600',
  'Versicherungen': 'from-teal-500 to-teal-600',
  'Miete & Nebenkosten': 'from-lime-500 to-lime-600',
  'Weiterbildung': 'from-fuchsia-500 to-fuchsia-600',
  'Sonstiges': 'from-gray-500 to-gray-600',
};

export function AccordionGroupedView({ receipts, onViewReceipt }: AccordionGroupedViewProps) {
  const { t } = useLanguage();
  const [showMoreCategories, setShowMoreCategories] = useState<Set<string>>(new Set());

  // Gruppiere Belege nach Kategorie
  const groupedReceipts: CategoryGroup[] = receipts.reduce((acc, receipt) => {
    const category = receipt.category || 'Sonstiges';
    const existingGroup = acc.find((g) => g.category === category);
    
    if (existingGroup) {
      existingGroup.receipts.push(receipt);
      existingGroup.total += receipt.amount_gross || 0;
    } else {
      acc.push({
        category,
        receipts: [receipt],
        total: receipt.amount_gross || 0,
      });
    }
    
    return acc;
  }, [] as CategoryGroup[]);

  // Sortiere nach Gesamtbetrag (höchster zuerst)
  groupedReceipts.sort((a, b) => b.total - a.total);

  const toggleShowMore = (category: string) => {
    setShowMoreCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (groupedReceipts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {groupedReceipts.map((group) => {
        const showAll = showMoreCategories.has(group.category);
        const visibleReceipts = showAll ? group.receipts : group.receipts.slice(0, 3);
        const hasMore = group.receipts.length > 3;
        const gradientClass = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS['Sonstiges'];

        return (
          <div 
            key={group.category} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
          >
            {/* Category Header - Non-clickable */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Color Indicator */}
                <div className={cn(
                  'w-1 h-12 rounded-full bg-gradient-to-b',
                  gradientClass
                )} />
                
                <div className="text-left">
                  <h3 className="text-base font-semibold text-text-primary">
                    {t(getCategoryTranslationKey(group.category))}
                  </h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {group.receipts.length} {group.receipts.length === 1 ? t('receipts.receiptSingular') : t('receipts.receiptPlural')}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-text-primary">
                  {group.total.toLocaleString('de-DE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  €
                </div>
              </div>
            </div>

            {/* Content - Always visible */}
            <div className="border-t border-gray-100">
              <div className="px-5 py-3 space-y-2">
                {visibleReceipts.map((receipt, index) => (
                  <div
                    key={receipt.id}
                    className="group/item relative"
                  >
                    {/* Timeline Connector */}
                    {index !== visibleReceipts.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-0 w-px bg-gray-200" />
                    )}
                    
                    <button
                      type="button"
                      onClick={() => onViewReceipt(receipt)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      {/* Timeline Dot */}
                      <div className="relative flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 group-hover/item:border-brand flex items-center justify-center transition-colors">
                          <ReceiptIcon size={14} className="text-text-tertiary group-hover/item:text-brand transition-colors" />
                        </div>
                      </div>

                      {/* Receipt Info */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-text-primary truncate group-hover/item:text-brand transition-colors">
                              {receipt.vendor || receipt.file_name}
                            </div>
                            <div className="text-xs text-text-tertiary mt-1">
                              {receipt.receipt_date
                                ? formatDate(receipt.receipt_date)
                                : formatDate(receipt.created_at)}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="font-semibold text-sm text-text-primary">
                              {receipt.amount_gross
                                ? `${receipt.amount_gross.toLocaleString('de-DE', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} €`
                                : '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              {/* Show More / Show Less */}
              {hasMore && (
                <div className="px-5 pb-3">
                  <button
                    type="button"
                    onClick={() => toggleShowMore(group.category)}
                    className="w-full py-2 text-xs font-medium text-brand hover:text-brand-dark transition-colors"
                  >
                    {showAll 
                      ? `− ${t('receipts.showLessReceipts')}`
                      : `+ ${group.receipts.length - 3} ${t('receipts.showMoreReceipts')}`
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
