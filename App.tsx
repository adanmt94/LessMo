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
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { AuthProvider } from './src/context/AuthContext';
import { Navigation } from './src/navigation';
import { BiometricLockScreen } from './src/screens/BiometricLockScreen';
import { globalEmitter, GlobalEvents } from './src/utils/globalEvents';
import { isBiometricUserCurrent } from './src/services/biometricAuthService';
import { auth } from './src/services/firebase';

console.log('🚀 [APP] Iniciando aplicación LessMo...');

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

// Componente interno que tiene acceso al ThemeContext
const AppContent: React.FC<{ appKey: number }> = ({ appKey }) => {
  const { theme } = useTheme();
  const [isLocked, setIsLocked] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [checkingBiometric, setCheckingBiometric] = useState(true);

  useEffect(() => {
    console.log('🔐 [APP] Iniciando verificación de biometría...');
    checkBiometricStatus();
    
    // Timeout de seguridad: si después de 3 segundos no se resolvió, desbloquear
    const timeout = setTimeout(() => {
      console.log('⚠️ [APP] Timeout verificando biometría - desbloqueando app');
      setCheckingBiometric(false);
      setIsLocked(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  const checkBiometricStatus = async () => {
    try {
      console.log('🔐 [APP] Verificando estado de biometría en SecureStore...');
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      console.log('🔐 [APP] Biometría habilitada:', enabled);
      
      if (enabled !== 'true') {
        console.log('✅ [APP] Biometría no habilitada - desbloqueando');
        setBiometricEnabled(false);
        setIsLocked(false);
        return;
      }

      // Verificar si el usuario actual coincide con el guardado en biometría
      const isCurrentUser = await isBiometricUserCurrent();
      
      if (!isCurrentUser) {
        console.log('⚠️ [APP] Usuario actual no coincide con el guardado - requiere autenticación');
        setBiometricEnabled(true);
        setIsLocked(true); // Mantener bloqueado para que autentique con biometría
      } else {
        console.log('✅ [APP] Usuario ya autenticado correctamente - desbloqueando');
        setBiometricEnabled(true);
        setIsLocked(false); // Desbloquear porque ya está autenticado con el usuario correcto
      }
    } catch (error) {
      console.error('❌ [APP] Error verificando biometría:', error);
      setIsLocked(false); // En caso de error, desbloquear
    } finally {
      console.log('✅ [APP] Verificación de biometría completada');
      setCheckingBiometric(false);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  // Mostrar splash o indicador mientras verificamos biometría
  // NOTA: Ya no devolvemos null para evitar pantalla en blanco
  // Si checkingBiometric es true, mostramos la app de todos modos
  // El timeout de 3 segundos asegura que nunca nos quedemos bloqueados

  return (
    <>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            {/* Si está bloqueada Y biometría habilitada, mostrar pantalla de bloqueo */}
            {isLocked && biometricEnabled ? (
              <BiometricLockScreen onUnlock={handleUnlock} />
            ) : (
              <Navigation key={appKey} />
            )}
            {/* StatusBar dinámico según el tema */}
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </>
  );
};

export default function App() {
  // Key para forzar remount completo de la app
  const [appKey, setAppKey] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('🚀 App iniciando...');
    
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

  // Manejo global de errores
  if (error) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <StatusBar style="auto" />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent appKey={appKey} />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  } catch (err) {
    console.error('❌ Error crítico en App:', err);
    setError(err as Error);
    return null;
  }
}
