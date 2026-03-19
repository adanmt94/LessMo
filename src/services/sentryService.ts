/**
 * Sentry Error Tracking Service
 * Configuración y utilidades para tracking de errores en producción
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// DSN de Sentry desde variables de entorno
const SENTRY_DSN = process.env.SENTRY_DSN || Constants.expoConfig?.extra?.SENTRY_DSN || '';

/**
 * Inicializar Sentry - llamar en App.tsx antes de cualquier renderizado
 */
export const initSentry = () => {
  if (__DEV__) {
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('⚠️ Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 1.0,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    enableNative: true,
    enableNativeCrashHandling: true,

    beforeSend(event) {
      if (__DEV__) {
        return null;
      }

      // Filtrar información sensible de URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/token=[^&]+/, 'token=REDACTED');
      }

      // Filtrar datos sensibles de breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            const sanitized = { ...breadcrumb.data };
            delete sanitized.password;
            delete sanitized.email;
            delete sanitized.token;
            delete sanitized.apiKey;
            return { ...breadcrumb, data: sanitized };
          }
          return breadcrumb;
        });
      }

      return event;
    },
  });
};

/**
 * Capturar error manualmente
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (__DEV__) {
    console.error('🐛 [DEV] Error capturado:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
    tags: {
      platform: Platform.OS,
    },
  });
};

/**
 * Capturar mensaje/warning
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (__DEV__) {
    
    return;
  }

  Sentry.captureMessage(message, level);
};

/**
 * Añadir breadcrumb manual
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Setear contexto de usuario
 */
export const setUserContext = (user: {
  id: string;
  email?: string;
  username?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

/**
 * Limpiar contexto de usuario (al logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Setear tags personalizados
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Setear contexto adicional
 */
export const setContext = (key: string, context: Record<string, any>) => {
  Sentry.setContext(key, context);
};

/**
 * Error Boundary de Sentry para componentes React
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Wrap del componente raíz con Sentry
 */
export const wrap = Sentry.wrap;

export default Sentry;
