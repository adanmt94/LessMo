/**
 * Stripe Payment Service
 * Handles real payment processing with Stripe, Apple Pay, and Google Pay
 */

import { Alert, Platform } from 'react-native';
import { 
  initStripe, 
  confirmPayment,
  createPaymentMethod,
  presentApplePay,
  confirmApplePayPayment,
  isPlatformPaySupported,
  PlatformPayButton,
  ApplePay,
  PlatformPay
} from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { logger } from './loggerService';

// Configuración de Stripe desde variables de entorno
const STRIPE_CONFIG = {
  publishableKey: Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY || '',
  merchantIdentifier: Constants.expoConfig?.extra?.APPLE_MERCHANT_ID || 'merchant.com.lessmo.app',
  merchantDisplayName: 'LessMo',
};

export interface StripePaymentInfo {
  amount: number; // En centavos (ej: 1000 = €10.00)
  currency: string; // 'eur', 'usd', etc.
  description: string;
  recipientName: string;
  recipientEmail?: string;
  metadata?: {
    eventId?: string;
    eventName?: string;
    userId?: string;
  };
}

export interface StripePaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  method?: 'apple_pay' | 'google_pay' | 'card';
}

/**
 * Initialize Stripe SDK
 * Call this once when the app starts
 */
export const initializeStripe = async (): Promise<boolean> => {
  try {
    if (!STRIPE_CONFIG.publishableKey) {
      logger.warn('⚠️ Stripe publishable key not configured');
      return false;
    }

    await initStripe({
      publishableKey: STRIPE_CONFIG.publishableKey,
      merchantIdentifier: STRIPE_CONFIG.merchantIdentifier,
      urlScheme: 'lessmo',
    });

    logger.info('✅ Stripe initialized successfully');
    return true;
  } catch (error: any) {
    logger.error('❌ Failed to initialize Stripe:', error);
    return false;
  }
};

/**
 * Check if Apple Pay is available on this device
 */
export const isApplePaySupported = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  
  try {
    const isSupported = await isPlatformPaySupported();
    logger.info(`🍎 Apple Pay supported: ${isSupported}`);
    return isSupported;
  } catch (error) {
    logger.error('❌ Error checking Apple Pay support:', error);
    return false;
  }
};

/**
 * Check if Google Pay is available on this device
 */
export const isGooglePaySupported = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  
  try {
    const isSupported = await isPlatformPaySupported();
    logger.info(`📱 Google Pay supported: ${isSupported}`);
    return isSupported;
  } catch (error) {
    logger.error('❌ Error checking Google Pay support:', error);
    return false;
  }
};

/**
 * Create a Payment Intent on your backend
 * NOTE: This needs to be implemented in your backend (Firebase Functions, etc.)
 */
export const createPaymentIntent = async (
  paymentInfo: StripePaymentInfo
): Promise<{ clientSecret: string; paymentIntentId: string } | null> => {
  try {
    // TODO: Replace with your backend endpoint
    // Example: https://us-central1-lessmo-9023f.cloudfunctions.net/createPaymentIntent
    
    const backendUrl = 'YOUR_BACKEND_URL/create-payment-intent';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        description: paymentInfo.description,
        metadata: paymentInfo.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const data = await response.json();
    logger.info('✅ Payment Intent created:', data.paymentIntentId);
    
    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.id,
    };
  } catch (error: any) {
    logger.error('❌ Error creating payment intent:', error);
    Alert.alert(
      'Error',
      'No se pudo crear la intención de pago. Asegúrate de que el backend está configurado.'
    );
    return null;
  }
};

/**
 * Pay with Apple Pay
 */
export const payWithApplePay = async (
  paymentInfo: StripePaymentInfo
): Promise<StripePaymentResult> => {
  try {
    logger.info('🍎 Starting Apple Pay payment...');

    // Check if Apple Pay is supported
    const supported = await isApplePaySupported();
    if (!supported) {
      return {
        success: false,
        error: 'Apple Pay no está disponible en este dispositivo',
      };
    }

    // Create Payment Intent
    const paymentIntent = await createPaymentIntent(paymentInfo);
    if (!paymentIntent) {
      return {
        success: false,
        error: 'No se pudo crear la intención de pago',
      };
    }

    // Present Apple Pay sheet
    const { error: applePayError } = await presentApplePay({
      clientSecret: paymentIntent.clientSecret,
      cartItems: [
        {
          label: paymentInfo.description,
          amount: (paymentInfo.amount / 100).toFixed(2),
          paymentType: PlatformPay.PaymentType.Immediate,
        },
      ],
      country: 'ES',
      currency: paymentInfo.currency.toUpperCase(),
      requiredBillingContactFields: [PlatformPay.ContactField.EmailAddress],
    });

    if (applePayError) {
      logger.error('❌ Apple Pay error:', applePayError);
      return {
        success: false,
        error: applePayError.message,
      };
    }

    // Confirm the payment
    const { error: confirmError } = await confirmApplePayPayment(
      paymentIntent.clientSecret
    );

    if (confirmError) {
      logger.error('❌ Payment confirmation error:', confirmError);
      return {
        success: false,
        error: confirmError.message,
      };
    }

    logger.info('✅ Apple Pay payment successful!');
    return {
      success: true,
      paymentIntentId: paymentIntent.paymentIntentId,
      method: 'apple_pay',
    };
  } catch (error: any) {
    logger.error('❌ Apple Pay payment failed:', error);
    return {
      success: false,
      error: error.message || 'Error procesando pago con Apple Pay',
    };
  }
};

/**
 * Pay with Google Pay
 */
export const payWithGooglePay = async (
  paymentInfo: StripePaymentInfo
): Promise<StripePaymentResult> => {
  try {
    logger.info('📱 Starting Google Pay payment...');

    // Check if Google Pay is supported
    const supported = await isGooglePaySupported();
    if (!supported) {
      return {
        success: false,
        error: 'Google Pay no está disponible en este dispositivo',
      };
    }

    // Create Payment Intent
    const paymentIntent = await createPaymentIntent(paymentInfo);
    if (!paymentIntent) {
      return {
        success: false,
        error: 'No se pudo crear la intención de pago',
      };
    }

    // Present Google Pay sheet
    const { error: googlePayError } = await presentApplePay({
      clientSecret: paymentIntent.clientSecret,
      cartItems: [
        {
          label: paymentInfo.description,
          amount: (paymentInfo.amount / 100).toFixed(2),
          paymentType: PlatformPay.PaymentType.Immediate,
        },
      ],
      country: 'ES',
      currency: paymentInfo.currency.toUpperCase(),
    });

    if (googlePayError) {
      logger.error('❌ Google Pay error:', googlePayError);
      return {
        success: false,
        error: googlePayError.message,
      };
    }

    // Confirm the payment
    const { error: confirmError } = await confirmApplePayPayment(
      paymentIntent.clientSecret
    );

    if (confirmError) {
      logger.error('❌ Payment confirmation error:', confirmError);
      return {
        success: false,
        error: confirmError.message,
      };
    }

    logger.info('✅ Google Pay payment successful!');
    return {
      success: true,
      paymentIntentId: paymentIntent.paymentIntentId,
      method: 'google_pay',
    };
  } catch (error: any) {
    logger.error('❌ Google Pay payment failed:', error);
    return {
      success: false,
      error: error.message || 'Error procesando pago con Google Pay',
    };
  }
};

/**
 * Pay with regular card (manual entry)
 * This requires using the CardField component in your UI
 */
export const payWithCard = async (
  paymentInfo: StripePaymentInfo,
  paymentMethodId: string
): Promise<StripePaymentResult> => {
  try {
    logger.info('💳 Starting card payment...');

    // Create Payment Intent
    const paymentIntent = await createPaymentIntent(paymentInfo);
    if (!paymentIntent) {
      return {
        success: false,
        error: 'No se pudo crear la intención de pago',
      };
    }

    // Confirm payment with the payment method
    const { error, paymentIntent: confirmedIntent } = await confirmPayment(
      paymentIntent.clientSecret,
      {
        paymentMethodType: 'Card',
        paymentMethodData: {
          paymentMethodId,
        },
      }
    );

    if (error) {
      logger.error('❌ Card payment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    logger.info('✅ Card payment successful!');
    return {
      success: true,
      paymentIntentId: confirmedIntent?.id || paymentIntent.paymentIntentId,
      method: 'card',
    };
  } catch (error: any) {
    logger.error('❌ Card payment failed:', error);
    return {
      success: false,
      error: error.message || 'Error procesando pago con tarjeta',
    };
  }
};

/**
 * Convert amount to cents for Stripe
 * Stripe requires amounts in the smallest currency unit (cents)
 */
export const amountToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Convert cents to display amount
 */
export const centsToAmount = (cents: number): number => {
  return cents / 100;
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount);
};

export default {
  initializeStripe,
  isApplePaySupported,
  isGooglePaySupported,
  payWithApplePay,
  payWithGooglePay,
  payWithCard,
  createPaymentIntent,
  amountToCents,
  centsToAmount,
  formatAmount,
};
