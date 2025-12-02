/**
 * Sistema centralizado de manejo de errores
 */

import { Alert } from 'react-native';
import { logger, LogCategory } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public category?: string,
    public isUserFacing: boolean = true,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Tipos de errores comunes
 */
export const ErrorType = {
  // Autenticación
  AUTH_FAILED: 'auth/failed',
  AUTH_INVALID_EMAIL: 'auth/invalid-email',
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_WRONG_PASSWORD: 'auth/wrong-password',
  AUTH_EMAIL_IN_USE: 'auth/email-already-in-use',
  
  // Validación
  VALIDATION_REQUIRED: 'validation/required',
  VALIDATION_INVALID: 'validation/invalid',
  VALIDATION_MIN: 'validation/min',
  VALIDATION_MAX: 'validation/max',
  
  // Firebase
  FIREBASE_PERMISSION: 'firebase/permission-denied',
  FIREBASE_NOT_FOUND: 'firebase/not-found',
  FIREBASE_NETWORK: 'firebase/network-error',
  
  // Datos
  DATA_NOT_FOUND: 'data/not-found',
  DATA_INVALID: 'data/invalid',
  
  // Red
  NETWORK_ERROR: 'network/error',
  NETWORK_TIMEOUT: 'network/timeout',
  
  // Storage
  STORAGE_UPLOAD: 'storage/upload-failed',
  STORAGE_DOWNLOAD: 'storage/download-failed',
  
  // Permisos
  PERMISSION_DENIED: 'permission/denied',
  PERMISSION_CAMERA: 'permission/camera',
  PERMISSION_PHOTOS: 'permission/photos',
  
  // Desconocido
  UNKNOWN: 'unknown',
} as const;

/**
 * Mensajes de error amigables para el usuario
 */
const userFriendlyMessages: Record<string, { es: string; en: string }> = {
  [ErrorType.AUTH_FAILED]: {
    es: 'Error al iniciar sesión. Verifica tus credenciales.',
    en: 'Login failed. Please check your credentials.',
  },
  [ErrorType.AUTH_INVALID_EMAIL]: {
    es: 'El email ingresado no es válido.',
    en: 'The email address is invalid.',
  },
  [ErrorType.AUTH_USER_NOT_FOUND]: {
    es: 'No existe una cuenta con este email.',
    en: 'No account found with this email.',
  },
  [ErrorType.AUTH_WRONG_PASSWORD]: {
    es: 'Contraseña incorrecta.',
    en: 'Incorrect password.',
  },
  [ErrorType.AUTH_EMAIL_IN_USE]: {
    es: 'Este email ya está registrado.',
    en: 'This email is already in use.',
  },
  [ErrorType.FIREBASE_PERMISSION]: {
    es: 'No tienes permisos para realizar esta acción.',
    en: 'You don\'t have permission to perform this action.',
  },
  [ErrorType.FIREBASE_NOT_FOUND]: {
    es: 'No se encontró el elemento solicitado.',
    en: 'The requested item was not found.',
  },
  [ErrorType.NETWORK_ERROR]: {
    es: 'Error de conexión. Verifica tu internet.',
    en: 'Connection error. Please check your internet.',
  },
  [ErrorType.STORAGE_UPLOAD]: {
    es: 'Error al subir la imagen. Intenta de nuevo.',
    en: 'Failed to upload image. Please try again.',
  },
  [ErrorType.PERMISSION_CAMERA]: {
    es: 'Se necesita permiso para acceder a la cámara.',
    en: 'Camera permission is required.',
  },
  [ErrorType.PERMISSION_PHOTOS]: {
    es: 'Se necesita permiso para acceder a las fotos.',
    en: 'Photos permission is required.',
  },
  [ErrorType.UNKNOWN]: {
    es: 'Ocurrió un error inesperado.',
    en: 'An unexpected error occurred.',
  },
};

/**
 * Obtener mensaje amigable para el usuario
 */
export function getUserFriendlyMessage(errorCode: string, language: 'es' | 'en' = 'es'): string {
  return userFriendlyMessages[errorCode]?.[language] || userFriendlyMessages[ErrorType.UNKNOWN][language];
}

/**
 * Mapear errores de Firebase a códigos de error de la app
 */
export function mapFirebaseError(error: any): string {
  const code = error.code || error.message || '';
  
  if (code.includes('permission-denied')) return ErrorType.FIREBASE_PERMISSION;
  if (code.includes('not-found')) return ErrorType.FIREBASE_NOT_FOUND;
  if (code.includes('network')) return ErrorType.FIREBASE_NETWORK;
  if (code.includes('invalid-email')) return ErrorType.AUTH_INVALID_EMAIL;
  if (code.includes('user-not-found')) return ErrorType.AUTH_USER_NOT_FOUND;
  if (code.includes('wrong-password')) return ErrorType.AUTH_WRONG_PASSWORD;
  if (code.includes('email-already-in-use')) return ErrorType.AUTH_EMAIL_IN_USE;
  
  return ErrorType.UNKNOWN;
}

/**
 * Handler centralizado de errores
 */
export class ErrorHandler {
  private static language: 'es' | 'en' = 'es';

  static setLanguage(lang: 'es' | 'en'): void {
    this.language = lang;
  }

  /**
   * Manejar error y mostrarlo al usuario
   */
  static handle(error: any, category: string = 'General', showAlert: boolean = true): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      // Mapear error a AppError
      const errorCode = error.code ? mapFirebaseError(error) : ErrorType.UNKNOWN;
      const message = getUserFriendlyMessage(errorCode, this.language);
      
      appError = new AppError(
        message,
        errorCode,
        category,
        true,
        error
      );
    }

    // Log del error
    logger.error(appError.category || category, appError.message, {
      code: appError.code,
      originalError: appError.originalError,
    });

    // Mostrar alerta al usuario si es necesario
    if (showAlert && appError.isUserFacing) {
      Alert.alert(
        this.language === 'es' ? 'Error' : 'Error',
        appError.message
      );
    }

    return appError;
  }

  /**
   * Manejar error de forma silenciosa (solo log)
   */
  static logError(error: any, category: string = 'General'): void {
    this.handle(error, category, false);
  }

  /**
   * Crear error personalizado
   */
  static create(
    message: string,
    code?: string,
    category?: string,
    isUserFacing: boolean = true
  ): AppError {
    return new AppError(message, code, category, isUserFacing);
  }

  /**
   * Wrapper para funciones async con manejo de errores
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    category: string = 'General',
    showAlert: boolean = true
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, category, showAlert);
      return null;
    }
  }
}

/**
 * Hook de React para manejo de errores
 */
export function useErrorHandler() {
  const handleError = (error: any, category?: string, showAlert: boolean = true) => {
    return ErrorHandler.handle(error, category, showAlert);
  };

  const createError = (message: string, code?: string, category?: string) => {
    return ErrorHandler.create(message, code, category);
  };

  return {
    handleError,
    createError,
  };
}

/**
 * Validar y lanzar error si la validación falla
 */
export function assertValid(condition: boolean, message: string, code?: string): asserts condition {
  if (!condition) {
    throw new AppError(message, code || ErrorType.VALIDATION_INVALID, LogCategory.VALIDATION);
  }
}

/**
 * Retry automático con backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        logger.warn(LogCategory.API, `Retry ${i + 1}/${maxRetries} después de ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
