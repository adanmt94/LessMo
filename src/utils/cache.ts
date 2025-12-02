/**
 * Sistema de caché en memoria para mejorar el rendimiento
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>>;
  private readonly DEFAULT_EXPIRATION = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.cache = new Map();
  }

  /**
   * Guardar datos en caché
   */
  set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRATION): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  /**
   * Obtener datos del caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Verificar si existe una clave en caché y no ha expirado
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Eliminar una entrada del caché
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidar todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Obtener el tamaño del caché
   */
  size(): number {
    return this.cache.size;
  }
}

// Instancia singleton del caché
export const cache = new Cache();

/**
 * Wrapper para funciones async con caché automático
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expiresIn?: number
): Promise<T> {
  // Intentar obtener del caché
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log('📦 Cache HIT:', key);
    return cached;
  }

  console.log('🔄 Cache MISS:', key);
  
  // Si no está en caché, ejecutar la función
  const data = await fetchFn();
  
  // Guardar en caché
  cache.set(key, data, expiresIn);
  
  return data;
}

/**
 * Hook de React para usar caché con invalidación automática
 */
export const useCacheInvalidation = (patterns: string[]) => {
  const invalidate = () => {
    patterns.forEach(pattern => {
      cache.invalidatePattern(pattern);
      console.log('🗑️ Cache invalidado para patrón:', pattern);
    });
  };

  return { invalidate };
};
