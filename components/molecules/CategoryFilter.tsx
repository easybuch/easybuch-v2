'use client';

import { useState } from 'react';
import { 
  Layers, 
  Briefcase, 
  Car, 
  Utensils, 
  Code,
  Wrench,
  Plane,
  GraduationCap,
  Phone,
  Lightbulb,
  Home,
  Heart,
  Scale,
  Building2,
  Users,
  PackageSearch
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { RECEIPT_CATEGORIES, getCategoryTranslationKey } from '@/lib/category-mapping';
import { cn } from '@/utils/cn';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

// Icon-Mapping für alle Kategorien
const CATEGORY_ICONS: Record<string, any> = {
  'all': Layers,
  'Büromaterial & Ausstattung': Briefcase,
  'Fahrtkosten (Kraftstoff & Parkplatz)': Car,
  'Verpflegung & Bewirtung': Utensils,
  'Software & Lizenzen': Code,
  'Hardware & IT-Zubehör': Wrench,
  'Reisekosten (Hotel, Flug, etc.)': Plane,
  'Weiterbildung & Schulungen': GraduationCap,
  'Kommunikation (Telefon, Internet)': Phone,
  'Marketing & Werbung': Lightbulb,
  'Miete & Nebenkosten': Home,
  'Versicherungen': Heart,
  'Beratung & Rechtsdienstleistungen': Scale,
  'Mitgliedschaften & Abonnements': Building2,
  'Personalkosten': Users,
  'Sonstige Betriebsausgaben': PackageSearch,
};

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);

  // Hauptkategorien (immer sichtbar)
  const mainCategories = [
    'all',
    'Büromaterial & Ausstattung',
    'Fahrtkosten (Kraftstoff & Parkplatz)',
    'Verpflegung & Bewirtung',
    'Software & Lizenzen',
  ];

  // Weitere Kategorien (bei showAll)
  const otherCategories = RECEIPT_CATEGORIES.filter(
    (cat) => !mainCategories.includes(cat)
  );

  const displayedCategories = showAll 
    ? ['all', ...RECEIPT_CATEGORIES]
    : mainCategories;

  const renderCategoryButton = (category: string) => {
    const Icon = CATEGORY_ICONS[category] || PackageSearch;
    const isSelected = value === category;
    const label = category === 'all' 
      ? t('receipts.allCategories')
      : t(getCategoryTranslationKey(category));

    return (
      <button
        key={category}
        type="button"
        onClick={() => onChange(category)}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium',
          'rounded-button transition-all duration-200 whitespace-nowrap flex-shrink-0',
          'focus:outline-none focus:ring-2 focus:ring-brand/20',
          isSelected
            ? 'bg-brand text-white shadow-sm'
            : 'bg-white text-text-secondary hover:text-text-primary hover:bg-gray-50 border border-gray-200'
        )}
      >
        <Icon size={16} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
      {/* Scrollbarer Container */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {displayedCategories.map(renderCategoryButton)}
          
          {/* Mehr/Weniger Button */}
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium',
              'rounded-button transition-all duration-200 whitespace-nowrap flex-shrink-0',
              'bg-gray-100 text-text-secondary hover:bg-gray-200',
              'focus:outline-none focus:ring-2 focus:ring-brand/20'
            )}
          >
            <span>{showAll ? 'Weniger' : `+${otherCategories.length} weitere`}</span>
          </button>
        </div>

        {/* Fade-Out Gradient (nur mobile) */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Hinweis bei "Alle" */}
      {value === 'all' && (
        <p className="mt-3 text-xs text-text-tertiary">
          Zeige alle Belege aus allen Kategorien
        </p>
      )}
    </div>
  );
}