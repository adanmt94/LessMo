/**
 * LessMo - Aplicación de gestión de gastos compartidos
 * App principal con navegación y autenticación
 */

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { AuthProvider } from './src/context/AuthContext';
import { Navigation } from './src/navigation';
import { BiometricLockScreen } from './src/screens/BiometricLockScreen';
import { globalEmitter, GlobalEvents } from './src/utils/globalEvents';

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

export default function App() {
  // Key para forzar remount completo de la app
  const [appKey, setAppKey] = useState(0);
  const [isLocked, setIsLocked] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [checkingBiometric, setCheckingBiometric] = useState(true);

  useEffect(() => {
    // Verificar si biometría está habilitada
    checkBiometricStatus();

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

  const checkBiometricStatus = async () => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setBiometricEnabled(enabled === 'true');
      
      // Si NO está habilitada, desbloquear inmediatamente
      if (enabled !== 'true') {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('❌ Error verificando biometría:', error);
      setIsLocked(false); // En caso de error, desbloquear
    } finally {
      setCheckingBiometric(false);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  // Mostrar nada mientras verificamos biometría
  if (checkingBiometric) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <AuthProvider>
                {/* Si está bloqueada Y biometría habilitada, mostrar pantalla de bloqueo */}
                {isLocked && biometricEnabled ? (
                  <BiometricLockScreen onUnlock={handleUnlock} />
                ) : (
                  <Navigation key={appKey} />
                )}
                <StatusBar style="auto" />
              </AuthProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
