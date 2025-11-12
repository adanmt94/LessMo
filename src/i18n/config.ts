/**
 * Configuración de i18next para multilenguaje
 * Detecta automáticamente el idioma del dispositivo
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Archivos de traducción
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import de from './de.json';
import pt from './pt.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
};

// Detectar idioma del dispositivo
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    lng: deviceLanguage, // Idioma inicial basado en el dispositivo
    fallbackLng: 'en', // Idioma por defecto si no se encuentra el del dispositivo
    interpolation: {
      escapeValue: false, // React ya protege contra XSS
    },
  });

export default i18n;
