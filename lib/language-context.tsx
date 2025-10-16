'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import de from '@/messages/de.json';
import ru from '@/messages/ru.json';

type Locale = 'de' | 'ru';
type Messages = typeof de;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const messages: Record<Locale, Messages> = {
  de,
  ru,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('de');

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'de' || savedLocale === 'ru')) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  // Translation function with nested key support
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
