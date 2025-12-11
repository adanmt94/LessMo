/**
 * BiometricLockScreen - Pantalla de bloqueo con Face ID/Touch ID
 * Se muestra al iniciar la app si está habilitada la biometría
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/lovable';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { auth } from '../services/firebase';
import { signInAnonymously } from 'firebase/auth';

interface Props {
  onUnlock: () => void;
}

export const BiometricLockScreen: React.FC<Props> = ({ onUnlock }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { authenticateWithBiometric, biometricType } = useBiometricAuth();
  const [attempts, setAttempts] = useState(0);
  const styles = getStyles(theme);

  useEffect(() => {
    // Solicitar autenticación automáticamente al cargar
    handleAuthenticate();
  }, []);

  const handleAuthenticate = async () => {
    try {
      // authenticateWithBiometric ahora devuelve el UID del usuario
      const savedUID = await authenticateWithBiometric();
      
      if (savedUID) {
        // Verificar si el usuario actual coincide con el UID guardado
        const currentUser = auth.currentUser;
        
        if (currentUser && currentUser.uid === savedUID) {
          // Usuario correcto ya autenticado
          
          onUnlock();
        } else if (!currentUser) {
          // No hay usuario autenticado - desbloquear para mostrar login
          
          onUnlock(); // Ir directo a login, sin alertas
        } else {
          // Hay otro usuario autenticado
          
          await auth.signOut();
          Alert.alert(
            'Usuario diferente',
            'Hay una sesión activa con otra cuenta. Por favor, inicia sesión con la cuenta correcta.',
            [{ text: 'OK', onPress: onUnlock }]
          );
        }
      } else {
        // Solo incrementar intentos si hay un usuario activo (no incrementar si no hay sesión)
        const currentUser = auth.currentUser;
        if (currentUser) {
          setAttempts(prev => prev + 1);
          
          if (attempts >= 2) {
            Alert.alert(
              'Demasiados intentos',
              '¿Deseas iniciar sesión manualmente?',
              [
                { text: 'Reintentar', onPress: handleAuthenticate },
                { text: 'Iniciar sesión', onPress: onUnlock }
              ]
            );
          }
        } else {
          // Si no hay usuario, ir directo a login sin contar como intento fallido
          
          onUnlock();
        }
      }
    } catch (error) {
      console.error('❌ [BIOMETRIC LOCK] Error en autenticación:', error);
      onUnlock(); // En caso de error, desbloquear para mostrar login
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.icon, { fontSize: 80 }]}>🔐</Text>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('biometricLock.title')}
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {t('biometricLock.subtitle', { biometricType })}
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title={t('biometricLock.unlockButton', { biometricType })}
            onPress={handleAuthenticate}
            variant="primary"
            size="large"
          />
        </View>

        {attempts > 0 && (
          <Text style={[styles.attemptsText, { color: theme.colors.error }]}>
            {t('biometricLock.failedAttempts', { count: attempts })}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  attemptsText: {
    marginTop: 24,
    fontSize: 14,
    fontWeight: '500',
  },
});
