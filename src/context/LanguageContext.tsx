/**
 * LanguageContext - COMPLETAMENTE NUEVO
 * Sistema de idiomas que GARANTIZA actualización de UI
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import es from '../i18n/es.json';
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';
import de from '../i18n/de.json';
import pt from '../i18n/pt.json';

const LANGUAGE_STORAGE_KEY = '@LessMo:language_v2';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
];

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, options?: any) => string;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Crear instancia de i18n
const i18n = new I18n({
  es,
  en,
  fr,
  de,
  pt,
});

// Configurar fallback
i18n.enableFallback = true;
i18n.defaultLocale = 'es';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(AVAILABLE_LANGUAGES[0]);
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    loadLanguage();
  }, []);

  useEffect(() => {
    i18n.locale = locale;
  }, [locale]);

  const loadLanguage = async () => {
    try {
      // Intentar cargar idioma guardado
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (saved) {
        console.log('🌍 Idioma guardado encontrado:', saved);
        const lang = AVAILABLE_LANGUAGES.find(l => l.code === saved);
        if (lang) {
          setCurrentLanguage(lang);
          setLocale(saved);
          i18n.locale = saved;
          return;
        }
      }

      // Auto-detectar idioma del dispositivo
      const deviceLocales = Localization.getLocales();
      const deviceLang = deviceLocales[0]?.languageCode || 'es';
      console.log('🌍 Idioma del dispositivo:', deviceLang);
      
      const supportedLang = AVAILABLE_LANGUAGES.find(l => l.code === deviceLang);
      if (supportedLang) {
        setCurrentLanguage(supportedLang);
        setLocale(supportedLang.code);
        i18n.locale = supportedLang.code;
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, supportedLang.code);
      }
    } catch (error) {
      console.error('❌ Error loading language:', error);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    try {
      console.log('🔄 Cambiando idioma a:', languageCode);
      
      const lang = AVAILABLE_LANGUAGES.find(l => l.code === languageCode);
      if (!lang) {
        throw new Error(`Idioma ${languageCode} no soportado`);
      }

      // Guardar en AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      console.log('💾 Idioma guardado en AsyncStorage');

      // Actualizar estado (esto fuerza re-render de TODA la app)
      setCurrentLanguage(lang);
      setLocale(languageCode);
      i18n.locale = languageCode;

      console.log('✅ Idioma cambiado exitosamente a:', lang.nativeName);
    } catch (error) {
      console.error('❌ Error changing language:', error);
      throw error;
    }
  };

  const t = (key: string, options?: any): string => {
    try {
      return i18n.t(key, { ...options, locale });
    } catch (error) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        availableLanguages: AVAILABLE_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
