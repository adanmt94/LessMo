/**
 * notificationService - Servicio para gestionar notificaciones push
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = '@LessMo:notificationsEnabled';
const PUSH_TOKEN_KEY = '@LessMo:pushToken';

// Configurar comportamiento de notificaciones cuando la app está en primer plano
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
 * Solicitar permisos de notificaciones
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (!Device.isDevice) {
      console.log('Las notificaciones push solo funcionan en dispositivos físicos');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('No se obtuvieron permisos para notificaciones');
      return false;
    }

    // Configuración específica de Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
    }

    // Intentar obtener token de push (opcional, solo para notificaciones remotas)
    try {
      // Solo intentamos obtener el token si estamos en un proyecto de Expo con EAS
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Push token:', token.data);
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
    } catch (tokenError) {
      // No es crítico si no podemos obtener el token
      // Las notificaciones locales funcionarán de todos modos
      console.log('No se pudo obtener push token (notificaciones locales seguirán funcionando)');
    }

    return true;
  } catch (error) {
    console.error('Error solicitando permisos de notificaciones:', error);
    return false;
  }
};

/**
 * Verificar si las notificaciones están habilitadas
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error verificando notificaciones:', error);
    return false;
  }
};

/**
 * Habilitar/deshabilitar notificaciones
 */
export const setNotificationsEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
    if (enabled) {
      await requestNotificationPermissions();
    }
  } catch (error) {
    console.error('Error guardando preferencia de notificaciones:', error);
  }
};

/**
 * Programar notificación local para recordar gastos pendientes
 */
export const scheduleExpenseReminder = async (
  eventName: string,
  amount: number,
  currency: string
): Promise<string | null> => {
  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 Nuevo gasto en ' + eventName,
        body: `Se agregó un gasto de ${amount} ${currency}`,
        data: { type: 'expense', eventName },
        sound: true,
      },
      trigger: null, // Enviar inmediatamente
    });

    return notificationId;
  } catch (error) {
    console.error('Error programando notificación:', error);
    return null;
  }
};

/**
 * Programar notificación de liquidación pendiente
 */
export const scheduleSettlementReminder = async (
  eventName: string,
  owedBy: string,
  owedTo: string,
  amount: number,
  currency: string
): Promise<string | null> => {
  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Liquidación pendiente',
        body: `${owedBy} debe ${amount} ${currency} a ${owedTo} en ${eventName}`,
        data: { type: 'settlement', eventName },
        sound: true,
      },
      trigger: {
        seconds: 60 * 60 * 24, // 24 horas después
      } as Notifications.TimeIntervalTriggerInput,
    });

    return notificationId;
  } catch (error) {
    console.error('Error programando notificación de liquidación:', error);
    return null;
  }
};

/**
 * Programar recordatorio diario de deudas pendientes
 */
export const scheduleDailyDebtReminder = async (
  totalDebt: number,
  currency: string,
  eventsWithDebt: number
): Promise<string | null> => {
  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) return null;

    if (totalDebt <= 0) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Resumen de deudas',
        body: `Tienes ${totalDebt} ${currency} pendientes en ${eventsWithDebt} evento(s)`,
        data: { type: 'daily_reminder' },
        sound: true,
      },
      trigger: {
        hour: 20, // 8 PM
        minute: 0,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });

    return notificationId;
  } catch (error) {
    console.error('Error programando recordatorio diario:', error);
    return null;
  }
};

/**
 * Cancelar todas las notificaciones programadas
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Todas las notificaciones canceladas');
  } catch (error) {
    console.error('Error cancelando notificaciones:', error);
  }
};

/**
 * Obtener el token de push guardado
 */
export const getPushToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch (error) {
    console.error('Error obteniendo push token:', error);
    return null;
  }
};
