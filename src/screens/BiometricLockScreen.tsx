/**
 * BiometricLockScreen - Pantalla de bloqueo con Face ID/Touch ID
 * Se muestra al iniciar la app si está habilitada la biometría
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/lovable';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

interface Props {
  onUnlock: () => void;
}

export const BiometricLockScreen: React.FC<Props> = ({ onUnlock }) => {
  const { theme } = useTheme();
  const { authenticateWithBiometric, biometricType } = useBiometricAuth();
  const [attempts, setAttempts] = useState(0);
  const styles = getStyles(theme);

  useEffect(() => {
    // Solicitar autenticación automáticamente al cargar
    handleAuthenticate();
  }, []);

  const handleAuthenticate = async () => {
    try {
      const success = await authenticateWithBiometric();
      
      if (success) {
        onUnlock();
      } else {
        setAttempts(prev => prev + 1);
        
        if (attempts >= 2) {
          Alert.alert(
            'Demasiados intentos',
            'Por favor, intenta más tarde o inicia sesión nuevamente',
            [
              { text: 'Reintentar', onPress: handleAuthenticate },
              { text: 'Cerrar app', style: 'cancel' }
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Error en autenticación biométrica:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.icon, { fontSize: 80 }]}>🔐</Text>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          App Bloqueada
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Usa {biometricType} para desbloquear
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title={`Desbloquear con ${biometricType}`}
            onPress={handleAuthenticate}
            variant="primary"
            size="large"
          />
        </View>

        {attempts > 0 && (
          <Text style={[styles.attemptsText, { color: theme.colors.error }]}>
            Intentos fallidos: {attempts}
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
    marginBottom: 48,
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
