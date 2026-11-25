import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";
import { translations } from "./translations";

type Language = "en" | "de";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Constants for better maintainability
const LANGUAGE_STORAGE_KEY = "alma-language";
const DEFAULT_LANGUAGE: Language = "de";

// Helper function to safely get language from localStorage
const getStoredLanguage = (): Language => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    // Force German as default for new users
    if (!stored) {
      return DEFAULT_LANGUAGE;
    }
    if (stored === "en" || stored === "de") {
      return stored as Language;
    }
  } catch (error) {
    console.warn("Failed to read language from localStorage:", error);
  }
  
  return DEFAULT_LANGUAGE;
};

// Helper function to safely set language in localStorage
const setStoredLanguage = (language: Language): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn("Failed to save language to localStorage:", error);
  }
};

// Helper function to clear language from localStorage (for testing)
const clearStoredLanguage = (): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear language from localStorage:", error);
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(getStoredLanguage);

  // Memoized function to update language and persist to localStorage
  const handleSetLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
    setStoredLanguage(newLanguage);
  }, []);

  // Memoized translation function
  const t = useCallback((key: string): string => {
    const langTranslations = translations[language];
    // Check if key exists in translations (even if value is empty string)
    const hasTranslation = key in langTranslations;
    const translation = langTranslations[key as keyof typeof langTranslations];
    
    if (!hasTranslation) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      // Fallback to English if translation is missing
      const enTranslation = translations.en[key as keyof typeof translations.en];
      return enTranslation || key;
    }
    // Return translation even if it's an empty string (intentional)
    return translation;
  }, [language]);

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LANGUAGE_STORAGE_KEY && e.newValue) {
        const newLanguage = e.newValue as Language;
        if (newLanguage === "en" || newLanguage === "de") {
          setLanguage(newLanguage);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t,
  }), [language, handleSetLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
