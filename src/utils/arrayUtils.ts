/**
 * Utilidades para trabajar con arrays y colecciones
 */

/**
 * Eliminar duplicados de array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Eliminar duplicados por propiedad
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Agrupar array por propiedad
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Ordenar array por propiedad
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (aValue === bValue) return 0;

    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;

    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Dividir array en chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Encontrar índice por propiedad
 */
export function findIndex<T>(array: T[], key: keyof T, value: any): number {
  return array.findIndex(item => item[key] === value);
}

/**
 * Encontrar por propiedad
 */
export function findBy<T>(array: T[], key: keyof T, value: any): T | undefined {
  return array.find(item => item[key] === value);
}

/**
 * Filtrar por múltiples propiedades
 */
export function filterBy<T>(
  array: T[],
  filters: Partial<Record<keyof T, any>>
): T[] {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      return item[key as keyof T] === value;
    });
  });
}

/**
 * Mapear a objeto usando una clave
 */
export function keyBy<T>(array: T[], key: keyof T): Record<string, T> {
  return array.reduce((result, item) => {
    const keyValue = String(item[key]);
    result[keyValue] = item;
    return result;
  }, {} as Record<string, T>);
}

/**
 * Extraer valores de una propiedad
 */
export function pluck<T, K extends keyof T>(array: T[], key: K): T[K][] {
  return array.map(item => item[key]);
}

/**
 * Contar ocurrencias
 */
export function countBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce((result, item) => {
    const keyValue = String(item[key]);
    result[keyValue] = (result[keyValue] || 0) + 1;
    return result;
  }, {} as Record<string, number>);
}

/**
 * Shuffle (mezclar aleatoriamente)
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Tomar N elementos aleatorios
 */
export function sample<T>(array: T[], count: number = 1): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Particionar array según condición
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  array.forEach(item => {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  });
  
  return [truthy, falsy];
}

/**
 * Diferencia entre arrays
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  const set2 = new Set(array2);
  return array1.filter(item => !set2.has(item));
}

/**
 * Intersección de arrays
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  const set2 = new Set(array2);
  return unique(array1.filter(item => set2.has(item)));
}

/**
 * Unión de arrays
 */
export function union<T>(...arrays: T[][]): T[] {
  return unique(arrays.flat());
}

/**
 * Compactar (remover valores falsy)
 */
export function compact<T>(array: (T | null | undefined | false | '' | 0)[]): T[] {
  return array.filter(Boolean) as T[];
}

/**
 * Flatten (aplanar array anidado)
 */
export function flatten<T>(array: any[], depth: number = 1): T[] {
  if (depth === 0) return array as T[];
  return array.reduce((flat, item) => {
    return flat.concat(
      Array.isArray(item) ? flatten(item, depth - 1) : item
    );
  }, []);
}

/**
 * Verificar si arrays son iguales
 */
export function arraysEqual<T>(array1: T[], array2: T[]): boolean {
  if (array1.length !== array2.length) return false;
  return array1.every((item, index) => item === array2[index]);
}

/**
 * Primer elemento
 */
export function first<T>(array: T[]): T | undefined {
  return array[0];
}

/**
 * Último elemento
 */
export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * Tomar N primeros elementos
 */
export function take<T>(array: T[], count: number): T[] {
  return array.slice(0, count);
}

/**
 * Saltar N primeros elementos
 */
export function skip<T>(array: T[], count: number): T[] {
  return array.slice(count);
}

/**
 * Rango de índices
 */
export function rangeOf<T>(array: T[], start: number, end: number): T[] {
  return array.slice(start, end);
}
