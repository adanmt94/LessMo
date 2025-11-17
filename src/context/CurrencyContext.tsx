/**
 * CurrencyContext - COMPLETAMENTE NUEVO
 * Sistema de monedas que GARANTIZA actualización de UI
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { Currency } from '../types';

const CURRENCY_STORAGE_KEY = '@LessMo:currency_v2';

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

interface CurrencyContextType {
  currentCurrency: CurrencyOption;
  changeCurrency: (currencyCode: Currency) => Promise<void>;
  availableCurrencies: CurrencyOption[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyOption>(AVAILABLE_CURRENCIES[0]);

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      // Intentar cargar moneda guardada
      const saved = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
      
      if (saved) {
        console.log('💰 Moneda guardada encontrada:', saved);
        const currency = AVAILABLE_CURRENCIES.find(c => c.code === saved);
        if (currency) {
          setCurrentCurrency(currency);
          return;
        }
      }

      // Auto-detectar moneda del dispositivo
      const deviceLocales = Localization.getLocales();
      const deviceRegion = deviceLocales[0]?.regionCode || 'US';
      console.log('🌍 Región del dispositivo:', deviceRegion);
      
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
        console.log('💰 Auto-detectada moneda:', currency.code);
        setCurrentCurrency(currency);
        await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency.code);
      }
    } catch (error) {
      console.error('❌ Error loading currency:', error);
    }
  };

  const changeCurrency = async (currencyCode: Currency) => {
    try {
      console.log('🔄 Cambiando moneda a:', currencyCode);
      
      const currency = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
      if (!currency) {
        throw new Error(`Moneda ${currencyCode} no soportada`);
      }

      // Guardar en AsyncStorage
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
      console.log('💾 Moneda guardada en AsyncStorage');

      // Actualizar estado (esto fuerza re-render de TODA la app)
      setCurrentCurrency(currency);

      console.log('✅ Moneda cambiada exitosamente a:', currency.name);
    } catch (error) {
      console.error('❌ Error changing currency:', error);
      throw error;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        changeCurrency,
        availableCurrencies: AVAILABLE_CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
