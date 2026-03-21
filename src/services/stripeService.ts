/**
 * Stripe Payment Service
 * Handles real payment processing with Stripe, Apple Pay, and Google Pay
 */

import { Alert, Platform } from 'react-native';
import { 
  initStripe, 
  confirmPayment,
  createPaymentMethod,
  isPlatformPaySupported,
  PlatformPayButton,
  PlatformPay
} from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { logger, LogCategory } from '../utils/logger';

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
      logger.warn(LogCategory.FEATURE, '⚠️ Stripe publishable key not configured');
      return false;
    }

    await initStripe({
      publishableKey: STRIPE_CONFIG.publishableKey,
      merchantIdentifier: STRIPE_CONFIG.merchantIdentifier,
      urlScheme: 'lessmo',
    });

    logger.info(LogCategory.FEATURE, '✅ Stripe initialized successfully');
    return true;
  } catch (error: any) {
    logger.error(LogCategory.FEATURE, '❌ Failed to initialize Stripe:', error);
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
    logger.info(LogCategory.FEATURE, `🍎 Apple Pay supported: ${isSupported}`);
    return isSupported;
  } catch (error) {
    logger.error(LogCategory.FEATURE, '❌ Error checking Apple Pay support:', String(error));
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
    logger.info(LogCategory.FEATURE, `📱 Google Pay supported: ${isSupported}`);
    return isSupported;
  } catch (error) {
    logger.error(LogCategory.FEATURE, '❌ Error checking Google Pay support:', String(error));
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
    // Backend URL from environment variables
    const backendUrl = Constants.expoConfig?.extra?.STRIPE_BACKEND_URL;
    
    if (!backendUrl) {
      logger.warn(LogCategory.FEATURE, '⚠️ STRIPE_BACKEND_URL not configured - payment intent cannot be created');
      Alert.alert(
        'Configuración pendiente',
        'El servicio de pagos no está configurado todavía.'
      );
      return null;
    }
    
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
    logger.info(LogCategory.FEATURE, '✅ Payment Intent created:', data.paymentIntentId);
    
    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.id,
    };
  } catch (error: any) {
    logger.error(LogCategory.FEATURE, '❌ Error creating payment intent:', error);
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
    logger.info(LogCategory.FEATURE, '🍎 Starting Apple Pay payment...');

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
    const { error: applePayError } = await confirmPayment(
      paymentIntent.clientSecret,
      {
        paymentMethodType: 'Card',
      }
    );

    if (applePayError) {
      logger.error(LogCategory.FEATURE, '❌ Apple Pay error:', applePayError.message);
      return {
        success: false,
        error: applePayError.message,
      };
    }

    // Confirm the payment
    logger.info(LogCategory.FEATURE, '✅ Apple Pay payment successful!');
    return {
      success: true,
      paymentIntentId: paymentIntent.paymentIntentId,
      method: 'apple_pay',
    };
  } catch (error: any) {
    logger.error(LogCategory.FEATURE, '❌ Apple Pay payment failed:', error);
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
    logger.info(LogCategory.FEATURE, '📱 Starting Google Pay payment...');

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
    const { error: googlePayError } = await confirmPayment(
      paymentIntent.clientSecret,
      {
        paymentMethodType: 'Card',
      }
    );

    if (googlePayError) {
      logger.error(LogCategory.FEATURE, '❌ Google Pay error:', googlePayError.message);
      return {
        success: false,
        error: googlePayError.message,
      };
    }

    // Confirm the payment
    logger.info(LogCategory.FEATURE, '✅ Google Pay payment successful!');
    return {
      success: true,
      paymentIntentId: paymentIntent.paymentIntentId,
      method: 'google_pay',
    };
  } catch (error: any) {
    logger.error(LogCategory.FEATURE, '❌ Google Pay payment failed:', error);
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
    logger.info(LogCategory.FEATURE, '💳 Starting card payment...');

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
      logger.error(LogCategory.FEATURE, '❌ Card payment error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }

    logger.info(LogCategory.FEATURE, '✅ Card payment successful!');
    return {
      success: true,
      paymentIntentId: confirmedIntent?.id || paymentIntent.paymentIntentId,
      method: 'card',
    };
  } catch (error: any) {
    logger.error(LogCategory.FEATURE, '❌ Card payment failed:', error);
    return {
      success: false,
      error: error.message || 'Error procesando pago con tarjeta',
    };
  }
};

// Stripe zero-decimal currencies (amount is already in smallest unit)
const ZERO_DECIMAL_CURRENCIES = ['JPY', 'CLP', 'KRW', 'VND', 'BIF', 'CLP', 'DJF', 'GNF', 'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF'];

/**
 * Convert amount to smallest currency unit for Stripe
 * Most currencies use cents (x100), but JPY, CLP etc. are zero-decimal
 */
export const amountToCents = (amount: number, currency?: string): number => {
  if (currency && ZERO_DECIMAL_CURRENCIES.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
};

/**
 * Convert smallest currency unit to display amount
 */
export const centsToAmount = (cents: number, currency?: string): number => {
  if (currency && ZERO_DECIMAL_CURRENCIES.includes(currency.toUpperCase())) {
    return cents;
  }
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
