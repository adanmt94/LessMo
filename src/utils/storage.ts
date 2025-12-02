/**
 * Sistema de almacenamiento persistente mejorado con AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger, LogCategory } from './logger';

const STORAGE_PREFIX = '@lessmo:';

/**
 * Guardar valor en storage
 */
export async function setItem<T>(key: string, value: T): Promise<boolean> {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(prefixedKey, jsonValue);
    logger.debug(LogCategory.STORAGE, `Item guardado: ${key}`);
    return true;
  } catch (error) {
    logger.error(LogCategory.STORAGE, `Error guardando ${key}`, error);
    return false;
  }
}

/**
 * Obtener valor del storage
 */
export async function getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    const jsonValue = await AsyncStorage.getItem(prefixedKey);
    
    if (jsonValue === null) {
      logger.debug(LogCategory.STORAGE, `Item no encontrado: ${key}`);
      return defaultValue ?? null;
    }
    
    const value = JSON.parse(jsonValue) as T;
    logger.debug(LogCategory.STORAGE, `Item recuperado: ${key}`);
    return value;
  } catch (error) {
    logger.error(LogCategory.STORAGE, `Error recuperando ${key}`, error);
    return defaultValue ?? null;
  }
}

/**
 * Remover item del storage
 */
export async function removeItem(key: string): Promise<boolean> {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    await AsyncStorage.removeItem(prefixedKey);
    logger.debug(LogCategory.STORAGE, `Item removido: ${key}`);
    return true;
  } catch (error) {
    logger.error(LogCategory.STORAGE, `Error removiendo ${key}`, error);
    return false;
  }
}

/**
 * Limpiar todo el storage de la app
 */
export async function clear(): Promise<boolean> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
    await AsyncStorage.multiRemove(appKeys);
    logger.info(LogCategory.STORAGE, `Storage limpiado: ${appKeys.length} items`);
    return true;
  } catch (error) {
    logger.error(LogCategory.STORAGE, 'Error limpiando storage', error);
    return false;
  }
}

/**
 * Verificar si existe una clave
 */
export async function hasItem(key: string): Promise<boolean> {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    const value = await AsyncStorage.getItem(prefixedKey);
    return value !== null;
  } catch (error) {
    logger.error(LogCategory.STORAGE, `Error verificando ${key}`, error);
    return false;
  }
}

/**
 * Obtener todas las claves
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
    return appKeys;
  } catch (error) {
    logger.error(LogCategory.STORAGE, 'Error obteniendo keys', error);
    return [];
  }
}

/**
 * Obtener múltiples items
 */
export async function getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
  try {
    const prefixedKeys = keys.map(key => `${STORAGE_PREFIX}${key}`);
    const items = await AsyncStorage.multiGet(prefixedKeys);
    
    const result: Record<string, T | null> = {};
    items.forEach(([prefixedKey, value]) => {
      const key = prefixedKey.replace(STORAGE_PREFIX, '');
      try {
        result[key] = value ? JSON.parse(value) : null;
      } catch {
        result[key] = null;
      }
    });
    
    return result;
  } catch (error) {
    logger.error(LogCategory.STORAGE, 'Error obteniendo múltiples items', error);
    return {};
  }
}

/**
 * Guardar múltiples items
 */
export async function setMultiple(items: Record<string, any>): Promise<boolean> {
  try {
    const pairs = Object.entries(items).map(([key, value]) => [
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify(value),
    ]);
    
    await AsyncStorage.multiSet(pairs as [string, string][]);
    logger.debug(LogCategory.STORAGE, `Guardados ${pairs.length} items`);
    return true;
  } catch (error) {
    logger.error(LogCategory.STORAGE, 'Error guardando múltiples items', error);
    return false;
  }
}

/**
 * Obtener tamaño usado del storage (aproximado)
 */
export async function getStorageSize(): Promise<{ keys: number; estimatedSize: string }> {
  try {
    const keys = await getAllKeys();
    const items = await getMultiple(keys);
    
    let totalSize = 0;
    Object.values(items).forEach(value => {
      if (value !== null) {
        totalSize += JSON.stringify(value).length;
      }
    });
    
    // Convertir a KB/MB
    const sizeKB = totalSize / 1024;
    const estimatedSize = sizeKB < 1024 
      ? `${sizeKB.toFixed(2)} KB`
      : `${(sizeKB / 1024).toFixed(2)} MB`;
    
    return {
      keys: keys.length,
      estimatedSize,
    };
  } catch (error) {
    logger.error(LogCategory.STORAGE, 'Error calculando tamaño', error);
    return { keys: 0, estimatedSize: '0 KB' };
  }
}

/**
 * Claves predefinidas para la app
 */
export const StorageKeys = {
  // Usuario
  USER_PREFERENCES: 'user_preferences',
  LAST_USER_ID: 'last_user_id',
  
  // Configuración
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  CURRENCY: 'currency',
  
  // Onboarding
  ONBOARDING_COMPLETED: 'onboarding_completed',
  
  // Caché
  CACHE_EVENTS: 'cache_events',
  CACHE_GROUPS: 'cache_groups',
  
  // Notificaciones
  NOTIFICATION_TOKEN: 'notification_token',
  NOTIFICATION_SETTINGS: 'notification_settings',
  
  // Biometrics
  BIOMETRIC_ENABLED: 'biometric_enabled',
  
  // Offline
  OFFLINE_QUEUE: 'offline_queue',
  LAST_SYNC: 'last_sync',
} as const;

/**
 * Hook de React para storage
 */
export function useStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = React.useState<T>(initialValue);
  const [loading, setLoading] = React.useState(true);

  // Cargar valor inicial
  React.useEffect(() => {
    getItem<T>(key, initialValue).then(value => {
      if (value !== null) {
        setStoredValue(value);
      }
      setLoading(false);
    });
  }, [key]);

  // Guardar valor
  const setValue = async (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await setItem(key, valueToStore);
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Error en setValue', error);
    }
  };

  // Remover valor
  const removeValue = async () => {
    try {
      await removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Error en removeValue', error);
    }
  };

  return [storedValue, setValue, removeValue, loading] as const;
}

// Importar React para el hook
import React from 'react';
