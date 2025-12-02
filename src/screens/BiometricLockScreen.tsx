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
      const success = await authenticateWithBiometric();
      
      if (success) {
        onUnlock();
      } else {
        setAttempts(prev => prev + 1);
        
        if (attempts >= 2) {
          Alert.alert(
            t('biometricLock.tooManyAttempts'),
            t('biometricLock.tooManyAttemptsMessage'),
            [
              { text: t('biometricLock.retry'), onPress: handleAuthenticate },
              { text: t('biometricLock.closeApp'), style: 'cancel' }
            ]
          );
        }
      }
    } catch (error) {
      
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
