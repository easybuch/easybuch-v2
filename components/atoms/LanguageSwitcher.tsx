'use client';

import { Globe } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLanguage } from '@/lib/language-context';

export interface LanguageSwitcherProps {
  className?: string;
}

const languages = [
  { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
];

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  const handleLanguageChange = (newLocale: 'de' | 'ru') => {
    setLocale(newLocale);
  };

  const currentLanguage = languages.find((lang) => lang.code === locale);

  return (
    <div className={cn('relative group', className)}>
      <button
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-button transition-colors"
        aria-label="Sprache wechseln"
      >
        <Globe size={18} className="text-text-secondary" />
        <span className="text-sm font-medium text-text-primary hidden md:block">
          {currentLanguage?.flag} {currentLanguage?.label}
        </span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-40 bg-white rounded-button shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2',
              locale === lang.code && 'bg-brand/10 text-brand font-medium'
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
