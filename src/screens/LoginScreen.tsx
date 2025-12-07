/**
 * LoginScreen - Pantalla de inicio de sesión
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardEvent,
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
const STORED_LOGIN_METHOD_KEY = 'biometric_login_method';

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkSavedCredentials();

    // Listeners para el teclado
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      (e: KeyboardEvent) => {
        console.log('⌨️ Keyboard will show');
        setKeyboardVisible(true);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        console.log('⌨️ Keyboard will hide');
        setKeyboardVisible(false);
      }
    );

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e: KeyboardEvent) => {
        console.log('⌨️ Keyboard did show, height:', e.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        console.log('⌨️ Keyboard did hide');
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Auto-launch DESACTIVADO - causaba conflictos con el teclado
  // El usuario debe tocar manualmente el botón de Face ID

  const checkSavedCredentials = async () => {
    try {
      const loginMethod = await SecureStore.getItemAsync(STORED_LOGIN_METHOD_KEY);
      
      if (loginMethod === 'google') {
        // Si el último login fue con Google, considerar que hay credenciales guardadas
        setHasSavedCredentials(true);
        console.log('🔐 Credenciales guardadas: Google');
      } else if (loginMethod === 'email') {
        // Si fue con email/password, verificar que existan
        const savedEmail = await SecureStore.getItemAsync(STORED_EMAIL_KEY);
        const savedPassword = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);
        setHasSavedCredentials(!!(savedEmail && savedPassword));
        console.log('🔐 Credenciales guardadas: Email/Password');
      } else {
        setHasSavedCredentials(false);
        console.log('⚠️ No hay credenciales guardadas');
      }
    } catch (error) {
      console.error('Error checking saved credentials:', error);
      setHasSavedCredentials(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!hasSavedCredentials) {
      Alert.alert(
        t('common.error'),
        'Debes iniciar sesión primero y activar Face ID en Ajustes'
      );
      return;
    }

    try {
      console.log('🔐 Starting biometric authentication...');
      const authenticated = await authenticateWithBiometric();
      
      if (!authenticated) {
        console.log('❌ Biometric authentication cancelled or failed');
        return;
      }

      console.log('✅ Biometric authentication successful');
      
      // Verificar qué método de login se usó la última vez
      const loginMethod = await SecureStore.getItemAsync(STORED_LOGIN_METHOD_KEY);
      
      if (loginMethod === 'google') {
        // Iniciar sesión con Google requiere abrir el navegador
        console.log('🔐 Signing in with Google (last used method)...');
        
        try {
          // Llamar al flujo de Google - esto abrirá el navegador
          await signInWithGoogle();
          
          // Esperar un momento para que el flujo se inicie
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Si después de 3 segundos no hay respuesta, podría haber un problema
          setTimeout(() => {
            if (googleLoading) {
              console.log('⚠️ Google login tomando más tiempo del esperado');
            }
          }, 3000);
          
        } catch (err) {
          console.error('❌ Error en Google login desde Face ID:', err);
          Alert.alert(
            t('common.error'),
            'Error al abrir Google Sign-In. Por favor, inicia sesión manualmente.'
          );
        }
      } else if (loginMethod === 'email') {
        // Recuperar credenciales de email/password
        const savedEmail = await SecureStore.getItemAsync(STORED_EMAIL_KEY);
        const savedPassword = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);

        if (!savedEmail || !savedPassword) {
          Alert.alert(t('common.error'), 'No hay credenciales guardadas');
          setHasSavedCredentials(false);
          return;
        }

        // Iniciar sesión con las credenciales guardadas
        console.log('🔐 Signing in with email/password (last used method)...');
        const success = await signIn(savedEmail, savedPassword);
        if (!success) {
          Alert.alert(t('common.error'), error || t('auth.loginError'));
        }
      } else {
        Alert.alert(
          t('common.error'),
          'No se pudo determinar el método de inicio de sesión anterior'
        );
      }
    } catch (error) {
      console.error('❌ Error in biometric login:', error);
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
          await SecureStore.setItemAsync(STORED_LOGIN_METHOD_KEY, 'email');
          await checkSavedCredentials(); // Actualizar estado
          console.log('✅ Credenciales guardadas para Face ID (email/password)');
        } catch (error) {
          console.error('❌ Error guardando credenciales:', error);
        }
      }
      // La navegación se maneja automáticamente en App.tsx
    } else {
      Alert.alert(t('common.error'), error || t('auth.loginError'));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // El éxito se manejará en el useEffect que detecta el login completado
    } catch (err) {
      console.error('❌ Error iniciando Google login:', err);
    }
  };

  // Detectar cuando el usuario ha iniciado sesión exitosamente con Google
  // Para guardar el método Google en Face ID
  useEffect(() => {
    const handleGoogleLoginSuccess = async () => {
      // Solo proceder si Google terminó de cargar y no hay error
      if (googleLoading) return;
      if (googleError) {
        console.log('⚠️ Error en Google login, no guardar credenciales');
        return;
      }
      
      // Solo guardar si Face ID está habilitado
      if (!isEnabled) return;

      try {
        // Pequeño delay para asegurar que el auth state se actualice
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const currentMethod = await SecureStore.getItemAsync(STORED_LOGIN_METHOD_KEY);
        
        // Solo guardar si no está ya guardado (evitar llamadas duplicadas)
        if (currentMethod !== 'google') {
          await SecureStore.setItemAsync(STORED_LOGIN_METHOD_KEY, 'google');
          await SecureStore.deleteItemAsync(STORED_EMAIL_KEY);
          await SecureStore.deleteItemAsync(STORED_PASSWORD_KEY);
          await checkSavedCredentials();
          console.log('✅ Método Google guardado para Face ID');
        }
      } catch (error) {
        console.error('❌ Error guardando método Google:', error);
      }
    };

    handleGoogleLoginSuccess();
  }, [googleLoading, googleError, isEnabled]);

  const handleDismissKeyboard = () => {
    try {
      Keyboard.dismiss();
    } catch (error) {
      console.error('❌ Error dismissing keyboard:', error);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <TouchableWithoutFeedback 
        onPress={handleDismissKeyboard}
        accessible={false}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          bounces={true}
          scrollEnabled={true}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>💰</Text>
            </View>
            <Text style={styles.title}>Les$Mo</Text>
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
              returnKeyType="next"
              editable={!loading && !googleLoading}
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
              returnKeyType="done"
              editable={!loading && !googleLoading}
              onSubmitEditing={handleLogin}
            />

            <Button
              testID="login-button"
              title={t('auth.loginButton')}
              onPress={() => {
                handleDismissKeyboard();
                handleLogin();
              }}
              loading={loading}
              fullWidth
              size="large"
            />

            {/* Botón de Face ID / Touch ID - Siempre visible si biometría disponible */}
            {isAvailable && isEnrolled && biometricType && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={() => {
                  handleDismissKeyboard();
                  handleBiometricLogin();
                }}
                disabled={!hasSavedCredentials}
                activeOpacity={hasSavedCredentials ? 0.7 : 1}
              >
                <Text style={styles.biometricIcon}>{biometricType === 'Face ID' ? '🔐' : '👆'}</Text>
                <Text style={[styles.biometricText, !hasSavedCredentials && styles.biometricTextDisabled]}>
                  {hasSavedCredentials 
                    ? `${t('auth.loginWith')} ${biometricType}`
                    : `Activa ${biometricType} en Ajustes después de iniciar sesión`
                  }
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
                onPress={() => {
                  handleDismissKeyboard();
                  handleGoogleLogin();
                }}
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
      </TouchableWithoutFeedback>
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
  biometricTextDisabled: {
    color: theme.colors.textTertiary,
    fontSize: 13,
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
