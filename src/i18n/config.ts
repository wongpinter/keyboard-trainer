import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Note: Translation files are loaded via HTTP backend
// Files should be placed in public/locales/{language}/{namespace}.json

// Language detection options
const detectionOptions = {
  // Order of language detection methods
  order: ['localStorage', 'navigator', 'htmlTag'],
  
  // Keys for localStorage
  lookupLocalStorage: 'keyboard-trainer-language',
  
  // Cache user language
  caches: ['localStorage'],
  
  // Don't use cookies for language detection
  excludeCacheFor: ['cimode'],
  
  // Check all available languages
  checkWhitelist: true,
};

i18n
  // Load translation using http backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language
    fallbackLng: 'en',
    
    // Default namespace
    defaultNS: 'common',
    
    // Available languages
    supportedLngs: ['en', 'id'],
    
    // Language detection
    detection: detectionOptions,
    
    // Debug mode (only in development)
    debug: import.meta.env.DEV,
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
    },
    
    // React options
    react: {
      useSuspense: false, // Disable suspense for better error handling
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
    },
    
    // Backend options for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Namespace separation
    nsSeparator: ':',
    keySeparator: '.',
    
    // Return objects for nested keys
    returnObjects: false,
    
    // Return key for missing translations in development, fallback in production
    returnEmptyString: false,
    returnNull: false,
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Save missing keys (only in development)
    saveMissing: import.meta.env.DEV,
    saveMissingTo: 'current',
    
    // Missing key handler for development
    missingKeyHandler: import.meta.env.DEV
      ? (lngs: readonly string[], ns: string, key: string, fallbackValue: string) => {
          console.warn(`Missing translation key: ${ns}:${key} for languages: ${lngs.join(', ')}`);
        }
      : undefined,
  });

// Export configured i18n instance
export default i18n;

// Export types for better TypeScript support
export type SupportedLanguages = 'en' | 'id';
export type TranslationNamespaces = 'common' | 'auth' | 'training' | 'errors' | 'statistics';

// Language configuration
export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
  },
} as const;

// Helper function to get current language info
export const getCurrentLanguageInfo = () => {
  const currentLang = i18n.language as SupportedLanguages;
  return LANGUAGES[currentLang] || LANGUAGES.en;
};

// Helper function to change language
export const changeLanguage = async (language: SupportedLanguages) => {
  try {
    await i18n.changeLanguage(language);
    // Update HTML lang attribute
    document.documentElement.lang = language;
    return true;
  } catch (error) {
    console.error('Failed to change language:', error);
    return false;
  }
};

// Initialize HTML lang attribute on app start
export const initializeLanguage = () => {
  const currentLang = i18n.language as SupportedLanguages;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLang;
  }
};

// Set up language change listener to update HTML lang attribute
i18n.on('languageChanged', (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});
