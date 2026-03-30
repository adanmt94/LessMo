/**
 * CurrencyContext - COMPLETAMENTE NUEVO
 * Sistema de monedas que GARANTIZA actualización de UI
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { Currency } from '../types';
import { emitGlobalUpdate } from '../utils/globalEvents';

const CURRENCY_STORAGE_KEY = '@LessMo:currency_v2';

export interface CurrencyOption {
  code: Currency;
  name: string;
  symbol: string;
}

export const AVAILABLE_CURRENCIES: CurrencyOption[] = [
  // Major
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  // Nordic / Central Europe
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  // Latin America
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
  { code: 'UYU', name: 'Peso Uruguayo', symbol: '$U' },
  { code: 'BOB', name: 'Boliviano', symbol: 'Bs' },
  { code: 'PYG', name: 'Guaraní Paraguayo', symbol: '₲' },
  { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$' },
  // Asia
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  // Middle East / Africa
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
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
        
        const currency = AVAILABLE_CURRENCIES.find(c => c.code === saved);
        if (currency) {
          setCurrentCurrency(currency);
          return;
        }
      }

      // Auto-detectar moneda del dispositivo
      const deviceLocales = Localization.getLocales();
      const deviceRegion = deviceLocales[0]?.regionCode || 'US';
      
      
      // Mapeo de región a moneda
      const regionToCurrency: Record<string, Currency> = {
        'ES': 'EUR', 'FR': 'EUR', 'DE': 'EUR', 'IT': 'EUR', 'PT': 'EUR',
        'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'IE': 'EUR', 'FI': 'EUR',
        'GR': 'EUR', 'SK': 'EUR', 'SI': 'EUR', 'LT': 'EUR', 'LV': 'EUR',
        'EE': 'EUR', 'CY': 'EUR', 'MT': 'EUR', 'LU': 'EUR',
        'US': 'USD',
        'CA': 'CAD',
        'GB': 'GBP',
        'JP': 'JPY',
        'CN': 'CNY',
        'CH': 'CHF', 'LI': 'CHF',
        'AU': 'AUD',
        'NZ': 'NZD',
        'SE': 'SEK',
        'NO': 'NOK',
        'DK': 'DKK',
        'PL': 'PLN',
        'CZ': 'CZK',
        'HU': 'HUF',
        'RO': 'RON',
        'BG': 'BGN',
        'HR': 'HRK',
        'IS': 'ISK',
        'TR': 'TRY',
        'MX': 'MXN',
        'AR': 'ARS',
        'CO': 'COP',
        'CL': 'CLP',
        'BR': 'BRL',
        'PE': 'PEN',
        'UY': 'UYU',
        'BO': 'BOB',
        'PY': 'PYG',
        'DO': 'DOP',
        'IN': 'INR',
        'KR': 'KRW',
        'TH': 'THB',
        'SG': 'SGD',
        'MY': 'MYR',
        'ID': 'IDR',
        'PH': 'PHP',
        'VN': 'VND',
        'HK': 'HKD',
        'TW': 'TWD',
        'IL': 'ILS',
        'AE': 'AED',
        'SA': 'SAR',
        'ZA': 'ZAR',
        'MA': 'MAD',
        'EG': 'EGP',
        'NG': 'NGN',
        'KE': 'KES',
        'RU': 'RUB',
        'UA': 'UAH',
      };
      
      const detectedCurrency = regionToCurrency[deviceRegion] || 'EUR';
      const currency = AVAILABLE_CURRENCIES.find(c => c.code === detectedCurrency);
      
      if (currency) {
        
        setCurrentCurrency(currency);
        await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency.code);
      }
    } catch (error) {
      
    }
  };

  const changeCurrency = async (currencyCode: Currency) => {
    try {
      
      
      const currency = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
      if (!currency) {
        throw new Error(`Moneda ${currencyCode} no soportada`);
      }

      // Guardar en AsyncStorage
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
      

      // Actualizar estado (esto fuerza re-render de TODA la app)
      setCurrentCurrency(currency);

      // EMITIR EVENTO GLOBAL para forzar actualización en TODA la app
      emitGlobalUpdate('CURRENCY_CHANGED');

      
    } catch (error) {
      
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
