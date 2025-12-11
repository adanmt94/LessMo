/**
 * 🚀 Sistema de Caché para mejorar rendimiento
 * Almacena datos frecuentemente accedidos para reducir llamadas a Firebase
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@LessMo:cache:';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por defecto

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Guarda datos en caché con tiempo de expiración
 */
export async function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(entry)
    );
  } catch (error) {
    console.warn('⚠️ Error guardando en caché:', error);
  }
}

/**
 * Obtiene datos de caché si no han expirado
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    
    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    
    // Verificar si ha expirado
    if (now - entry.timestamp > entry.ttl) {
      // Expirado, eliminar
      await removeCache(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn('⚠️ Error leyendo caché:', error);
    return null;
  }
}

/**
 * Elimina una entrada específica del caché
 */
export async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.warn('⚠️ Error eliminando caché:', error);
  }
}

/**
 * Elimina todas las entradas de caché que coincidan con un patrón
 */
export async function clearCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const matchingKeys = keys.filter(key => 
      key.startsWith(CACHE_PREFIX) && key.includes(pattern)
    );
    
    if (matchingKeys.length > 0) {
      await AsyncStorage.multiRemove(matchingKeys);
    }
  } catch (error) {
    console.warn('⚠️ Error limpiando caché:', error);
  }
}

/**
 * Limpia todo el caché
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.warn('⚠️ Error limpiando todo el caché:', error);
  }
}

/**
 * Hook helper para obtener o cargar datos con caché
 */
export async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Intentar obtener de caché primero
  const cached = await getCache<T>(cacheKey);
  
  if (cached !== null) {
    
    return cached;
  }

  
  
  // No hay caché o expiró, obtener datos frescos
  const freshData = await fetchFn();
  
  // Guardar en caché para próximas veces
  await setCache(cacheKey, freshData, ttl);
  
  return freshData;
}

/**
 * Invalidar caché cuando se modifiquen datos
 */
export async function invalidateCache(keys: string[]): Promise<void> {
  try {
    const promises = keys.map(key => removeCache(key));
    await Promise.all(promises);
    
  } catch (error) {
    console.warn('⚠️ Error invalidando caché:', error);
  }
}
