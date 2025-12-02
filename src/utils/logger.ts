/**
 * Sistema de logging centralizado para debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enabled = __DEV__; // Solo en desarrollo

  /**
   * Log genérico
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    // Agregar a historial
    this.logs.push(entry);
    
    // Mantener límite de logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Emoji para cada nivel
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };

    // Console log con formato
    const prefix = `${emoji[level]} [${category}]`;
    
    switch (level) {
      case 'debug':
        console.log(prefix, message, data || '');
        break;
      case 'info':
        console.info(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'error':
        console.error(prefix, message, data || '');
        break;
    }
  }

  /**
   * Debug - información detallada para desarrollo
   */
  debug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  /**
   * Info - información general
   */
  info(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  /**
   * Warn - advertencias
   */
  warn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  /**
   * Error - errores
   */
  error(category: string, message: string, error?: any): void {
    this.log('error', category, message, error);
  }

  /**
   * Obtener historial de logs
   */
  getHistory(level?: LogLevel, category?: string): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }

    return filtered;
  }

  /**
   * Limpiar historial
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Exportar logs como texto
   */
  export(): string {
    return this.logs.map(log => {
      const time = log.timestamp.toISOString();
      const data = log.data ? JSON.stringify(log.data) : '';
      return `[${time}] [${log.level.toUpperCase()}] [${log.category}] ${log.message} ${data}`;
    }).join('\n');
  }

  /**
   * Habilitar/deshabilitar logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Instancia singleton
export const logger = new Logger();

/**
 * Categorías predefinidas para organizar logs
 */
export const LogCategory = {
  AUTH: 'Auth',
  FIREBASE: 'Firebase',
  API: 'API',
  UI: 'UI',
  NAVIGATION: 'Navigation',
  STORAGE: 'Storage',
  NOTIFICATION: 'Notification',
  EXPENSE: 'Expense',
  EVENT: 'Event',
  GROUP: 'Group',
  PARTICIPANT: 'Participant',
  PHOTO: 'Photo',
  OCR: 'OCR',
  CACHE: 'Cache',
  VALIDATION: 'Validation',
  PERFORMANCE: 'Performance',
  FEATURE: 'Feature',
  SYNC: 'Sync',
} as const;

/**
 * Wrapper para medir performance de funciones
 */
export async function measurePerformance<T>(
  category: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  logger.debug(LogCategory.PERFORMANCE, `${operation} - Iniciando`);
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.info(LogCategory.PERFORMANCE, `${operation} - Completado en ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(LogCategory.PERFORMANCE, `${operation} - Error después de ${duration}ms`, error);
    throw error;
  }
}

/**
 * Decorator para logging automático de métodos
 */
export function logMethod(category: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      logger.debug(category, `${propertyKey} - Llamado`, { args });
      
      try {
        const result = await originalMethod.apply(this, args);
        logger.debug(category, `${propertyKey} - Éxito`);
        return result;
      } catch (error) {
        logger.error(category, `${propertyKey} - Error`, error);
        throw error;
      }
    };

    return descriptor;
  };
}
