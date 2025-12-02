/**
 * Hook para estado persistente con AsyncStorage
 * Evita re-renders innecesarios y mantiene datos entre sesiones
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => Promise<void>, boolean] {
  const [state, setState] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  // Cargar valor inicial desde AsyncStorage
  useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null && isMounted.current) {
          setState(JSON.parse(stored));
        }
      } catch (error) {
        console.error(`Error loading persisted state for ${key}:`, error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadValue();

    return () => {
      isMounted.current = false;
    };
  }, [key]);

  // Guardar valor en AsyncStorage cuando cambia
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const newValue = value instanceof Function ? value(state) : value;
        
        if (isMounted.current) {
          setState(newValue);
        }
        
        await AsyncStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Error saving persisted state for ${key}:`, error);
      }
    },
    [key, state]
  );

  return [state, setValue, loading];
}
