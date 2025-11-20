/**
 * useBiometricAuth - Hook para autenticación biométrica
 * Soporta Face ID (iOS) y Touch ID/Fingerprint (Android/iOS)
 */

import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

export interface BiometricAuthHook {
  isAvailable: boolean;
  isEnrolled: boolean;
  isEnabled: boolean;
  biometricType: string;
  enableBiometricAuth: () => Promise<void>;
  disableBiometricAuth: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  isLoading: boolean;
}

export const useBiometricAuth = (): BiometricAuthHook => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setIsLoading(true);

      // Verificar si el hardware soporta biometría
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsAvailable(compatible);

      if (!compatible) {
        console.log('❌ Dispositivo no soporta autenticación biométrica');
        setIsLoading(false);
        return;
      }

      // Verificar si hay datos biométricos registrados
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsEnrolled(enrolled);

      if (!enrolled) {
        console.log('⚠️ No hay datos biométricos registrados en el dispositivo');
        setIsLoading(false);
        return;
      }

      // Obtener tipo de autenticación biométrica disponible
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType(Platform.OS === 'ios' ? 'Touch ID' : 'Huella Digital');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      } else {
        setBiometricType('Biometría');
      }

      // Verificar si el usuario habilitó la autenticación biométrica
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(enabled === 'true');

      console.log('✅ Biometría disponible:', {
        compatible,
        enrolled,
        type: biometricType,
        enabled: enabled === 'true',
      });
    } catch (error) {
      console.error('❌ Error verificando biometría:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enableBiometricAuth = async (): Promise<void> => {
    try {
      if (!isAvailable || !isEnrolled) {
        Alert.alert(
          'No disponible',
          'Tu dispositivo no soporta autenticación biométrica o no tienes datos registrados'
        );
        return;
      }

      // Solicitar autenticación para confirmar
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirma tu identidad con ${biometricType}`,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        setIsEnabled(true);
        
        Alert.alert(
          '✅ Activado',
          `${biometricType} activado correctamente. Ahora se te pedirá al abrir la app.`
        );
        
        console.log('✅ Autenticación biométrica activada');
      } else {
        console.log('❌ Autenticación cancelada o fallida');
      }
    } catch (error: any) {
      console.error('❌ Error activando biometría:', error);
      Alert.alert('Error', 'No se pudo activar la autenticación biométrica');
    }
  };

  const disableBiometricAuth = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(false);
      
      Alert.alert(
        'Desactivado',
        `${biometricType} ha sido desactivado`
      );
      
      console.log('✅ Autenticación biométrica desactivada');
    } catch (error) {
      console.error('❌ Error desactivando biometría:', error);
      Alert.alert('Error', 'No se pudo desactivar la autenticación biométrica');
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      if (!isAvailable || !isEnrolled) {
        console.log('⚠️ Biometría no disponible');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Desbloquear con ${biometricType}`,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        console.log('✅ Autenticación biométrica exitosa');
        return true;
      } else {
        console.log('❌ Autenticación biométrica fallida');
        return false;
      }
    } catch (error) {
      console.error('❌ Error en autenticación biométrica:', error);
      return false;
    }
  };

  return {
    isAvailable,
    isEnrolled,
    isEnabled,
    biometricType,
    enableBiometricAuth,
    disableBiometricAuth,
    authenticateWithBiometric,
    isLoading,
  };
};
