/**
 * useLanguage - Hook para manejar el idioma de la aplicación
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@LessMo:language';

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

export const useLanguage = () => {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    AVAILABLE_LANGUAGES.find(lang => lang.code === i18n.language) || AVAILABLE_LANGUAGES[0]
  );

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  useEffect(() => {
    const lang = AVAILABLE_LANGUAGES.find(lang => lang.code === i18n.language);
    if (lang) {
      setCurrentLanguage(lang);
    }
  }, [i18n.language]);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        console.log('📱 Idioma guardado encontrado:', savedLanguage);
        await i18n.changeLanguage(savedLanguage);
      } else {
        // Autodetectar idioma del dispositivo
        const deviceLanguage = i18n.language || 'es';
        const languageCode = deviceLanguage.split('-')[0]; // 'es-ES' -> 'es'
        const supportedLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
        
        if (supportedLanguage) {
          console.log('🌍 Autodetectado idioma del dispositivo:', supportedLanguage.code);
          await i18n.changeLanguage(supportedLanguage.code);
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, supportedLanguage.code);
        } else {
          console.log('📱 Idioma no soportado, usando español por defecto');
        }
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    try {
      console.log('🌍 useLanguage.changeLanguage - Iniciando cambio a:', languageCode);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      console.log('💾 useLanguage.changeLanguage - Guardado en AsyncStorage');
      await i18n.changeLanguage(languageCode);
      console.log('🔄 useLanguage.changeLanguage - i18n.changeLanguage ejecutado');
      const lang = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
      if (lang) {
        setCurrentLanguage(lang);
        console.log('✅ useLanguage.changeLanguage - Completado. Nuevo idioma:', lang);
      }
    } catch (error) {
      console.error('❌ Error changing language:', error);
    }
  };

  return {
    currentLanguage,
    availableLanguages: AVAILABLE_LANGUAGES,
    changeLanguage,
    t,
  };
};
