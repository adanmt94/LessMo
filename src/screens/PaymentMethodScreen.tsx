/**
 * PaymentMethodScreen - Pantalla para seleccionar método de pago
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, CurrencySymbols } from '../types';
import { Button, Card } from '../components/lovable';
import { PaymentMethodIcon } from '../components/PaymentMethodIcon';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  PaymentProvider,
  PaymentInfo,
  processPayment,
  getAvailablePaymentProviders,
  getPaymentProviderName,
} from '../services/payments';

type PaymentMethodScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentMethod'>;
type PaymentMethodScreenRouteProp = RouteProp<RootStackParamList, 'PaymentMethod'>;

interface Props {
  navigation: PaymentMethodScreenNavigationProp;
  route: PaymentMethodScreenRouteProp;
}

export const PaymentMethodScreen: React.FC<Props> = ({ navigation, route }) => {
  const { 
    amount, 
    currency, 
    recipientName, 
    recipientEmail, 
    recipientPhone,
    description,
    eventId,
    eventName 
  } = route.params;
  
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const currencySymbol = CurrencySymbols[currency];

  const [availableProviders, setAvailableProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadAvailableProviders();
  }, []);

  const loadAvailableProviders = async () => {
    setLoading(true);
    try {
      const providers = await getAvailablePaymentProviders();
      setAvailableProviders(providers);
      
      // Seleccionar automáticamente si solo hay uno disponible
      if (providers.length === 1) {
        setSelectedProvider(providers[0]);
      }
    } catch (error) {
      
      Alert.alert('Error', 'No se pudieron cargar los métodos de pago disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedProvider) {
      Alert.alert('Error', 'Selecciona un método de pago');
      return;
    }

    setProcessingPayment(true);

    const paymentInfo: PaymentInfo = {
      amount,
      currency,
      recipientName,
      recipientEmail,
      recipientPhone,
      description: description || `Pago para ${eventName}`,
      eventId,
    };

    try {
      const result = await processPayment(selectedProvider, paymentInfo);

      if (result.success) {
        Alert.alert(
          '✅ Pago Procesado',
          `El pago de ${currencySymbol}${amount.toFixed(2)} ha sido procesado con ${getPaymentProviderName(result.provider)}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Aquí podrías registrar el pago en Firestore
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Error en el pago',
          result.error || 'No se pudo completar el pago. Intenta con otro método.',
          [{ text: 'Reintentar' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al procesar el pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('payment.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('payment.summaryTitle')}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('payment.recipient')}</Text>
            <Text style={styles.summaryValue}>{recipientName}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('payment.amount')}</Text>
            <Text style={styles.summaryAmount}>
              {currencySymbol}{amount.toFixed(2)}
            </Text>
          </View>

          {description && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('payment.concept')}</Text>
              <Text style={styles.summaryValue}>{description}</Text>
            </View>
          )}
        </Card>

        <Text style={styles.sectionTitle}>{t('payment.selectMethod')}</Text>

        {availableProviders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>
              {t('payment.noMethodsAvailable')}
            </Text>
            <Text style={styles.emptySubtext}>
              {t('payment.installApps')}
            </Text>
          </Card>
        ) : (
          <View style={styles.providersContainer}>
            {availableProviders.map((provider) => (
              <TouchableOpacity
                key={provider}
                style={[
                  styles.providerCard,
                  selectedProvider === provider && styles.providerCardSelected,
                  { backgroundColor: theme.colors.surface }
                ]}
                onPress={() => setSelectedProvider(provider)}
                activeOpacity={0.7}
              >
                <View style={styles.providerContent}>
                  <View style={[styles.providerIconContainer, { backgroundColor: theme.colors.background }]}>
                    <PaymentMethodIcon provider={provider} size={56} />
                  </View>
                  <Text style={[styles.providerName, { color: theme.colors.text }]}>
                    {getPaymentProviderName(provider)}
                  </Text>
                </View>
                
                <View style={[
                  styles.providerRadio,
                  selectedProvider === provider && styles.providerRadioSelected,
                ]}>
                  {selectedProvider === provider && (
                    <View style={styles.providerRadioDot} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Button
          title={processingPayment ? t('payment.processing') : `${t('payment.pay')} ${currencySymbol}${amount.toFixed(2)}`}
          onPress={handlePayment}
          disabled={!selectedProvider || processingPayment || availableProviders.length === 0}
          fullWidth
          style={styles.payButton}
          loading={processingPayment}
        />

        {/* QR Code Payment Options */}
        <View style={styles.qrSection}>
          <Text style={styles.qrSectionTitle}>
            {t('payment.alternativeMethod') || 'O genera un código QR'}
          </Text>
          
          <View style={styles.qrButtons}>
            {['bizum', 'paypal', 'generic'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.qrButton,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(99, 102, 241, 0.05)',
                    borderColor: '#6366F1',
                  },
                ]}
                onPress={() => {
                  navigation.navigate('QRCodePayment', {
                    amount,
                    currency,
                    recipientName,
                    recipientPhone,
                    recipientEmail,
                    description,
                    paymentType: type as 'bizum' | 'paypal' | 'venmo' | 'generic',
                  });
                }}
              >
                <Text style={styles.qrButtonIcon}>
                  {type === 'bizum' ? '💳' : type === 'paypal' ? '💙' : '📱'}
                </Text>
                <Text style={[styles.qrButtonText, { color: '#6366F1' }]}>
                  {type === 'bizum' ? 'Bizum QR' : type === 'paypal' ? 'PayPal QR' : 'QR Genérico'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.disclaimer}>
          {t('payment.disclaimer')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  providersContainer: {
    marginBottom: 24,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  providerCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  providerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    padding: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  providerRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerRadioSelected: {
    borderColor: theme.colors.primary,
  },
  providerRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  payButton: {
    marginBottom: 16,
  },
  qrSection: {
    marginBottom: 24,
  },
  qrSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  qrButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  qrButtonIcon: {
    fontSize: 18,
  },
  qrButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
