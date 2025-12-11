/**
 * Sistema de analytics para rastrear eventos en la aplicación
 */

import { logger, LogCategory } from './logger';

interface AnalyticsEvent {
  name: string;
  category: string;
  timestamp: Date;
  properties?: Record<string, any>;
  userId?: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 500;
  private enabled = __DEV__; // Solo en desarrollo por ahora
  private userId?: string;

  /**
   * Configurar usuario actual
   */
  setUserId(userId: string | undefined): void {
    this.userId = userId;
    logger.info(LogCategory.API, 'Analytics - Usuario configurado', { userId });
  }

  /**
   * Rastrear evento
   */
  track(name: string, category: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name,
      category,
      timestamp: new Date(),
      properties,
      userId: this.userId,
    };

    this.events.push(event);

    // Mantener límite
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    logger.debug(LogCategory.API, `📊 Analytics - ${name}`, properties);
  }

  /**
   * Obtener historial de eventos
   */
  getEvents(category?: string): AnalyticsEvent[] {
    if (category) {
      return this.events.filter(e => e.category === category);
    }
    return this.events;
  }

  /**
   * Limpiar historial
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Habilitar/deshabilitar analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Exportar eventos como JSON
   */
  export(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Obtener estadísticas de uso
   */
  getStats(): {
    totalEvents: number;
    byCategory: Record<string, number>;
    byEventName: Record<string, number>;
    uniqueUsers: number;
  } {
    const byCategory: Record<string, number> = {};
    const byEventName: Record<string, number> = {};
    const users = new Set<string>();

    this.events.forEach(event => {
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;
      byEventName[event.name] = (byEventName[event.name] || 0) + 1;
      if (event.userId) {
        users.add(event.userId);
      }
    });

    return {
      totalEvents: this.events.length,
      byCategory,
      byEventName,
      uniqueUsers: users.size,
    };
  }
}

// Instancia singleton
export const analytics = new Analytics();

/**
 * Eventos predefinidos para consistencia
 */
export const AnalyticsEvents = {
  // Autenticación
  USER_LOGIN: 'user_login',
  USER_REGISTER: 'user_register',
  USER_LOGOUT: 'user_logout',
  GOOGLE_SIGNIN: 'google_signin',
  
  // Eventos
  EVENT_CREATE: 'event_create',
  EVENT_VIEW: 'event_view',
  EVENT_EDIT: 'event_edit',
  EVENT_DELETE: 'event_delete',
  EVENT_JOIN: 'event_join',
  EVENT_SHARE: 'event_share',
  
  // Eventos
  GROUP_CREATE: 'group_create',
  GROUP_VIEW: 'group_view',
  GROUP_EDIT: 'group_edit',
  GROUP_DELETE: 'group_delete',
  GROUP_JOIN: 'group_join',
  GROUP_SHARE: 'group_share',
  
  // Gastos
  EXPENSE_ADD: 'expense_add',
  EXPENSE_EDIT: 'expense_edit',
  EXPENSE_DELETE: 'expense_delete',
  EXPENSE_VIEW: 'expense_view',
  
  // Participantes
  PARTICIPANT_ADD: 'participant_add',
  PARTICIPANT_REMOVE: 'participant_remove',
  
  // Fotos
  PHOTO_UPLOAD: 'photo_upload',
  PHOTO_DELETE: 'photo_delete',
  PHOTO_OCR: 'photo_ocr',
  
  // Chat
  MESSAGE_SEND: 'message_send',
  MESSAGE_VIEW: 'message_view',
  
  // Navegación
  SCREEN_VIEW: 'screen_view',
  TAB_CHANGE: 'tab_change',
  
  // Configuración
  THEME_CHANGE: 'theme_change',
  LANGUAGE_CHANGE: 'language_change',
  CURRENCY_CHANGE: 'currency_change',
  
  // Exportación
  EXPORT_EXCEL: 'export_excel',
  EXPORT_PDF: 'export_pdf',
  
  // Notificaciones
  NOTIFICATION_SEND: 'notification_send',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',
  
  // Errores
  ERROR_OCCURRED: 'error_occurred',
} as const;

/**
 * Categorías de eventos
 */
export const AnalyticsCategory = {
  AUTH: 'Authentication',
  EVENT: 'Event',
  GROUP: 'Group',
  EXPENSE: 'Expense',
  PARTICIPANT: 'Participant',
  PHOTO: 'Photo',
  CHAT: 'Chat',
  NAVIGATION: 'Navigation',
  SETTINGS: 'Settings',
  EXPORT: 'Export',
  NOTIFICATION: 'Notification',
  ERROR: 'Error',
} as const;

/**
 * Hook de React para analytics
 */
export function useAnalytics() {
  const trackEvent = (
    name: string,
    category: string,
    properties?: Record<string, any>
  ) => {
    analytics.track(name, category, properties);
  };

  const trackScreen = (screenName: string) => {
    analytics.track(AnalyticsEvents.SCREEN_VIEW, AnalyticsCategory.NAVIGATION, {
      screenName,
    });
  };

  const trackError = (error: any, context?: string) => {
    analytics.track(AnalyticsEvents.ERROR_OCCURRED, AnalyticsCategory.ERROR, {
      error: error.message || String(error),
      context,
    });
  };

  return {
    trackEvent,
    trackScreen,
    trackError,
  };
}

/**
 * Wrapper para rastrear automáticamente navegación
 */
export function trackScreenView(screenName: string): void {
  analytics.track(AnalyticsEvents.SCREEN_VIEW, AnalyticsCategory.NAVIGATION, {
    screenName,
  });
}

/**
 * Timing para medir duración de operaciones
 */
export class PerformanceTimer {
  private startTime: number;
  private eventName: string;
  private properties?: Record<string, any>;

  constructor(eventName: string, properties?: Record<string, any>) {
    this.eventName = eventName;
    this.properties = properties;
    this.startTime = Date.now();
  }

  end(): void {
    const duration = Date.now() - this.startTime;
    analytics.track(this.eventName, AnalyticsCategory.NAVIGATION, {
      ...this.properties,
      duration_ms: duration,
    });
  }
}
