/**
 * Servicio de Confirmación de Pagos
 * Sistema para marcar pagos como realizados con confirmación bilateral
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, setDoc, updateDoc, getDocs, query, where, orderBy, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger, LogCategory } from '../utils/logger';
import { Settlement } from '../types';

const STORAGE_KEY_PENDING_PAYMENTS = '@pending_payments';

/**
 * Función helper para parsear fechas de Firestore de forma consistente
 * Maneja Timestamps, Dates y strings
 */
const parseDate = (dateField: any): Date | undefined => {
  if (!dateField) return undefined;
  if (dateField instanceof Date) return dateField;
  if (dateField?.toDate && typeof dateField.toDate === 'function') {
    return dateField.toDate();
  }
  if (typeof dateField === 'string' || typeof dateField === 'number') {
    const parsed = new Date(dateField);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

export type PaymentStatus = 'pending' | 'sent_waiting_confirmation' | 'confirmed' | 'rejected' | 'cancelled';

export type PaymentMethod = 'bizum' | 'paypal' | 'venmo' | 'apple_pay' | 'google_pay' | 'stripe' | 'bank_transfer' | 'cash' | 'other';

export interface Payment {
  id: string;
  eventId: string;
  eventName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  reference?: string; // Referencia del pago (ej: número de transacción)
  note?: string;
  proofPhotoUrl?: string; // URL de comprobante de pago
  createdAt: Date;
  markedAsPaidAt?: Date;
  confirmedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  lastUpdatedBy: string;
}

export interface PaymentHistory {
  payments: Payment[];
  totalPaid: number;
  totalPending: number;
  totalRejected: number;
}

/**
 * Crear un nuevo pago
 */
export async function createPayment(
  eventId: string,
  eventName: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  amount: number,
  currency: string,
  paymentMethod?: PaymentMethod,
  reference?: string,
  note?: string
): Promise<Payment> {
  try {
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payment: Payment = {
      id: paymentId,
      eventId,
      eventName,
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      amount,
      currency,
      status: 'pending',
      paymentMethod,
      reference,
      note,
      createdAt: new Date(),
      lastUpdatedBy: fromUserId,
    };
    
    // Guardar en Firestore
    await setDoc(doc(db, 'payments', paymentId), {
      ...payment,
      createdAt: Timestamp.fromDate(payment.createdAt),
    });
    
    // Guardar en cache local
    await savePaymentToCache(payment);
    
    logger.info(LogCategory.FEATURE, 'Payment created', { paymentId, amount });
    
    return payment;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error creating payment', error);
    throw error;
  }
}

/**
 * Marcar pago como enviado (esperando confirmación)
 */
export async function markPaymentAsSent(
  paymentId: string,
  userId: string,
  paymentMethod: PaymentMethod,
  reference?: string,
  proofPhotoUrl?: string
): Promise<void> {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    
    const updates = {
      status: 'sent_waiting_confirmation' as PaymentStatus,
      paymentMethod,
      reference,
      proofPhotoUrl,
      markedAsPaidAt: Timestamp.now(),
      lastUpdatedBy: userId,
    };
    
    await updateDoc(paymentRef, updates);
    
    // Actualizar cache
    await updatePaymentInCache(paymentId, {
      status: 'sent_waiting_confirmation',
      paymentMethod,
      reference,
      proofPhotoUrl,
      markedAsPaidAt: new Date(),
      lastUpdatedBy: userId,
    });
    
    // Enviar notificación al receptor
    await notifyPaymentSent(paymentId);
    
    logger.info(LogCategory.FEATURE, 'Payment marked as sent', { paymentId, paymentMethod });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error marking payment as sent', error);
    throw error;
  }
}

/**
 * Confirmar pago recibido
 */
export async function confirmPayment(paymentId: string, userId: string): Promise<void> {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    
    await updateDoc(paymentRef, {
      status: 'confirmed',
      confirmedAt: Timestamp.now(),
      lastUpdatedBy: userId,
    });
    
    // Actualizar cache
    await updatePaymentInCache(paymentId, {
      status: 'confirmed',
      confirmedAt: new Date(),
      lastUpdatedBy: userId,
    });
    
    // Enviar notificación al pagador
    await notifyPaymentConfirmed(paymentId);
    
    logger.info(LogCategory.FEATURE, 'Payment confirmed', { paymentId });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error confirming payment', error);
    throw error;
  }
}

/**
 * Rechazar pago
 */
export async function rejectPayment(
  paymentId: string,
  userId: string,
  reason: string
): Promise<void> {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    
    await updateDoc(paymentRef, {
      status: 'rejected',
      rejectedAt: Timestamp.now(),
      rejectionReason: reason,
      lastUpdatedBy: userId,
    });
    
    // Actualizar cache
    await updatePaymentInCache(paymentId, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason,
      lastUpdatedBy: userId,
    });
    
    // Enviar notificación al pagador
    await notifyPaymentRejected(paymentId, reason);
    
    logger.info(LogCategory.FEATURE, 'Payment rejected', { paymentId, reason });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error rejecting payment', error);
    throw error;
  }
}

/**
 * Obtener pagos de un evento
 */
export async function getEventPayments(eventId: string): Promise<Payment[]> {
  try {
    // Intentar desde cache primero
    const cached = await getPaymentsFromCache();
    const eventPayments = cached.filter(p => p.eventId === eventId);
    if (eventPayments.length > 0) {
      return eventPayments;
    }
    
    // Si no hay cache, obtener de Firestore
    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef,
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    const payments: Payment[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: parseDate(data.createdAt) || new Date(),
        markedAsPaidAt: parseDate(data.markedAsPaidAt),
        confirmedAt: parseDate(data.confirmedAt),
        rejectedAt: parseDate(data.rejectedAt),
      } as Payment;
    });
    
    // Guardar en cache
    await savePaymentsToCache(payments);
    
    return payments;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error getting event payments', error);
    return [];
  }
}

/**
 * Obtener historial de pagos entre dos usuarios
 */
export async function getPaymentHistoryBetweenUsers(
  userId1: string,
  userId2: string,
  eventId?: string
): Promise<Payment[]> {
  try {
    const paymentsRef = collection(db, 'payments');
    let q = query(paymentsRef, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    
    const payments: Payment[] = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: parseDate(data.createdAt) || new Date(),
          markedAsPaidAt: parseDate(data.markedAsPaidAt),
          confirmedAt: parseDate(data.confirmedAt),
          rejectedAt: parseDate(data.rejectedAt),
        } as Payment;
      })
      .filter(p => {
        const matchesUsers = 
          (p.fromUserId === userId1 && p.toUserId === userId2) ||
          (p.fromUserId === userId2 && p.toUserId === userId1);
        const matchesEvent = !eventId || p.eventId === eventId;
        return matchesUsers && matchesEvent;
      });
    
    return payments;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error getting payment history', error);
    return [];
  }
}

/**
 * Obtener estadísticas de pagos
 */
export async function getPaymentStats(eventId: string): Promise<PaymentHistory> {
  try {
    const payments = await getEventPayments(eventId);
    
    const totalPaid = payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalPending = payments
      .filter(p => p.status === 'pending' || p.status === 'sent_waiting_confirmation')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalRejected = payments
      .filter(p => p.status === 'rejected')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return {
      payments,
      totalPaid,
      totalPending,
      totalRejected,
    };
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error getting payment stats', error);
    return {
      payments: [],
      totalPaid: 0,
      totalPending: 0,
      totalRejected: 0,
    };
  }
}

/**
 * Cancelar pago
 */
export async function cancelPayment(paymentId: string, userId: string): Promise<void> {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    
    await updateDoc(paymentRef, {
      status: 'cancelled',
      lastUpdatedBy: userId,
    });
    
    // Actualizar cache
    await updatePaymentInCache(paymentId, {
      status: 'cancelled',
      lastUpdatedBy: userId,
    });
    
    logger.info(LogCategory.FEATURE, 'Payment cancelled', { paymentId });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error cancelling payment', error);
    throw error;
  }
}

/**
 * Eliminar pago
 */
export async function deletePayment(paymentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'payments', paymentId));
    
    // Eliminar de cache
    const cached = await getPaymentsFromCache();
    const filtered = cached.filter(p => p.id !== paymentId);
    await savePaymentsToCache(filtered);
    
    logger.info(LogCategory.FEATURE, 'Payment deleted', { paymentId });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error deleting payment', error);
    throw error;
  }
}

/**
 * Generar link de pago directo
 */
export function generatePaymentLink(
  method: PaymentMethod,
  recipient: string,
  amount: number,
  note?: string
): string | null {
  try {
    const noteParam = note ? encodeURIComponent(note) : '';
    
    switch (method) {
      case 'bizum':
        // Bizum no tiene deep links públicos, se usa manualmente
        return null;
      
      case 'paypal':
        // PayPal.me link - funciona en web y app
        const paypalUser = recipient.replace('@', '');
        const paypalNote = note ? `&note=${noteParam}` : '';
        return `https://paypal.me/${paypalUser}/${amount}${paypalNote}`;
      
      case 'venmo':
        // Venmo deep link - abre la app directamente
        const venmoUser = recipient.replace('@', '');
        const venmoNote = note ? `&note=${noteParam}` : '';
        return `venmo://paycharge?txn=pay&recipients=${venmoUser}&amount=${amount}${venmoNote}`;
      
      case 'apple_pay':
        // Apple Pay se usa a través de contactos o apps que lo soporten
        // No tiene deep link directo universal
        return null;
      
      case 'google_pay':
        // Google Pay deep link para enviar dinero
        // Formato: gpay://upi/pay?pa=recipient&am=amount&tn=note
        const gpayNote = note ? `&tn=${noteParam}` : '';
        return `https://pay.google.com/gp/v/send?amount=${amount}${gpayNote}`;
      
      case 'stripe':
        // Stripe se maneja internamente en la app con modal de pago
        // No tiene deep link externo
        return null;
      
      case 'bank_transfer':
        // Transferencia bancaria es manual, no tiene deep link
        return null;
      
      case 'cash':
        // Efectivo es manual, no tiene deep link
        return null;
      
      case 'other':
        // Método genérico, no tiene deep link
        return null;
      
      default:
        return null;
    }
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error generating payment link', error);
    return null;
  }
}

/**
 * Obtener pagos pendientes de confirmación para un usuario
 */
export async function getPendingConfirmations(userId: string): Promise<Payment[]> {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef,
      where('toUserId', '==', userId),
      where('status', '==', 'sent_waiting_confirmation'),
      orderBy('markedAsPaidAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: parseDate(data.createdAt) || new Date(),
        markedAsPaidAt: parseDate(data.markedAsPaidAt),
        confirmedAt: parseDate(data.confirmedAt),
        rejectedAt: parseDate(data.rejectedAt),
      } as Payment;
    });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error getting pending confirmations', error);
    return [];
  }
}

// === Funciones de Notificaciones ===

async function notifyPaymentSent(paymentId: string): Promise<void> {
  try {
    const payments = await getPaymentsFromCache();
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    // Aquí se integraría con el servicio de notificaciones
    logger.info(LogCategory.NOTIFICATION, 'Payment sent notification', {
      to: payment.toUserName,
      amount: payment.amount,
    });
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error sending payment notification', error);
  }
}

async function notifyPaymentConfirmed(paymentId: string): Promise<void> {
  try {
    const payments = await getPaymentsFromCache();
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    logger.info(LogCategory.NOTIFICATION, 'Payment confirmed notification', {
      to: payment.fromUserName,
      amount: payment.amount,
    });
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error sending confirmation notification', error);
  }
}

async function notifyPaymentRejected(paymentId: string, reason: string): Promise<void> {
  try {
    const payments = await getPaymentsFromCache();
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    logger.info(LogCategory.NOTIFICATION, 'Payment rejected notification', {
      to: payment.fromUserName,
      reason,
    });
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error sending rejection notification', error);
  }
}

// === Funciones de Cache ===

async function getPaymentsFromCache(): Promise<Payment[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_PENDING_PAYMENTS);
    if (!cached) return [];
    
    const parsed = JSON.parse(cached);
    return parsed.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      markedAsPaidAt: p.markedAsPaidAt ? new Date(p.markedAsPaidAt) : undefined,
      confirmedAt: p.confirmedAt ? new Date(p.confirmedAt) : undefined,
      rejectedAt: p.rejectedAt ? new Date(p.rejectedAt) : undefined,
    }));
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error getting payments from cache', error);
    return [];
  }
}

async function savePaymentsToCache(payments: Payment[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PENDING_PAYMENTS, JSON.stringify(payments));
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error saving payments to cache', error);
  }
}

async function savePaymentToCache(payment: Payment): Promise<void> {
  try {
    const cached = await getPaymentsFromCache();
    cached.push(payment);
    await savePaymentsToCache(cached);
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error saving payment to cache', error);
  }
}

async function updatePaymentInCache(
  paymentId: string,
  updates: Partial<Payment>
): Promise<void> {
  try {
    const cached = await getPaymentsFromCache();
    const updated = cached.map(p =>
      p.id === paymentId ? { ...p, ...updates } : p
    );
    await savePaymentsToCache(updated);
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error updating payment in cache', error);
  }
}
