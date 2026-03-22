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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { Button, Input } from '../components/lovable';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Gradients, Spacing, Radius, Shadows, Typography } from '../theme/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkSavedCredentials();
  }, []);

  // Auto-launch DESACTIVADO - causaba conflictos con el teclado
  // El usuario debe tocar manualmente el botón de Face ID

  const checkSavedCredentials = async () => {
    try {
      const loginMethod = await SecureStore.getItemAsync(STORED_LOGIN_METHOD_KEY);
      
      if (loginMethod === 'google') {
        // Si el último login fue con Google, considerar que hay credenciales guardadas
        setHasSavedCredentials(true);
        
      } else if (loginMethod === 'email') {
        // Si fue con email/password, verificar que existan
        const savedEmail = await SecureStore.getItemAsync(STORED_EMAIL_KEY);
        const savedPassword = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);
        setHasSavedCredentials(!!(savedEmail && savedPassword));
        
      } else {
        setHasSavedCredentials(false);
        
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
        t('auth.biometricLoginFirst')
      );
      return;
    }

    try {
      
      const authenticated = await authenticateWithBiometric();
      
      if (!authenticated) {
        
        return;
      }

      
      
      // Verificar qué método de login se usó la última vez
      const loginMethod = await SecureStore.getItemAsync(STORED_LOGIN_METHOD_KEY);
      
      if (loginMethod === 'google') {
        // Iniciar sesión con Google requiere abrir el navegador
        
        try {
          // Llamar al flujo de Google - esto abrirá el navegador
          await signInWithGoogle();
          
          // Esperar un momento para que el flujo se inicie
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Si después de 3 segundos no hay respuesta, podría haber un problema
          setTimeout(() => {
            if (googleLoading) {
              
            }
          }, 3000);
          
        } catch (err) {
          console.error('❌ Error en Google login desde Face ID:', err);
          Alert.alert(
            t('common.error'),
            t('auth.googleSignInError')
          );
        }
      } else if (loginMethod === 'email') {
        // Recuperar credenciales de email/password
        const savedEmail = await SecureStore.getItemAsync(STORED_EMAIL_KEY);
        const savedPassword = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);

        if (!savedEmail || !savedPassword) {
          Alert.alert(t('common.error'), t('auth.noSavedCredentials'));
          setHasSavedCredentials(false);
          return;
        }

        // Iniciar sesión con las credenciales guardadas
        const success = await signIn(savedEmail, savedPassword);
        if (!success) {
          Alert.alert(t('common.error'), error || t('auth.loginError'));
        }
      } else {
        Alert.alert(
          t('common.error'),
          t('auth.unknownLoginMethod')
        );
      }
    } catch (error) {
      console.error('❌ Error in biometric login:', error);
      Alert.alert(t('common.error'), t('auth.biometricLoginError'));
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
          
        }
      } catch (error) {
        console.error('❌ Error guardando método Google:', error);
      }
    };

    handleGoogleLoginSuccess();
  }, [googleLoading, googleError, isEnabled]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.isDark ? Gradients.heroDark : Gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>💰</Text>
            </View>
            <Text style={styles.title}>Les$Mo</Text>
            <Text style={styles.subtitle}>
              {t('auth.loginSubtitle')}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          style={styles.formScrollView}
        >

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
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="large"
            />

            {/* Botón de Face ID / Touch ID - Siempre visible si biometría disponible */}
            {isAvailable && isEnrolled && biometricType && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={!hasSavedCredentials}
                activeOpacity={hasSavedCredentials ? 0.7 : 1}
              >
                <Text style={styles.biometricIcon}>{biometricType === 'Face ID' ? '🔐' : '👆'}</Text>
                <Text style={[styles.biometricText, !hasSavedCredentials && styles.biometricTextDisabled]}>
                  {hasSavedCredentials 
                    ? `${t('auth.loginWith')} ${biometricType}`
                    : t('auth.activateBiometricHint', { biometricType })
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
              testID="forgot-password-link"
              style={styles.forgotPasswordLink}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

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
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientHeader: {
    paddingBottom: Spacing.xxxl,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  headerSafeArea: {
    paddingTop: Spacing.lg,
  },
  keyboardView: {
    flex: 1,
  },
  formScrollView: {
    flex: 1,
    marginTop: -Spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    fontSize: 44,
  },
  title: {
    ...Typography.largeTitle,
    fontSize: 40,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
    letterSpacing: -1,
  },
  subtitle: {
    ...Typography.callout,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    fontWeight: '500',
  },
  form: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    ...Shadows.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: theme.colors.textTertiary,
    ...Typography.caption1,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: Spacing.sm,
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
    ...Typography.subhead,
    fontWeight: '600',
    color: theme.colors.text,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: theme.isDark ? theme.colors.surface : theme.colors.primary + '10',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  biometricIcon: {
    fontSize: 20,
  },
  biometricText: {
    ...Typography.callout,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  biometricTextDisabled: {
    color: theme.colors.textTertiary,
    fontSize: 13,
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  forgotPasswordText: {
    ...Typography.subhead,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  registerText: {
    ...Typography.subhead,
    color: theme.colors.textSecondary,
  },
  registerTextBold: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
