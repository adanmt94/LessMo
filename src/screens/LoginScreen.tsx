/**
 * LoginScreen - Pantalla de inicio de sesión
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { Button, Input } from '../components/lovable';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const STORED_EMAIL_KEY = 'biometric_user_email';
const STORED_PASSWORD_KEY = 'biometric_user_password';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error } = useAuth();
  const { signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();
  const { isAvailable, isEnrolled, isEnabled, biometricType, authenticateWithBiometric } = useBiometricAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  useEffect(() => {
    checkSavedCredentials();
  }, []);

  const checkSavedCredentials = async () => {
    try {
      const savedEmail = await SecureStore.getItemAsync(STORED_EMAIL_KEY);
      setHasSavedCredentials(!!savedEmail && isEnabled);
    } catch (error) {
      
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const authenticated = await authenticateWithBiometric();
      if (!authenticated) {
        return;
      }

      // Recuperar credenciales guardadas
      const savedEmail = await SecureStore.getItemAsync(STORED_EMAIL_KEY);
      const savedPassword = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);

      if (!savedEmail || !savedPassword) {
        Alert.alert(t('common.error'), 'No hay credenciales guardadas');
        return;
      }

      // Iniciar sesión con las credenciales guardadas
      const success = await signIn(savedEmail, savedPassword);
      if (!success) {
        Alert.alert(t('common.error'), error || t('auth.loginError'));
      }
    } catch (error) {
      
      Alert.alert(t('common.error'), 'Error al iniciar sesión con biometría');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.allFieldsRequired'));
      return;
    }

    const success = await signIn(email, password);
    if (success) {
      // Guardar credenciales si la biometría está habilitada
      if (isEnabled) {
        try {
          await SecureStore.setItemAsync(STORED_EMAIL_KEY, email);
          await SecureStore.setItemAsync(STORED_PASSWORD_KEY, password);
        } catch (error) {
          
        }
      }
      // La navegación se maneja automáticamente en App.tsx
    } else {
      Alert.alert(t('common.error'), error || t('auth.loginError'));
    }
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    if (googleError) {
      Alert.alert(t('common.error'), googleError);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>💰</Text>
            </View>
            <Text style={styles.title}>LessMo</Text>
            <Text style={styles.subtitle}>
              Gestiona tus finanzas de forma fácil
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              testID="email-input"
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />

            <Input
              testID="password-input"
              label={t('auth.passwordLabel')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
            />

            <Button
              testID="login-button"
              title={t('auth.loginButton')}
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="large"
            />

            {/* Botón de Face ID / Touch ID */}
            {isAvailable && isEnrolled && hasSavedCredentials && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
              >
                <Text style={styles.biometricIcon}>{biometricType === 'Face ID' ? '🔐' : '👆'}</Text>
                <Text style={styles.biometricText}>
                  {t('auth.loginWith')} {biometricType}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                testID="google-signin-button"
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={googleLoading}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.socialButtonText}>{t('auth.continueWithGoogle')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="anonymous-signin-button"
                style={styles.socialButton}
                onPress={async () => {
                  try {
                    const { signInAnonymously } = await import('../services/firebase');
                    await signInAnonymously();
                  } catch (error: any) {
                    Alert.alert(t('common.error'), error.message || t('auth.anonymousError'));
                  }
                }}
              >
                <Text style={styles.anonymousIcon}>👤</Text>
                <Text style={styles.socialButtonText}>{t('auth.continueAnonymous')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="register-link"
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                {t('auth.dontHaveAccount')}{' '}
                <Text style={styles.registerTextBold}>{t('auth.registerButton')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.isDark ? theme.colors.surface : theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    fontSize: 52,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  anonymousIcon: {
    fontSize: 18,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.isDark ? theme.colors.surface : theme.colors.primary + '10',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginTop: 16,
    gap: 8,
  },
  biometricIcon: {
    fontSize: 20,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  registerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  registerTextBold: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
