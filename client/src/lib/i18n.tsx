import React, { createContext, useState, useEffect } from 'react';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

type Language = 'en' | 'ar';
type Translations = Record<string, any>;

interface I18nContextType {
  language: Language;
  translations: Translations;
  t: (key: string, fallback?: string) => string;
  toggleLanguage: () => void;
  isRTL: boolean;
}

export const I18nContext = createContext<I18nContextType | null>(null);

const translationMap: Record<Language, Translations> = {
  en: enTranslations,
  ar: arTranslations,
};

function getNestedTranslation(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => {
    return current && current[key] ? current[key] : undefined;
  }, obj);
}

function translate(translations: Translations, key: string, fallback?: string): string {
  const translation = getNestedTranslation(translations, key);
  return translation || fallback || key;
}

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Get saved language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Apply RTL to document
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.classList.remove('rtl');
    }

    // Save language preference
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const translations = translationMap[language];
  const t = (key: string, fallback?: string) => translate(translations, key, fallback);
  const isRTL = language === 'ar';

  const value: I18nContextType = {
    language,
    translations,
    t,
    toggleLanguage,
    isRTL,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
