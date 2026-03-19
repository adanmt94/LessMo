/**
 * Firebase Functions - Stripe Payment Integration
 * Backend para crear Payment Intents de forma segura
 */

import * as functions from 'firebase-functions';
import Stripe from 'stripe';

// Inicializar Stripe con tu Secret Key
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Crear Payment Intent
 * Endpoint: https://us-central1-lessmo-9023f.cloudfunctions.net/createPaymentIntent
 */
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    // Validar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuario no autenticado'
      );
    }

    const { amount, currency, description, metadata } = data;

    // Validar datos
    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Monto inválido'
      );
    }

    if (!currency || typeof currency !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Moneda inválida'
      );
    }

    // Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // en centavos
      currency: currency.toLowerCase(),
      description: description || 'Pago en LessMo',
      metadata: {
        userId: context.auth.uid,
        userEmail: context.auth.token.email || '',
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Configuración para Apple Pay y Google Pay
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    });

    console.log('✅ Payment Intent created:', paymentIntent.id);

    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  } catch (error: any) {
    console.error('❌ Error creating payment intent:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Webhook para eventos de Stripe
 * Endpoint: https://us-central1-lessmo-9023f.cloudfunctions.net/stripeWebhook
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  try {
    const webhookSecret = functions.config().stripe.webhook_secret;
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

    console.log('📥 Stripe webhook event:', event.type);

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment succeeded:', paymentIntent.id);
        
        // TODO: Actualizar estado del pago en Firestore
        // await updatePaymentStatus(paymentIntent.metadata.paymentId, 'confirmed');
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment failed:', failedPayment.id);
        
        // TODO: Notificar al usuario del fallo
        break;

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge;
        console.log('💰 Refund processed:', refund.id);
        
        // TODO: Actualizar estado del reembolso en Firestore
        break;

      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * Crear reembolso
 * Endpoint: https://us-central1-lessmo-9023f.cloudfunctions.net/createRefund
 */
export const createRefund = functions.https.onCall(async (data, context) => {
  try {
    // Validar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuario no autenticado'
      );
    }

    const { paymentIntentId, amount, reason } = data;

    if (!paymentIntentId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment Intent ID es requerido'
      );
    }

    // Crear reembolso en Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount) : undefined, // Si no se especifica, reembolsa todo
      reason: reason || 'requested_by_customer',
      metadata: {
        userId: context.auth.uid,
      },
    });

    console.log('✅ Refund created:', refund.id);

    return {
      id: refund.id,
      amount: refund.amount,
      status: refund.status,
    };
  } catch (error: any) {
    console.error('❌ Error creating refund:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Obtener estado de pago
 * Endpoint: https://us-central1-lessmo-9023f.cloudfunctions.net/getPaymentStatus
 */
export const getPaymentStatus = functions.https.onCall(async (data, context) => {
  try {
    // Validar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuario no autenticado'
      );
    }

    const { paymentIntentId } = data;

    if (!paymentIntentId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment Intent ID es requerido'
      );
    }

    // Obtener Payment Intent de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata,
    };
  } catch (error: any) {
    console.error('❌ Error getting payment status:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});
