/**
 * ThemeContext - Contexto para manejar el tema de la aplicación (claro/oscuro)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    // Colores principales
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Colores de fondo
    background: string;
    surface: string;
    card: string;
    
    // Colores de texto
    text: string;
    textSecondary: string;
    textTertiary: string;
    
    // Colores de borde
    border: string;
    borderLight: string;
    
    // Estados
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Elementos de UI
    shadow: string;
    overlay: string;
    disabled: string;
    placeholder: string;
  };
}

// Tema claro
const lightTheme: Theme = {
  mode: 'light',
  isDark: false,
  colors: {
    primary: '#6366F1',
    primaryLight: '#A5B4FC',
    primaryDark: '#4F46E5',
    
    background: '#FFFFFF',
    surface: '#F9FAFB',
    card: '#FFFFFF',
    
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    disabled: '#D1D5DB',
    placeholder: '#9CA3AF',
  },
};

// Tema oscuro - MEJORADO con mejor contraste
const darkTheme: Theme = {
  mode: 'dark',
  isDark: true,
  colors: {
    primary: '#818CF8',
    primaryLight: '#A5B4FC',
    primaryDark: '#6366F1',
    
    background: '#0F172A',      // Más oscuro para mejor contraste
    surface: '#1E293B',          // Card background con buen contraste
    card: '#1E293B',             // Mismo que surface
    
    text: '#F1F5F9',            // Texto más brillante
    textSecondary: '#CBD5E1',    // Secondary más claro
    textTertiary: '#94A3B8',     // Tertiary visible
    
    border: '#334155',           // Bordes más visibles
    borderLight: '#475569',      // Border light con contraste
    
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
    disabled: '#475569',
    placeholder: '#64748B',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@LessMo:themeMode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [currentTheme, setCurrentTheme] = useState<Theme>(lightTheme);

  // Cargar preferencia de tema guardada
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Actualizar tema cuando cambia el modo o el esquema del sistema
  useEffect(() => {
    updateTheme();
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const updateTheme = () => {
    let isDark = false;

    if (themeMode === 'auto') {
      isDark = systemColorScheme === 'dark';
    } else {
      isDark = themeMode === 'dark';
    }

    setCurrentTheme(isDark ? darkTheme : lightTheme);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = currentTheme.isDark ? 'light' : 'dark';
    await setThemeMode(newMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeMode,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
