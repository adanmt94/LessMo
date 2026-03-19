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

// Detectar idioma del dispositivo con región
const locale = Localization.getLocales()[0];
let deviceLanguage = locale?.languageCode || 'en';

// Si es español y la región es España, asegurar que sea 'es'
// Si detecta 'es-ES', 'es-MX', etc., todos usarán 'es'
if (deviceLanguage.startsWith('es')) {
  deviceLanguage = 'es';
}

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    lng: deviceLanguage, // Idioma inicial basado en el dispositivo
    fallbackLng: 'es', // Cambiado a español como fallback por defecto
    interpolation: {
      escapeValue: false, // React ya protege contra XSS
    },
  });

export default i18n;
