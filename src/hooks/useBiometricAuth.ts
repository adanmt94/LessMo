/**
 * useBiometricAuth - Hook para autenticación biométrica
 * Soporta Face ID (iOS) y Touch ID/Fingerprint (Android/iOS)
 */

import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { auth } from '../services/firebase';

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';
const BIOMETRIC_USER_UID_KEY = 'biometric_user_uid';

export interface BiometricAuthHook {
  isAvailable: boolean;
  isEnrolled: boolean;
  isEnabled: boolean;
  biometricType: string;
  enableBiometricAuth: () => Promise<void>;
  disableBiometricAuth: () => Promise<void>;
  authenticateWithBiometric: () => Promise<string | null>;
  isLoading: boolean;
  canEnableBiometric: boolean;
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

      // Verificar que hay un usuario autenticado y NO es anónimo
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert(
          'Error',
          'Debes iniciar sesión primero para activar la protección biométrica'
        );
        return;
      }

      if (currentUser.isAnonymous) {
        Alert.alert(
          'No disponible',
          'La protección biométrica no está disponible para usuarios anónimos. Crea una cuenta para usar esta función.'
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
        // Guardar que está habilitado Y el UID del usuario
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        await SecureStore.setItemAsync(BIOMETRIC_USER_UID_KEY, currentUser.uid);
        setIsEnabled(true);
        
        Alert.alert(
          '✅ Activado',
          `${biometricType} activado correctamente. La próxima vez que abras la app se te pedirá ${biometricType} para acceder directamente a tu cuenta.`
        );
        
        console.log('✅ Autenticación biométrica activada para usuario:', currentUser.uid);
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
      await SecureStore.deleteItemAsync(BIOMETRIC_USER_UID_KEY);
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

  const authenticateWithBiometric = async (): Promise<string | null> => {
    try {
      if (!isAvailable || !isEnrolled) {
        console.log('⚠️ Biometría no disponible');
        return null;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Desbloquear con ${biometricType}`,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        // Recuperar el UID del usuario guardado
        const savedUID = await SecureStore.getItemAsync(BIOMETRIC_USER_UID_KEY);
        if (!savedUID) {
          console.log('⚠️ No hay UID guardado');
          return null;
        }
        console.log('✅ Autenticación biométrica exitosa para UID:', savedUID);
        return savedUID;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error en autenticación biométrica:', error);
      return null;
    }
  };

  // Determinar si el usuario PUEDE activar biometría (no es anónimo)
  const currentUser = auth.currentUser;
  const canEnableBiometric = !!(currentUser && !currentUser.isAnonymous && isAvailable && isEnrolled);

  return {
    isAvailable,
    isEnrolled,
    isEnabled,
    biometricType,
    enableBiometricAuth,
    disableBiometricAuth,
    authenticateWithBiometric,
    isLoading,
    canEnableBiometric,
  };
};
