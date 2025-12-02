/**
 * Utilidades para formateo de números y monedas
 */

import { Currency, CurrencySymbols } from '../types';

/**
 * Formatear número con separadores de miles
 */
export function formatNumber(
  value: number,
  decimals: number = 2,
  locale: string = 'es-ES'
): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formatear moneda con símbolo
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  showSymbol: boolean = true,
  decimals: number = 2
): string {
  const formatted = formatNumber(Math.abs(amount), decimals);
  const symbol = showSymbol ? CurrencySymbols[currency] : '';
  const sign = amount < 0 ? '-' : '';
  
  return `${sign}${symbol}${formatted}`;
}

/**
 * Formatear porcentaje
 */
export function formatPercentage(
  value: number,
  decimals: number = 0
): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Abreviar números grandes (1000 -> 1K, 1000000 -> 1M)
 */
export function abbreviateNumber(
  value: number,
  decimals: number = 1
): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000000) {
    return `${sign}${(absValue / 1000000000).toFixed(decimals)}B`;
  }
  if (absValue >= 1000000) {
    return `${sign}${(absValue / 1000000).toFixed(decimals)}M`;
  }
  if (absValue >= 1000) {
    return `${sign}${(absValue / 1000).toFixed(decimals)}K`;
  }
  return `${sign}${absValue.toFixed(decimals)}`;
}

/**
 * Parsear string a número
 */
export function parseNumber(value: string): number | null {
  // Remover espacios y reemplazar comas por puntos
  const cleaned = value.trim().replace(/\s/g, '').replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Redondear a N decimales
 */
export function roundTo(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calcular porcentaje
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return roundTo((part / total) * 100, 2);
}

/**
 * Formatear tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generar rango de números
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Clamp (limitar valor entre min y max)
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Verificar si es número par
 */
export function isEven(value: number): boolean {
  return value % 2 === 0;
}

/**
 * Verificar si es número impar
 */
export function isOdd(value: number): boolean {
  return value % 2 !== 0;
}

/**
 * Sumar array de números
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + curr, 0);
}

/**
 * Promedio de array de números
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return sum(numbers) / numbers.length;
}

/**
 * Mediana de array de números
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

/**
 * Máximo de array
 */
export function max(numbers: number[]): number {
  return Math.max(...numbers);
}

/**
 * Mínimo de array
 */
export function min(numbers: number[]): number {
  return Math.min(...numbers);
}

/**
 * Interpolar linealmente entre dos valores
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Generar número aleatorio entre min y max
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generar entero aleatorio entre min y max
 */
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}
