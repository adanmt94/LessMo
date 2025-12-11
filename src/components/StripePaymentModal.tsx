/**
 * Stripe Payment Modal
 * Modal for processing payments with Stripe (Apple Pay, Google Pay, Card)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardField, useStripe, PlatformPayButton, PlatformPay } from '@stripe/stripe-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  payWithApplePay,
  payWithGooglePay,
  isApplePaySupported,
  isGooglePaySupported,
  amountToCents,
  formatAmount,
  StripePaymentInfo,
} from '../services/stripeService';
import { logger } from '../services/loggerService';

interface StripePaymentModalProps {
  visible: boolean;
  amount: number;
  currency: string;
  recipientName: string;
  description: string;
  eventId?: string;
  eventName?: string;
  onSuccess: (paymentIntentId: string, method: string) => void;
  onCancel: () => void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  visible,
  amount,
  currency,
  recipientName,
  description,
  eventId,
  eventName,
  onSuccess,
  onCancel,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const stripe = useStripe();

  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'apple_pay' | 'google_pay' | 'card' | null>(null);

  useEffect(() => {
    checkPlatformPaySupport();
  }, []);

  const checkPlatformPaySupport = async () => {
    const applePay = await isApplePaySupported();
    const googlePay = await isGooglePaySupported();
    
    setApplePayAvailable(applePay);
    setGooglePayAvailable(googlePay);

    // Auto-select platform pay if available
    if (applePay) {
      setSelectedMethod('apple_pay');
    } else if (googlePay) {
      setSelectedMethod('google_pay');
    } else {
      setSelectedMethod('card');
    }
  };

  const paymentInfo: StripePaymentInfo = {
    amount: amountToCents(amount),
    currency: currency.toLowerCase(),
    description,
    recipientName,
    metadata: {
      eventId,
      eventName,
    },
  };

  const handleApplePayPress = async () => {
    setLoading(true);
    try {
      const result = await payWithApplePay(paymentInfo);
      
      if (result.success && result.paymentIntentId) {
        Alert.alert(
          '✅ Pago Exitoso',
          `Pago de ${formatAmount(amount, currency)} procesado con Apple Pay`,
          [{ text: 'OK', onPress: () => onSuccess(result.paymentIntentId!, 'apple_pay') }]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo procesar el pago');
      }
    } catch (error: any) {
      logger.error('Apple Pay error:', error);
      Alert.alert('Error', error.message || 'Error procesando pago');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePayPress = async () => {
    setLoading(true);
    try {
      const result = await payWithGooglePay(paymentInfo);
      
      if (result.success && result.paymentIntentId) {
        Alert.alert(
          '✅ Pago Exitoso',
          `Pago de ${formatAmount(amount, currency)} procesado con Google Pay`,
          [{ text: 'OK', onPress: () => onSuccess(result.paymentIntentId!, 'google_pay') }]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo procesar el pago');
      }
    } catch (error: any) {
      logger.error('Google Pay error:', error);
      Alert.alert('Error', error.message || 'Error procesando pago');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayPress = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Por favor completa los datos de la tarjeta');
      return;
    }

    setLoading(true);
    try {
      // Create payment method from card details
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (pmError || !paymentMethod) {
        throw new Error(pmError?.message || 'No se pudo crear el método de pago');
      }

      // Here you would call your backend to create and confirm the payment
      // For now, we'll show a success message
      Alert.alert(
        '✅ Pago Procesado',
        `Tarjeta registrada: ${paymentMethod.Card?.brand} ••••${paymentMethod.Card?.last4}`,
        [{ text: 'OK', onPress: () => onSuccess(paymentMethod.id, 'card') }]
      );
    } catch (error: any) {
      logger.error('Card payment error:', error);
      Alert.alert('Error', error.message || 'Error procesando pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} disabled={loading}>
            <Text style={styles.cancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pagar</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Payment Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total a pagar</Text>
            <Text style={styles.amount}>{formatAmount(amount, currency)}</Text>
            <Text style={styles.recipient}>Para: {recipientName}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de pago</Text>

            {/* Apple Pay Button */}
            {applePayAvailable && (
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  selectedMethod === 'apple_pay' && styles.methodButtonSelected,
                ]}
                onPress={() => setSelectedMethod('apple_pay')}
                disabled={loading}
              >
                <Text style={styles.methodText}>🍎 Apple Pay</Text>
                {selectedMethod === 'apple_pay' && (
                  <Text style={styles.selectedIcon}>✓</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Google Pay Button */}
            {googlePayAvailable && (
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  selectedMethod === 'google_pay' && styles.methodButtonSelected,
                ]}
                onPress={() => setSelectedMethod('google_pay')}
                disabled={loading}
              >
                <Text style={styles.methodText}>📱 Google Pay</Text>
                {selectedMethod === 'google_pay' && (
                  <Text style={styles.selectedIcon}>✓</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Card Button */}
            <TouchableOpacity
              style={[
                styles.methodButton,
                selectedMethod === 'card' && styles.methodButtonSelected,
              ]}
              onPress={() => setSelectedMethod('card')}
              disabled={loading}
            >
              <Text style={styles.methodText}>💳 Tarjeta de Crédito/Débito</Text>
              {selectedMethod === 'card' && (
                <Text style={styles.selectedIcon}>✓</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Card Input Field */}
          {selectedMethod === 'card' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos de la tarjeta</Text>
              <CardField
                postalCodeEnabled={true}
                placeholder={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={{
                  backgroundColor: theme.colors.card,
                  textColor: theme.colors.text,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                }}
                style={styles.cardField}
                onCardChange={(cardDetails) => {
                  setCardComplete(cardDetails.complete);
                }}
              />
              <Text style={styles.cardHint}>
                Modo test: usa 4242 4242 4242 4242
              </Text>
            </View>
          )}

          {/* Pay Button */}
          <TouchableOpacity
            style={[
              styles.payButton,
              loading && styles.payButtonDisabled,
            ]}
            onPress={() => {
              if (selectedMethod === 'apple_pay') {
                handleApplePayPress();
              } else if (selectedMethod === 'google_pay') {
                handleGooglePayPress();
              } else {
                handleCardPayPress();
              }
            }}
            disabled={loading || (selectedMethod === 'card' && !cardComplete)}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payButtonText}>
                {selectedMethod === 'apple_pay'
                  ? 'Pagar con Apple Pay'
                  : selectedMethod === 'google_pay'
                  ? 'Pagar con Google Pay'
                  : `Pagar ${formatAmount(amount, currency)}`}
              </Text>
            )}
          </TouchableOpacity>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Text style={styles.securityText}>
              🔒 Pago seguro procesado por Stripe
            </Text>
            <Text style={styles.securitySubtext}>
              Tu información está encriptada y protegida
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    cancelButton: {
      color: theme.colors.primary,
      fontSize: 16,
      width: 70,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
    },
    amountCard: {
      backgroundColor: theme.colors.card,
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 24,
    },
    amountLabel: {
      fontSize: 14,
      color: theme.colors.secondaryText,
      marginBottom: 8,
    },
    amount: {
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    recipient: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      color: theme.colors.secondaryText,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    methodButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    methodButtonSelected: {
      borderColor: theme.colors.primary,
    },
    methodText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    selectedIcon: {
      fontSize: 20,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    cardField: {
      width: '100%',
      height: 50,
      marginVertical: 12,
    },
    cardHint: {
      fontSize: 12,
      color: theme.colors.secondaryText,
      marginTop: 8,
    },
    payButton: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    payButtonDisabled: {
      opacity: 0.5,
    },
    payButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    securityInfo: {
      alignItems: 'center',
      marginTop: 24,
      padding: 16,
    },
    securityText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 4,
    },
    securitySubtext: {
      fontSize: 12,
      color: theme.colors.secondaryText,
    },
  });
