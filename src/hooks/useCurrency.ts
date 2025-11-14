/**
 * useCurrency - Hook para manejar la moneda predeterminada de la aplicación
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      }
    } catch (error) {
      console.error('Error loading currency preference:', error);
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
      console.error('Error changing currency:', error);
    }
  };

  return {
    currentCurrency,
    availableCurrencies: AVAILABLE_CURRENCIES,
    changeCurrency,
  };
};
