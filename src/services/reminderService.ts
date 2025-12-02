/**
 * Smart Reminders Service
 * Configurable notification system for pending payments using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, Participant } from '../types';

export type ReminderFrequency = 'never' | 'daily' | 'weekly';

export interface ReminderSettings {
  userId: string;
  frequency: ReminderFrequency;
  enabled: boolean;
  quietHoursStart: number; // 0-23
  quietHoursEnd: number; // 0-23
  lastReminderSent?: Date;
}

export interface PendingPayment {
  eventId: string;
  eventName: string;
  amount: number;
  currency: string;
  recipientName: string;
  recipientId: string;
  dueDate?: Date;
}

const STORAGE_KEY_SETTINGS = '@reminders_settings';
const STORAGE_KEY_DISMISSED = '@reminders_dismissed';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('payment-reminders', {
      name: 'Payment Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  return true;
};

/**
 * Get reminder settings for user
 */
export const getReminderSettings = async (userId: string): Promise<ReminderSettings> => {
  try {
    const stored = await AsyncStorage.getItem(`${STORAGE_KEY_SETTINGS}_${userId}`);
    if (stored) {
      const settings = JSON.parse(stored);
      // Convert lastReminderSent back to Date if exists
      if (settings.lastReminderSent) {
        settings.lastReminderSent = new Date(settings.lastReminderSent);
      }
      return settings;
    }
  } catch (error) {
    console.error('Error loading reminder settings:', error);
  }

  // Default settings
  return {
    userId,
    frequency: 'daily',
    enabled: true,
    quietHoursStart: 22, // 10 PM
    quietHoursEnd: 8, // 8 AM
  };
};

/**
 * Save reminder settings for user
 */
export const saveReminderSettings = async (settings: ReminderSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      `${STORAGE_KEY_SETTINGS}_${settings.userId}`,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error('Error saving reminder settings:', error);
  }
};

/**
 * Check if current time is within quiet hours
 */
const isQuietHours = (settings: ReminderSettings): boolean => {
  const now = new Date();
  const currentHour = now.getHours();

  if (settings.quietHoursStart < settings.quietHoursEnd) {
    // Normal range (e.g., 22-8 wraps around midnight)
    return currentHour >= settings.quietHoursStart || currentHour < settings.quietHoursEnd;
  } else {
    // Wrapped range
    return currentHour >= settings.quietHoursStart && currentHour < settings.quietHoursEnd;
  }
};

/**
 * Check if reminder should be sent based on frequency and last sent time
 */
const shouldSendReminder = (settings: ReminderSettings): boolean => {
  if (!settings.enabled || settings.frequency === 'never') {
    return false;
  }

  if (isQuietHours(settings)) {
    return false;
  }

  if (!settings.lastReminderSent) {
    return true;
  }

  const now = new Date();
  const lastSent = new Date(settings.lastReminderSent);
  const hoursSinceLastReminder = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

  if (settings.frequency === 'daily') {
    return hoursSinceLastReminder >= 24;
  } else if (settings.frequency === 'weekly') {
    return hoursSinceLastReminder >= 168; // 7 days
  }

  return false;
};

/**
 * Schedule a reminder notification
 */
export const scheduleReminder = async (
  userId: string,
  pendingPayments: PendingPayment[]
): Promise<void> => {
  const settings = await getReminderSettings(userId);

  if (!shouldSendReminder(settings)) {
    return;
  }

  if (pendingPayments.length === 0) {
    return;
  }

  // Calculate total amount owed
  const totalAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const currency = pendingPayments[0]?.currency || 'EUR';

  // Create notification content
  let title: string;
  let body: string;

  if (pendingPayments.length === 1) {
    const payment = pendingPayments[0];
    title = `💰 Pago pendiente`;
    body = `Debes ${payment.amount.toFixed(2)} ${currency} a ${payment.recipientName} por "${payment.eventName}"`;
  } else {
    title = `💰 ${pendingPayments.length} pagos pendientes`;
    body = `Total a pagar: ${totalAmount.toFixed(2)} ${currency} en ${pendingPayments.length} eventos`;
  }

  // Schedule notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        type: 'payment-reminder',
        pendingPayments: pendingPayments.map(p => ({
          eventId: p.eventId,
          amount: p.amount,
        })),
      },
      categoryIdentifier: 'payment-reminder',
    },
    trigger: null, // Send immediately
  });

  // Update last reminder sent time
  settings.lastReminderSent = new Date();
  await saveReminderSettings(settings);
};

/**
 * Dismiss reminder for today
 */
export const dismissReminderForToday = async (userId: string, eventId: string): Promise<void> => {
  try {
    const key = `${STORAGE_KEY_DISMISSED}_${userId}_${eventId}`;
    const dismissedUntil = new Date();
    dismissedUntil.setHours(23, 59, 59, 999); // End of today
    await AsyncStorage.setItem(key, (dismissedUntil instanceof Date ? dismissedUntil : new Date(dismissedUntil)).toISOString());
  } catch (error) {
    console.error('Error dismissing reminder:', error);
  }
};

/**
 * Check if reminder is dismissed for today
 */
export const isReminderDismissed = async (userId: string, eventId: string): Promise<boolean> => {
  try {
    const key = `${STORAGE_KEY_DISMISSED}_${userId}_${eventId}`;
    const dismissedUntilStr = await AsyncStorage.getItem(key);
    
    if (!dismissedUntilStr) {
      return false;
    }

    const dismissedUntil = new Date(dismissedUntilStr);
    const now = new Date();

    return now < dismissedUntil;
  } catch (error) {
    console.error('Error checking dismissed reminder:', error);
    return false;
  }
};

/**
 * Set up notification response listener
 */
export const setupNotificationResponseListener = (
  onReminderAction: (action: 'view' | 'dismiss' | 'markAsPaid', eventId: string) => void
) => {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    
    if (data.type === 'payment-reminder' && data.pendingPayments && Array.isArray(data.pendingPayments) && data.pendingPayments.length > 0) {
      const firstPayment = data.pendingPayments[0] as { eventId: string; amount: number };
      
      // Handle action based on response
      if (response.actionIdentifier === 'dismiss') {
        onReminderAction('dismiss', firstPayment.eventId);
      } else if (response.actionIdentifier === 'markAsPaid') {
        onReminderAction('markAsPaid', firstPayment.eventId);
      } else {
        onReminderAction('view', firstPayment.eventId);
      }
    }
  });
};

/**
 * Configure notification categories with actions
 */
export const configureNotificationCategories = async (): Promise<void> => {
  await Notifications.setNotificationCategoryAsync('payment-reminder', [
    {
      identifier: 'dismiss',
      buttonTitle: 'Recordar mañana',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'markAsPaid',
      buttonTitle: 'Marcar como pagado',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);
};

/**
 * Cancel all scheduled reminders
 */
export const cancelAllReminders = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get pending notification count
 */
export const getPendingNotificationCount = async (): Promise<number> => {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.length;
};
