import React, { createContext, useContext, useEffect } from 'react';
import { translations } from '../i18n/translations';

interface LanguageContextType {
  language: 'en';
  setLanguage: (lang: 'en') => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Clear any previously saved language preferences so the site is strictly English
    if (localStorage.getItem('docrx_lang')) {
      localStorage.removeItem('docrx_lang');
    }
  }, []);

  const setLanguage = () => {
    // English only
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language: 'en', setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

