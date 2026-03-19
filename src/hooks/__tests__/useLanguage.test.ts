/**
 * Tests for useLanguage hook
 */
import { renderHook, act } from '@testing-library/react-native';
import { useLanguage } from '../useLanguage';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('useLanguage Hook', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should load saved language from AsyncStorage', async () => {
      await AsyncStorage.setItem('@LessMo:language', 'en');
      
      const { result } = renderHook(() => useLanguage());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.currentLanguage.code).toBe('en');
    });

    it('should default to Spanish when no saved language', async () => {
      const { result } = renderHook(() => useLanguage());
      
      expect(result.current.currentLanguage.code).toBe('es');
    });
  });

  describe('changeLanguage', () => {
    it('should change language successfully', async () => {
      const { result } = renderHook(() => useLanguage());
      
      await act(async () => {
        await result.current.changeLanguage('en');
      });
      
      expect(result.current.currentLanguage.code).toBe('en');
      const saved = await AsyncStorage.getItem('@LessMo:language');
      expect(saved).toBe('en');
    });

    it('should support all available languages', async () => {
      const languages = ['es', 'en', 'fr', 'de', 'pt'];
      const { result } = renderHook(() => useLanguage());
      
      for (const lang of languages) {
        await act(async () => {
          await result.current.changeLanguage(lang);
        });
        
        expect(result.current.currentLanguage.code).toBe(lang);
      }
    });

    it('should persist language changes', async () => {
      const { result } = renderHook(() => useLanguage());
      
      await act(async () => {
        await result.current.changeLanguage('fr');
      });
      
      const saved = await AsyncStorage.getItem('@LessMo:language');
      expect(saved).toBe('fr');
    });
  });

  describe('availableLanguages', () => {
    it('should return list of available languages', () => {
      const { result } = renderHook(() => useLanguage());
      
      const languages = result.current.availableLanguages;
      
      expect(languages).toHaveLength(5);
      expect(languages.map(l => l.code)).toContain('es');
      expect(languages.map(l => l.code)).toContain('en');
      expect(languages.map(l => l.code)).toContain('fr');
      expect(languages.map(l => l.code)).toContain('de');
      expect(languages.map(l => l.code)).toContain('pt');
    });

    it('should include language names', () => {
      const { result } = renderHook(() => useLanguage());
      
      const spanish = result.current.availableLanguages.find(l => l.code === 'es');
      
      expect(spanish?.name).toBe('Spanish');
      expect(spanish?.nativeName).toBe('Español');
    });
  });

  describe('error handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      const error = new Error('Storage error');
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(error);
      
      const { result } = renderHook(() => useLanguage());
      
      await act(async () => {
        await result.current.changeLanguage('en');
      });
      
      // Should not crash
      expect(result.current.currentLanguage).toBeTruthy();
    });

    it('should handle invalid language codes', async () => {
      const { result } = renderHook(() => useLanguage());
      
      await act(async () => {
        await result.current.changeLanguage('invalid' as any);
      });
      
      // Should either reject or default to valid language
      expect(['es', 'en', 'fr', 'de', 'pt']).toContain(result.current.currentLanguage.code);
    });
  });
});
