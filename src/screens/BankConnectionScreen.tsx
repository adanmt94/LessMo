/**
 * Bank Connection Screen
 * Allow users to connect their bank accounts for automatic transaction detection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  BankProvider,
  BankAccount,
  bankProviders,
  connectBankAccount,
  disconnectBankAccount,
} from '../services/bankingService';
import { useAuthContext } from '../context/AuthContext';

interface BankConnectionScreenProps {
  navigation: any;
  route: {
    params: {
      connectedAccounts?: BankAccount[];
      onAccountConnected?: (account: BankAccount) => void;
    };
  };
}

export const BankConnectionScreen: React.FC<BankConnectionScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const language = currentLanguage.code as 'es' | 'en';
  const { user } = useAuthContext();
  const { connectedAccounts = [], onAccountConnected } = route.params || {};

  const [selectedProvider, setSelectedProvider] = useState<BankProvider | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = (provider: BankProvider) => {
    return connectedAccounts.some(acc => acc.provider === provider && acc.isActive);
  };

  const handleConnect = async () => {
    if (!selectedProvider || !username || !password) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'Por favor completa todos los campos'
          : 'Please fill all fields'
      );
      return;
    }

    if (!user) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'Usuario no autenticado' : 'User not authenticated'
      );
      return;
    }

    setIsConnecting(true);

    try {
      const account = await connectBankAccount(user.uid, selectedProvider, {
        username,
        password,
      });

      Alert.alert(
        language === 'es' ? '✅ Conexión exitosa' : '✅ Connection successful',
        language === 'es'
          ? `Tu cuenta ${bankProviders[selectedProvider].name} ha sido conectada correctamente.`
          : `Your ${bankProviders[selectedProvider].name} account has been connected successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onAccountConnected) {
                onAccountConnected(account);
              }
              navigation.goBack();
            },
          },
        ]
      );

      // Reset form
      setSelectedProvider(null);
      setUsername('');
      setPassword('');
    } catch (error: any) {
      Alert.alert(
        language === 'es' ? '❌ Error de conexión' : '❌ Connection error',
        language === 'es'
          ? 'No se pudo conectar con el banco. Verifica tus credenciales.'
          : 'Could not connect to bank. Please verify your credentials.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = (provider: BankProvider) => {
    Alert.alert(
      language === 'es' ? 'Desconectar cuenta' : 'Disconnect account',
      language === 'es'
        ? `¿Seguro que deseas desconectar tu cuenta de ${bankProviders[provider].name}?`
        : `Are you sure you want to disconnect your ${bankProviders[provider].name} account?`,
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Desconectar' : 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const account = connectedAccounts.find(acc => acc.provider === provider);
            if (account) {
              await disconnectBankAccount(account.id);
              Alert.alert(
                language === 'es' ? '✅ Desconectado' : '✅ Disconnected',
                language === 'es'
                  ? 'Tu cuenta ha sido desconectada'
                  : 'Your account has been disconnected'
              );
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {language === 'es' ? '🏦 Conectar Banco' : '🏦 Connect Bank'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {language === 'es'
              ? 'Conecta tu banco para detectar gastos automáticamente'
              : 'Connect your bank to automatically detect expenses'}
          </Text>
        </View>

        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.isDark
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(99, 102, 241, 0.05)',
              borderColor: theme.isDark
                ? 'rgba(99, 102, 241, 0.3)'
                : 'rgba(99, 102, 241, 0.1)',
            },
          ]}
        >
          <Text style={[styles.infoTitle, { color: '#6366F1' }]}>
            {language === 'es' ? '🔒 Seguridad garantizada' : '🔒 Security guaranteed'}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {language === 'es'
              ? '• Usamos cifrado de nivel bancario\n• No almacenamos tus credenciales\n• Conexión mediante Open Banking (PSD2)\n• Puedes desconectar en cualquier momento'
              : '• We use bank-level encryption\n• We don\'t store your credentials\n• Connection via Open Banking (PSD2)\n• You can disconnect at any time'}
          </Text>
        </View>

        {/* Select Bank Provider */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'es' ? 'Selecciona tu banco' : 'Select your bank'}
          </Text>
          <View style={styles.bankGrid}>
            {(Object.keys(bankProviders) as BankProvider[]).map(provider => {
              const bank = bankProviders[provider];
              const connected = isConnected(provider);
              const selected = selectedProvider === provider;

              return (
                <TouchableOpacity
                  key={provider}
                  style={[
                    styles.bankCard,
                    {
                      backgroundColor: selected
                        ? theme.isDark
                          ? 'rgba(99, 102, 241, 0.2)'
                          : 'rgba(99, 102, 241, 0.1)'
                        : theme.colors.card,
                      borderColor: selected
                        ? '#6366F1'
                        : connected
                        ? '#10B981'
                        : theme.colors.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (connected) {
                      handleDisconnect(provider);
                    } else {
                      setSelectedProvider(provider);
                    }
                  }}
                  disabled={isConnecting}
                >
                  <Text style={styles.bankLogo}>{bank.logo}</Text>
                  <Text style={[styles.bankName, { color: theme.colors.text }]}>
                    {bank.name}
                  </Text>
                  {connected && (
                    <View style={[styles.connectedBadge, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.connectedText}>
                        {language === 'es' ? '✓ Conectado' : '✓ Connected'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Login Form (only if provider selected and not connected) */}
        {selectedProvider && !isConnected(selectedProvider) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {language === 'es'
                ? `Credenciales de ${bankProviders[selectedProvider].name}`
                : `${bankProviders[selectedProvider].name} credentials`}
            </Text>

            <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
              {language === 'es'
                ? '⚠️ Modo demostración: Usa cualquier usuario/contraseña'
                : '⚠️ Demo mode: Use any username/password'}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder={language === 'es' ? 'Usuario o DNI' : 'Username or ID'}
              placeholderTextColor={theme.colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isConnecting}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder={language === 'es' ? 'Contraseña' : 'Password'}
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isConnecting}
            />

            <TouchableOpacity
              style={[
                styles.connectButton,
                {
                  backgroundColor: isConnecting ? theme.colors.border : '#6366F1',
                },
              ]}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.connectButtonText}>
                  {language === 'es' ? '🔗 Conectar cuenta' : '🔗 Connect account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'es' ? '✨ Beneficios' : '✨ Benefits'}
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                {language === 'es'
                  ? 'Ahorra tiempo registrando gastos'
                  : 'Save time registering expenses'}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                {language === 'es'
                  ? 'Detección automática de transacciones'
                  : 'Automatic transaction detection'}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🔍</Text>
              <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                {language === 'es'
                  ? 'Sugerencias inteligentes de gastos'
                  : 'Smart expense suggestions'}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                {language === 'es'
                  ? 'Sincronización en tiempo real'
                  : 'Real-time synchronization'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bankCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  bankLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  connectedBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  connectButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitText: {
    fontSize: 15,
    flex: 1,
  },
});
