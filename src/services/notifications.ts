/**
 * Servicio de Notificaciones Push
 * Maneja el registro, permisos y envío de notificaciones locales y push
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configurar comportamiento de notificaciones
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
 * Registrar para recibir notificaciones push
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId ?? 'your-project-id',
      })).data;
      
    } catch (error) {
      
    }
  } else {
    
  }

  return token;
}

/**
 * Enviar notificación local inmediata
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Inmediata
  });
  
  return notificationId;
}

/**
 * Programar notificación para después
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number,
  data?: any
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
  
  return notificationId;
}

/**
 * Cancelar notificación programada
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancelar todas las notificaciones
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Obtener badge count actual
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Establecer badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Limpiar badge
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// Notificaciones específicas de la app

/**
 * Notificar nuevo gasto agregado
 */
export async function notifyNewExpense(
  eventName: string,
  amount: number,
  currency: string
): Promise<void> {
  await sendLocalNotification(
    '💰 Nuevo Gasto Agregado',
    `Se agregó un gasto de ${currency}${amount.toFixed(2)} en "${eventName}"`,
    { type: 'new_expense', eventName, amount }
  );
}

/**
 * Notificar que alguien te debe dinero
 */
export async function notifyDebt(
  debtorName: string,
  amount: number,
  currency: string,
  eventName: string
): Promise<void> {
  await sendLocalNotification(
    '💳 Tienes un Pago Pendiente',
    `${debtorName} te debe ${currency}${amount.toFixed(2)} en "${eventName}"`,
    { type: 'debt', debtorName, amount, eventName }
  );
}

/**
 * Notificar invitación a evento
 */
export async function notifyEventInvitation(
  eventName: string,
  inviterName: string
): Promise<void> {
  await sendLocalNotification(
    '🎉 Nueva Invitación',
    `${inviterName} te invitó a unirte a "${eventName}"`,
    { type: 'event_invitation', eventName, inviterName }
  );
}

/**
 * Notificar nuevo mensaje en chat
 */
export async function notifyNewMessage(
  senderName: string,
  message: string,
  chatType: 'event' | 'group',
  chatName: string
): Promise<void> {
  await sendLocalNotification(
    `💬 ${senderName} en ${chatName}`,
    message.length > 50 ? `${message.substring(0, 50)}...` : message,
    { type: 'new_message', senderName, chatType, chatName }
  );
}

/**
 * Notificar recordatorio de liquidación
 */
export async function notifySettlementReminder(
  eventName: string,
  amount: number,
  currency: string
): Promise<void> {
  await sendLocalNotification(
    '⏰ Recordatorio de Pago',
    `Tienes un pago pendiente de ${currency}${amount.toFixed(2)} en "${eventName}"`,
    { type: 'settlement_reminder', eventName, amount }
  );
}

/**
 * Notificar presupuesto excedido
 */
export async function notifyBudgetExceeded(
  eventName: string,
  budget: number,
  spent: number,
  currency: string
): Promise<void> {
  const percentage = ((spent / budget) * 100).toFixed(0);
  await sendLocalNotification(
    '⚠️ Presupuesto Excedido',
    `Has gastado ${currency}${spent.toFixed(2)} de ${currency}${budget.toFixed(2)} (${percentage}%) en "${eventName}"`,
    { type: 'budget_exceeded', eventName, budget, spent }
  );
}

/**
 * Notificar evento próximo a finalizar
 */
export async function notifyEventEnding(
  eventName: string,
  daysLeft: number
): Promise<void> {
  await sendLocalNotification(
    '📅 Evento Próximo a Finalizar',
    `"${eventName}" finaliza en ${daysLeft} día${daysLeft > 1 ? 's' : ''}`,
    { type: 'event_ending', eventName, daysLeft }
  );
}
