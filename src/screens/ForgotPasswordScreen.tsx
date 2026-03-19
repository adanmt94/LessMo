/**
 * ForgotPasswordScreen - Pantalla de recuperación de contraseña
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Button, Input } from '../components/lovable';
import { resetPassword } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('common.error'), 'Por favor ingresa tu email');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), 'Por favor ingresa un email válido');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      
      Alert.alert(
        '✅ Email enviado',
        `Hemos enviado un email a ${email} con instrucciones para recuperar tu contraseña.\n\nRevisa tu bandeja de entrada y spam.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Error al enviar email de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.emoji}>🔑</Text>
            <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
            <Text style={styles.description}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              testID="email-input"
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="done"
              editable={!loading}
              onSubmitEditing={handleResetPassword}
            />

            <Button
              testID="reset-button"
              title="Enviar enlace de recuperación"
              onPress={handleResetPassword}
              loading={loading}
              fullWidth
              size="large"
            />

            <View style={styles.backContainer}>
              <Text style={styles.backText}>¿Recordaste tu contraseña? </Text>
              <Text
                style={styles.backLink}
                onPress={() => navigation.goBack()}
              >
                Iniciar sesión
              </Text>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  backText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  backLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
