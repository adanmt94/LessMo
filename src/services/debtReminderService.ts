/**
 * Servicio de Recordatorios Automáticos de Deudas
 * Sistema inteligente para notificar a usuarios sobre deudas pendientes
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Participant, Settlement } from '../types';
import { logger, LogCategory } from '../utils/logger';

const STORAGE_KEY_REMINDER_SETTINGS = '@debt_reminder_settings';
const STORAGE_KEY_LAST_REMINDER = '@last_debt_reminder';
const STORAGE_KEY_REMINDER_HISTORY = '@debt_reminder_history';

export type ReminderFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'custom';

export interface DebtReminderSettings {
  enabled: boolean;
  frequency: ReminderFrequency;
  customDays?: number; // Para frecuencia custom
  reminderTime: string; // Hora del día "HH:MM"
  minAmount: number; // Monto mínimo para notificar
  excludedParticipants: string[]; // IDs de participantes que no quieren recordatorios
  quietHours: {
    enabled: boolean;
    start: string; // "HH:MM"
    end: string; // "HH:MM"
  };
}

export interface DebtReminder {
  id: string;
  eventId: string;
  eventName: string;
  settlement: Settlement;
  fromName: string;
  toName: string;
  scheduledAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'cancelled';
}

const DEFAULT_SETTINGS: DebtReminderSettings = {
  enabled: true,
  frequency: 'weekly',
  reminderTime: '09:00',
  minAmount: 5, // No molestar por menos de 5€
  excludedParticipants: [],
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
  },
};

/**
 * Obtener configuración de recordatorios
 */
export async function getReminderSettings(): Promise<DebtReminderSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_REMINDER_SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error getting reminder settings', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Guardar configuración de recordatorios
 */
export async function saveReminderSettings(settings: Partial<DebtReminderSettings>): Promise<void> {
  try {
    const current = await getReminderSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEY_REMINDER_SETTINGS, JSON.stringify(updated));
    
    // Si se deshabilitaron, cancelar todos los recordatorios pendientes
    if (!updated.enabled) {
      await cancelAllDebtReminders();
    }
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error saving reminder settings', error);
  }
}

/**
 * Programar recordatorio de deuda
 */
export async function scheduleDebtReminder(
  eventId: string,
  eventName: string,
  settlement: Settlement,
  fromParticipant: Participant,
  toParticipant: Participant
): Promise<string | null> {
  try {
    const settings = await getReminderSettings();
    
    // Verificar si los recordatorios están habilitados
    if (!settings.enabled) {
      logger.info(LogCategory.NOTIFICATION, 'Debt reminders disabled');
      return null;
    }
    
    // Verificar si el participante está excluido
    if (settings.excludedParticipants.includes(fromParticipant.id)) {
      logger.info(LogCategory.NOTIFICATION, 'Participant excluded from reminders', {
        participantId: fromParticipant.id,
      });
      return null;
    }
    
    // Verificar monto mínimo
    if (settlement.amount < settings.minAmount) {
      logger.info(LogCategory.NOTIFICATION, 'Amount below minimum threshold', {
        amount: settlement.amount,
        minAmount: settings.minAmount,
      });
      return null;
    }
    
    // Calcular cuándo enviar el recordatorio
    const scheduledDate = calculateNextReminderDate(settings);
    
    // Programar notificación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💸 Recordatorio de Pago - ${eventName}`,
        body: `${fromParticipant.name} debe pagar ${settlement.amount.toFixed(2)}€ a ${toParticipant.name}`,
        data: {
          type: 'debt_reminder',
          eventId,
          settlementFrom: settlement.from,
          settlementTo: settlement.to,
          amount: settlement.amount,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
    });
    
    // Guardar en historial
    const reminder: DebtReminder = {
      id: notificationId,
      eventId,
      eventName,
      settlement,
      fromName: fromParticipant.name,
      toName: toParticipant.name,
      scheduledAt: scheduledDate,
      status: 'pending',
    };
    
    await saveReminderToHistory(reminder);
    
    logger.info(LogCategory.NOTIFICATION, 'Debt reminder scheduled', {
      notificationId,
      scheduledAt: scheduledDate,
      amount: settlement.amount,
    });
    
    return notificationId;
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error scheduling debt reminder', error);
    return null;
  }
}

/**
 * Calcular próxima fecha de recordatorio
 */
function calculateNextReminderDate(settings: DebtReminderSettings): Date {
  const now = new Date();
  const [hours, minutes] = settings.reminderTime.split(':').map(Number);
  
  let nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);
  
  // Si ya pasó la hora hoy, programar para mañana o según frecuencia
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  // Ajustar según frecuencia
  switch (settings.frequency) {
    case 'daily':
      // Ya está configurado para mañana
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'custom':
      if (settings.customDays) {
        nextDate.setDate(nextDate.getDate() + settings.customDays);
      }
      break;
  }
  
  // Verificar quiet hours
  if (settings.quietHours.enabled) {
    nextDate = adjustForQuietHours(nextDate, settings.quietHours);
  }
  
  return nextDate;
}

/**
 * Ajustar fecha para evitar horas de silencio
 */
function adjustForQuietHours(
  date: Date,
  quietHours: { start: string; end: string }
): Date {
  const [startHour, startMin] = quietHours.start.split(':').map(Number);
  const [endHour, endMin] = quietHours.end.split(':').map(Number);
  
  const dateHour = date.getHours();
  const dateMin = date.getMinutes();
  
  const currentTime = dateHour * 60 + dateMin;
  const quietStart = startHour * 60 + startMin;
  const quietEnd = endHour * 60 + endMin;
  
  // Si está en horas de silencio, mover a la hora de fin
  if (currentTime >= quietStart || currentTime < quietEnd) {
    date.setHours(endHour, endMin, 0, 0);
  }
  
  return date;
}

/**
 * Programar recordatorios para todos los settlements pendientes
 */
export async function scheduleRemindersForEvent(
  eventId: string,
  eventName: string,
  settlements: Settlement[],
  participants: Participant[]
): Promise<void> {
  try {
    const participantMap = new Map(participants.map(p => [p.id, p]));
    
    for (const settlement of settlements) {
      const fromParticipant = participantMap.get(settlement.from);
      const toParticipant = participantMap.get(settlement.to);
      
      if (fromParticipant && toParticipant) {
        await scheduleDebtReminder(
          eventId,
          eventName,
          settlement,
          fromParticipant,
          toParticipant
        );
      }
    }
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error scheduling event reminders', error);
  }
}

/**
 * Cancelar recordatorio específico
 */
export async function cancelDebtReminder(reminderId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
    
    // Actualizar historial
    const history = await getReminderHistory();
    const updated = history.map(r =>
      r.id === reminderId ? { ...r, status: 'cancelled' as const } : r
    );
    await saveReminderHistory(updated);
    
    logger.info(LogCategory.NOTIFICATION, 'Debt reminder cancelled', { reminderId });
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error cancelling reminder', error);
  }
}

/**
 * Cancelar todos los recordatorios
 */
export async function cancelAllDebtReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Limpiar historial
    await AsyncStorage.removeItem(STORAGE_KEY_REMINDER_HISTORY);
    
    logger.info(LogCategory.NOTIFICATION, 'All debt reminders cancelled');
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error cancelling all reminders', error);
  }
}

/**
 * Obtener historial de recordatorios
 */
export async function getReminderHistory(): Promise<DebtReminder[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_REMINDER_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error getting reminder history', error);
    return [];
  }
}

/**
 * Guardar recordatorio en historial
 */
async function saveReminderToHistory(reminder: DebtReminder): Promise<void> {
  try {
    const history = await getReminderHistory();
    history.push(reminder);
    await saveReminderHistory(history);
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error saving reminder to history', error);
  }
}

/**
 * Guardar historial completo
 */
async function saveReminderHistory(history: DebtReminder[]): Promise<void> {
  try {
    // Mantener solo los últimos 50 recordatorios
    const trimmed = history.slice(-50);
    await AsyncStorage.setItem(STORAGE_KEY_REMINDER_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error saving reminder history', error);
  }
}

/**
 * Verificar si debe enviarse un recordatorio ahora
 */
export async function shouldSendReminderNow(eventId: string): Promise<boolean> {
  try {
    const settings = await getReminderSettings();
    if (!settings.enabled) return false;
    
    const lastReminder = await AsyncStorage.getItem(`${STORAGE_KEY_LAST_REMINDER}_${eventId}`);
    if (!lastReminder) return true;
    
    const lastDate = new Date(lastReminder);
    const now = new Date();
    const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    
    switch (settings.frequency) {
      case 'daily':
        return daysSince >= 1;
      case 'weekly':
        return daysSince >= 7;
      case 'biweekly':
        return daysSince >= 14;
      case 'custom':
        return daysSince >= (settings.customDays || 7);
      default:
        return false;
    }
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error checking reminder schedule', error);
    return false;
  }
}

/**
 * Marcar recordatorio como enviado
 */
export async function markReminderSent(eventId: string, reminderId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${STORAGE_KEY_LAST_REMINDER}_${eventId}`, new Date().toISOString());
    
    // Actualizar historial
    const history = await getReminderHistory();
    const updated = history.map(r =>
      r.id === reminderId ? { ...r, status: 'sent' as const, sentAt: new Date() } : r
    );
    await saveReminderHistory(updated);
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error marking reminder as sent', error);
  }
}

/**
 * Obtener recordatorios pendientes para un evento
 */
export async function getPendingReminders(eventId: string): Promise<DebtReminder[]> {
  try {
    const history = await getReminderHistory();
    return history.filter(r => r.eventId === eventId && r.status === 'pending');
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error getting pending reminders', error);
    return [];
  }
}

/**
 * Enviar recordatorio manual inmediato
 */
export async function sendImmediateReminder(
  eventName: string,
  settlement: Settlement,
  fromName: string,
  toName: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💸 Recordatorio de Pago - ${eventName}`,
        body: `${fromName} debe pagar ${settlement.amount.toFixed(2)}€ a ${toName}`,
        data: {
          type: 'debt_reminder_immediate',
          settlementFrom: settlement.from,
          settlementTo: settlement.to,
          amount: settlement.amount,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Enviar inmediatamente
    });
    
    logger.info(LogCategory.NOTIFICATION, 'Immediate reminder sent');
  } catch (error) {
    logger.error(LogCategory.NOTIFICATION, 'Error sending immediate reminder', error);
  }
}
