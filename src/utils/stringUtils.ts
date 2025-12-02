/**
 * Utilidades para manipulación de strings
 */

/**
 * Capitalizar primera letra
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalizar cada palabra
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Truncar texto con ellipsis
 */
export function truncate(str: string, maxLength: number, ellipsis: string = '...'): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Generar slug (URL-friendly)
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Remover acentos
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verificar si contiene substring (case insensitive)
 */
export function containsIgnoreCase(str: string, search: string): boolean {
  return str.toLowerCase().includes(search.toLowerCase());
}

/**
 * Reemplazar todas las ocurrencias
 */
export function replaceAll(str: string, search: string, replace: string): string {
  return str.split(search).join(replace);
}

/**
 * Contar ocurrencias de substring
 */
export function countOccurrences(str: string, search: string): number {
  return (str.match(new RegExp(search, 'g')) || []).length;
}

/**
 * Verificar si es email válido
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Verificar si es URL válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extraer iniciales de nombre
 */
export function getInitials(name: string, maxChars: number = 2): string {
  if (!name) return '';
  
  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, maxChars)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  return initials;
}

/**
 * Enmascarar email (ej: j***@gmail.com)
 */
export function maskEmail(email: string): string {
  if (!isValidEmail(email)) return email;
  
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.charAt(0) + '***' + localPart.charAt(localPart.length - 1);
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Enmascarar número de teléfono
 */
export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

/**
 * Generar string aleatorio
 */
export function randomString(length: number, chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generar UUID simple (no criptográficamente seguro)
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Pluralizar palabra
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

/**
 * Formatear texto con variables
 */
export function interpolate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables.hasOwnProperty(key) ? String(variables[key]) : match;
  });
}

/**
 * Pad start (agregar caracteres al inicio)
 */
export function padStart(str: string, targetLength: number, padString: string = ' '): string {
  if (str.length >= targetLength) return str;
  return padString.repeat(Math.ceil((targetLength - str.length) / padString.length)).slice(0, targetLength - str.length) + str;
}

/**
 * Pad end (agregar caracteres al final)
 */
export function padEnd(str: string, targetLength: number, padString: string = ' '): string {
  if (str.length >= targetLength) return str;
  return str + padString.repeat(Math.ceil((targetLength - str.length) / padString.length)).slice(0, targetLength - str.length);
}

/**
 * Invertir string
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

/**
 * Verificar si es palíndromo
 */
export function isPalindrome(str: string): boolean {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === reverse(cleaned);
}

/**
 * Limpiar espacios múltiples
 */
export function cleanSpaces(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Extraer números de string
 */
export function extractNumbers(str: string): number[] {
  const matches = str.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Resaltar texto buscado
 */
export function highlightText(text: string, search: string, highlightTag: string = 'mark'): string {
  if (!search) return text;
  const regex = new RegExp(`(${search})`, 'gi');
  return text.replace(regex, `<${highlightTag}>$1</${highlightTag}>`);
}
