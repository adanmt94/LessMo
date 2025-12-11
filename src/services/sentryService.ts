/**
 * Sentry Error Tracking Service
 * Configuración y utilidades para tracking de errores en producción
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// DSN de Sentry (reemplazar con tu DSN real de Sentry.io)
const SENTRY_DSN = process.env.SENTRY_DSN || 'https://your-dsn@sentry.io/your-project';

// Inicializar Sentry
export const initSentry = () => {
  // Solo en producción
  if (__DEV__) {
    
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment
    environment: __DEV__ ? 'development' : 'production',
    
    // Release tracking
    // release: 'lessmo@1.1.0', // Sincronizar con app.json
    
    // Sample rate para performance monitoring
    tracesSampleRate: 1.0, // 100% en producción, ajustar según necesidad
    
    // Habilitar tracking de sesiones
    enableAutoSessionTracking: true,
    
    // Session tracking interval (30 segundos)
    sessionTrackingIntervalMillis: 30000,
    
    // Native crash handling
    enableNative: true,
    enableNativeCrashHandling: true,
    
    // Breadcrumbs automáticos
    enableAutoPerformanceTracking: true,
    enableOutOfMemoryTracking: true,
    
    // Filtrar información sensible
    beforeSend(event, hint) {
      // No enviar errores en desarrollo
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
            // Eliminar campos sensibles
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
    
    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Tracking de navegación
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        
        // Tracking de requests HTTP
        tracingOrigins: ['localhost', 'lessmo.app', /^\//],
      }),
    ],
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
 * Iniciar transacción de performance
 */
export const startTransaction = (name: string, op: string) => {
  if (__DEV__) {
    return null;
  }

  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Hook para wrappear componentes con error boundary
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC para wrappear navegación
 */
export const withProfiler = Sentry.withProfiler;

// Exportar namespace completo
export default Sentry;
