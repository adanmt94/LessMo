/**
 * LessMo - Aplicación de gestión de gastos compartidos
 * App principal con navegación y autenticación
 */

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { AuthProvider } from './src/context/AuthContext';
import { Navigation } from './src/navigation';
import { globalEmitter, GlobalEvents } from './src/utils/globalEvents';

export default function App() {
  // Key para forzar remount completo de la app
  const [appKey, setAppKey] = useState(0);

  useEffect(() => {
    // Escuchar cambios de idioma/moneda y forzar remount
    const handleForceRemount = () => {
      console.log('🔄 FORZANDO REMOUNT COMPLETO DE LA APP');
      setAppKey(prev => prev + 1);
    };

    globalEmitter.on(GlobalEvents.LANGUAGE_CHANGED, handleForceRemount);
    globalEmitter.on(GlobalEvents.CURRENCY_CHANGED, handleForceRemount);

    return () => {
      globalEmitter.off(GlobalEvents.LANGUAGE_CHANGED, handleForceRemount);
      globalEmitter.off(GlobalEvents.CURRENCY_CHANGED, handleForceRemount);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <AuthProvider>
                <Navigation key={appKey} />
                <StatusBar style="auto" />
              </AuthProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
