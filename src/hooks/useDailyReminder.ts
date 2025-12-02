/**
 * useDailyReminder - Hook para gestionar la notificación diaria
 * Pregunta al usuario si ha añadido todos los gastos del día
 */

import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DAILY_REMINDER_KEY = '@LessMo:dailyReminderEnabled';
const REMINDER_HOUR = 21; // 9 PM
const REMINDER_MINUTE = 0;

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface DailyReminderConfig {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const useDailyReminder = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReminderStatus();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      
      return false;
    }

    return true;
  };

  const loadReminderStatus = async () => {
    try {
      const saved = await AsyncStorage.getItem(DAILY_REMINDER_KEY);
      const enabled = saved === 'true';
      setIsEnabled(enabled);
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleDailyReminder = async () => {
    try {
      // Cancelar notificaciones previas
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Programar notificación diaria usando CalendarTriggerInput
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📝 Recordatorio de gastos',
          body: '¿Has añadido todos los gastos de hoy?',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'daily_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          hour: REMINDER_HOUR,
          minute: REMINDER_MINUTE,
        },
      });

      
    } catch (error) {
      
      throw error;
    }
  };

  const enableReminder = async () => {
    try {
      setIsLoading(true);
      
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Permisos de notificación denegados');
      }

      await scheduleDailyReminder();
      await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'true');
      setIsEnabled(true);

      
    } catch (error) {
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disableReminder = async () => {
    try {
      setIsLoading(true);
      
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'false');
      setIsEnabled(false);

      
    } catch (error) {
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReminder = async (enabled: boolean) => {
    if (enabled) {
      await enableReminder();
    } else {
      await disableReminder();
    }
  };

  return {
    isEnabled,
    isLoading,
    enableReminder,
    disableReminder,
    toggleReminder,
  };
};
