/**
 * Utilidades para manejo de fechas y tiempo
 */

import { logger, LogCategory } from './logger';

/**
 * Formatear fecha según idioma
 */
export function formatDate(
  date: Date | string | number,
  language: 'es' | 'en' = 'es',
  format: 'short' | 'long' | 'full' = 'short'
): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      logger.warn(LogCategory.UI, 'Fecha inválida', { date });
      return 'Fecha inválida';
    }

    const locale = language === 'es' ? 'es-ES' : 'en-US';

    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      case 'long':
        return dateObj.toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      case 'full':
        return dateObj.toLocaleDateString(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      default:
        return dateObj.toLocaleDateString(locale);
    }
  } catch (error) {
    logger.error(LogCategory.UI, 'Error formateando fecha', error);
    return 'Error';
  }
}

/**
 * Formatear hora
 */
export function formatTime(
  date: Date | string | number,
  language: 'es' | 'en' = 'es',
  includeSeconds: boolean = false
): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Hora inválida';
    }

    const locale = language === 'es' ? 'es-ES' : 'en-US';

    return dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
    });
  } catch (error) {
    logger.error(LogCategory.UI, 'Error formateando hora', error);
    return 'Error';
  }
}

/**
 * Formatear fecha y hora
 */
export function formatDateTime(
  date: Date | string | number,
  language: 'es' | 'en' = 'es'
): string {
  return `${formatDate(date, language)} ${formatTime(date, language)}`;
}

/**
 * Obtener tiempo relativo (hace X minutos/horas/días)
 */
export function getRelativeTime(
  date: Date | string | number,
  language: 'es' | 'en' = 'es'
): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const texts = {
      es: {
        justNow: 'Justo ahora',
        secondsAgo: (n: number) => `hace ${n} segundo${n !== 1 ? 's' : ''}`,
        minutesAgo: (n: number) => `hace ${n} minuto${n !== 1 ? 's' : ''}`,
        hoursAgo: (n: number) => `hace ${n} hora${n !== 1 ? 's' : ''}`,
        daysAgo: (n: number) => `hace ${n} día${n !== 1 ? 's' : ''}`,
      },
      en: {
        justNow: 'Just now',
        secondsAgo: (n: number) => `${n} second${n !== 1 ? 's' : ''} ago`,
        minutesAgo: (n: number) => `${n} minute${n !== 1 ? 's' : ''} ago`,
        hoursAgo: (n: number) => `${n} hour${n !== 1 ? 's' : ''} ago`,
        daysAgo: (n: number) => `${n} day${n !== 1 ? 's' : ''} ago`,
      },
    };

    const t = texts[language];

    if (diffSeconds < 10) return t.justNow;
    if (diffSeconds < 60) return t.secondsAgo(diffSeconds);
    if (diffMinutes < 60) return t.minutesAgo(diffMinutes);
    if (diffHours < 24) return t.hoursAgo(diffHours);
    if (diffDays < 7) return t.daysAgo(diffDays);

    return formatDate(dateObj, language);
  } catch (error) {
    logger.error(LogCategory.UI, 'Error calculando tiempo relativo', error);
    return '';
  }
}

/**
 * Verificar si es hoy
 */
export function isToday(date: Date | string | number): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Verificar si es ayer
 */
export function isYesterday(date: Date | string | number): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Verificar si está en el pasado
 */
export function isPast(date: Date | string | number): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getTime() < Date.now();
}

/**
 * Verificar si está en el futuro
 */
export function isFuture(date: Date | string | number): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getTime() > Date.now();
}

/**
 * Agregar días a una fecha
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Agregar horas a una fecha
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Obtener inicio del día
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtener fin del día
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Obtener diferencia en días entre dos fechas
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formatear duración en texto legible
 */
export function formatDuration(
  milliseconds: number,
  language: 'es' | 'en' = 'es'
): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const texts = {
    es: {
      day: (n: number) => `${n} día${n !== 1 ? 's' : ''}`,
      hour: (n: number) => `${n} hora${n !== 1 ? 's' : ''}`,
      minute: (n: number) => `${n} minuto${n !== 1 ? 's' : ''}`,
      second: (n: number) => `${n} segundo${n !== 1 ? 's' : ''}`,
    },
    en: {
      day: (n: number) => `${n} day${n !== 1 ? 's' : ''}`,
      hour: (n: number) => `${n} hour${n !== 1 ? 's' : ''}`,
      minute: (n: number) => `${n} minute${n !== 1 ? 's' : ''}`,
      second: (n: number) => `${n} second${n !== 1 ? 's' : ''}`,
    },
  };

  const t = texts[language];

  if (days > 0) return t.day(days);
  if (hours > 0) return t.hour(hours);
  if (minutes > 0) return t.minute(minutes);
  return t.second(seconds);
}
