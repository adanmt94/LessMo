/**
 * Tests for useCurrency hook
 */
import { renderHook, act } from '@testing-library/react-native';
import { useCurrency } from '../useCurrency';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('useCurrency Hook', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should load saved currency from AsyncStorage', async () => {
      await AsyncStorage.setItem('@LessMo:currency', 'USD');
      
      const { result } = renderHook(() => useCurrency());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.currency).toBe('USD');
    });

    it('should default to EUR when no saved currency', () => {
      const { result } = renderHook(() => useCurrency());
      
      expect(result.current.currency).toBe('EUR');
    });
  });

  describe('changeCurrency', () => {
    it('should change currency successfully', async () => {
      const { result } = renderHook(() => useCurrency());
      
      await act(async () => {
        await result.current.changeCurrency('USD');
      });
      
      expect(result.current.currency).toBe('USD');
      const saved = await AsyncStorage.getItem('@LessMo:currency');
      expect(saved).toBe('USD');
    });

    it('should support all major currencies', async () => {
      const currencies = ['EUR', 'USD', 'GBP', 'JPY', 'MXN'];
      const { result } = renderHook(() => useCurrency());
      
      for (const currency of currencies) {
        await act(async () => {
          await result.current.changeCurrency(currency);
        });
        
        expect(result.current.currency).toBe(currency);
      }
    });

    it('should persist currency changes', async () => {
      const { result } = renderHook(() => useCurrency());
      
      await act(async () => {
        await result.current.changeCurrency('GBP');
      });
      
      const saved = await AsyncStorage.getItem('@LessMo:currency');
      expect(saved).toBe('GBP');
    });
  });

  describe('availableCurrencies', () => {
    it('should return list of available currencies', () => {
      const { result } = renderHook(() => useCurrency());
      
      const currencies = result.current.availableCurrencies;
      
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies.map(c => c.code)).toContain('EUR');
      expect(currencies.map(c => c.code)).toContain('USD');
    });

    it('should include currency symbols and names', () => {
      const { result } = renderHook(() => useCurrency());
      
      const eur = result.current.availableCurrencies.find(c => c.code === 'EUR');
      
      expect(eur?.symbol).toBe('€');
      expect(eur?.name).toBeTruthy();
    });
  });

  describe('formatAmount', () => {
    it('should format amount with correct symbol', () => {
      const { result } = renderHook(() => useCurrency());
      
      const formatted = result.current.formatAmount(100);
      
      expect(formatted).toContain('€');
      expect(formatted).toContain('100');
    });

    it('should format decimals correctly', () => {
      const { result } = renderHook(() => useCurrency());
      
      const formatted = result.current.formatAmount(99.99);
      
      expect(formatted).toContain('99.99');
    });

    it('should handle negative amounts', () => {
      const { result } = renderHook(() => useCurrency());
      
      const formatted = result.current.formatAmount(-50);
      
      expect(formatted).toContain('-50');
    });

    it('should adapt to currency changes', async () => {
      const { result } = renderHook(() => useCurrency());
      
      await act(async () => {
        await result.current.changeCurrency('USD');
      });
      
      const formatted = result.current.formatAmount(100);
      
      expect(formatted).toContain('$');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbol for current currency', () => {
      const { result } = renderHook(() => useCurrency());
      
      const symbol = result.current.getCurrencySymbol();
      
      expect(symbol).toBe('€');
    });

    it('should update when currency changes', async () => {
      const { result } = renderHook(() => useCurrency());
      
      await act(async () => {
        await result.current.changeCurrency('GBP');
      });
      
      const symbol = result.current.getCurrencySymbol();
      
      expect(symbol).toBe('£');
    });
  });

  describe('error handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      const error = new Error('Storage error');
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(error);
      
      const { result } = renderHook(() => useCurrency());
      
      await act(async () => {
        await result.current.changeCurrency('USD');
      });
      
      // Should not crash
      expect(result.current.currency).toBeTruthy();
    });

    it('should handle invalid currency codes', async () => {
      const { result } = renderHook(() => useCurrency());
      
      await act(async () => {
        await result.current.changeCurrency('INVALID' as any);
      });
      
      // Should keep valid currency
      const validCurrencies = result.current.availableCurrencies.map(c => c.code);
      expect(validCurrencies).toContain(result.current.currency);
    });
  });
});
