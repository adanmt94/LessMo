/**
 * Currency Conversion Service
 * Convierte entre monedas para eventos multi-moneda
 * Usa tasas de cambio cacheadas (API gratuita)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Currency } from '../types';

const CACHE_KEY = 'lessmo_exchange_rates';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 horas

interface CachedRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

// Fallback rates (EUR-based, approximate) for offline use
const FALLBACK_RATES: Record<string, number> = {
  EUR: 1, USD: 1.08, GBP: 0.86, JPY: 163.5, CNY: 7.85,
  CHF: 0.97, CAD: 1.47, AUD: 1.65, MXN: 18.5, ARS: 920,
  COP: 4200, CLP: 980, BRL: 5.35, GEL: 2.85, INR: 90.5,
  KRW: 1420, THB: 38.5, SGD: 1.45, TRY: 34.5, PLN: 4.32,
  SEK: 11.3, NOK: 11.5, DKK: 7.46, CZK: 25.2, HUF: 395,
  RON: 4.97, ISK: 150, PEN: 3.85, UYU: 42, BOB: 7.45,
  PYG: 7850, DOP: 60, MYR: 4.75, IDR: 16800, PHP: 60.5,
  VND: 26500, HKD: 8.45, TWD: 34.5, ILS: 3.95, AED: 3.97,
  SAR: 4.05, ZAR: 19.5, MAD: 10.8, EGP: 52, NGN: 1580,
  KES: 155, RUB: 98, UAH: 42, NZD: 1.78, BGN: 1.96, HRK: 7.53,
};

/**
 * Fetch exchange rates from free API, with cache and fallback
 */
export async function getExchangeRates(baseCurrency: Currency = 'EUR'): Promise<Record<string, number>> {
  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const data: CachedRates = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_DURATION && data.base === baseCurrency) {
        return data.rates;
      }
    }

    // Fetch from free API
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const json = await response.json();
      const rates = json.rates as Record<string, number>;
      
      // Cache the result
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        base: baseCurrency,
        rates,
        timestamp: Date.now(),
      }));
      
      return rates;
    }
  } catch {
    // Network error - use fallback
  }

  // Return fallback rates adjusted to base currency
  return adjustRatesToBase(baseCurrency);
}

function adjustRatesToBase(base: Currency): Record<string, number> {
  const baseRate = FALLBACK_RATES[base] || 1;
  const adjusted: Record<string, number> = {};
  for (const [currency, rate] of Object.entries(FALLBACK_RATES)) {
    adjusted[currency] = rate / baseRate;
  }
  return adjusted;
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
): Promise<{ convertedAmount: number; exchangeRate: number }> {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, exchangeRate: 1 };
  }

  const rates = await getExchangeRates(fromCurrency);
  const rate = rates[toCurrency] || 1;
  
  return {
    convertedAmount: Math.round(amount * rate * 100) / 100,
    exchangeRate: Math.round(rate * 10000) / 10000,
  };
}

/**
 * Format exchange rate display
 */
export function formatExchangeRate(from: Currency, to: Currency, rate: number): string {
  return `1 ${from} = ${rate.toFixed(4)} ${to}`;
}
