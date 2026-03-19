/**
 * useCurrency - Hook para manejar la moneda predeterminada de la aplicación
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { Currency } from '../types';

const CURRENCY_STORAGE_KEY = '@LessMo:currency';

export interface CurrencyOption {
  code: Currency;
  name: string;
  symbol: string;
}

export const AVAILABLE_CURRENCIES: CurrencyOption[] = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£' },
  { code: 'JPY', name: 'Yen japonés', symbol: '¥' },
  { code: 'CNY', name: 'Yuan chino', symbol: '¥' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$' },
  { code: 'CLP', name: 'Peso chileno', symbol: '$' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$' },
];

export const useCurrency = () => {
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyOption>(
    AVAILABLE_CURRENCIES[0] // EUR por defecto
  );

  useEffect(() => {
    loadCurrencyPreference();
  }, []);

  const loadCurrencyPreference = async () => {
    try {
      const savedCurrency = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
      if (savedCurrency) {
        const currency = AVAILABLE_CURRENCIES.find(c => c.code === savedCurrency);
        if (currency) {
          setCurrentCurrency(currency);
        }
      } else {
        // Autodetectar moneda del dispositivo
        const locales = getLocales();
        const deviceRegion = locales[0]?.regionCode || 'US';
        
        // Mapeo de región a moneda
        const regionToCurrency: Record<string, Currency> = {
          'ES': 'EUR', 'FR': 'EUR', 'DE': 'EUR', 'IT': 'EUR', 'PT': 'EUR',
          'US': 'USD', 'CA': 'USD',
          'GB': 'GBP',
          'JP': 'JPY',
          'CN': 'CNY',
          'MX': 'MXN',
          'AR': 'ARS',
          'CO': 'COP',
          'CL': 'CLP',
          'BR': 'BRL',
        };
        
        const detectedCurrency = regionToCurrency[deviceRegion] || 'EUR';
        const currency = AVAILABLE_CURRENCIES.find(c => c.code === detectedCurrency);
        
        if (currency) {
          setCurrentCurrency(currency);
          await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency.code);
        }
      }
    } catch (error) {
      // Currency preference loading failed - using default
    }
  };

  const changeCurrency = async (currencyCode: Currency) => {
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
      const currency = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
      if (currency) {
        setCurrentCurrency(currency);
      }
    } catch (error) {
      // Currency change failed
    }
  };

  return {
    currentCurrency,
    availableCurrencies: AVAILABLE_CURRENCIES,
    changeCurrency,
  };
};
