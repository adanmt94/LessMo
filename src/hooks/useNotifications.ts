/**
 * useNotifications - Hook para gestionar notificaciones en la aplicación
 */

import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import {
  requestNotificationPermissions,
  areNotificationsEnabled,
  setNotificationsEnabled,
  scheduleExpenseReminder,
  scheduleSettlementReminder,
  scheduleDailyDebtReminder,
  cancelAllNotifications,
} from '../services/notificationService';

export const useNotifications = () => {
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Cargar estado inicial
    loadNotificationsState();

    // Listener para notificaciones recibidas
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida:', notification);
    });

    // Listener para cuando el usuario interactúa con una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuario interactuó con notificación:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const loadNotificationsState = async () => {
    try {
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabledState(enabled);
    } catch (error) {
      console.error('Error cargando estado de notificaciones:', error);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    if (data.type === 'expense') {
      // Navegar a la pantalla del evento
      console.log('Navegar a evento:', data.eventName);
    } else if (data.type === 'settlement') {
      // Navegar a la pantalla de liquidación
      console.log('Navegar a liquidación:', data.eventName);
    }
  };

  const toggleNotifications = async (enabled: boolean): Promise<boolean> => {
    try {
      setIsLoading(true);

      if (enabled) {
        const permissionGranted = await requestNotificationPermissions();
        
        if (!permissionGranted) {
          Alert.alert(
            'Permisos requeridos',
            'Para recibir notificaciones, debes habilitar los permisos en la configuración de tu dispositivo.',
            [{ text: 'Entendido' }]
          );
          return false;
        }
      } else {
        // Cancelar todas las notificaciones programadas
        await cancelAllNotifications();
      }

      await setNotificationsEnabled(enabled);
      setNotificationsEnabledState(enabled);
      return true;
    } catch (error) {
      console.error('Error cambiando notificaciones:', error);
      Alert.alert('Error', 'No se pudo cambiar la configuración de notificaciones');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const notifyNewExpense = async (
    eventName: string,
    amount: number,
    currency: string
  ): Promise<void> => {
    try {
      await scheduleExpenseReminder(eventName, amount, currency);
    } catch (error) {
      console.error('Error enviando notificación de gasto:', error);
    }
  };

  const notifySettlement = async (
    eventName: string,
    owedBy: string,
    owedTo: string,
    amount: number,
    currency: string
  ): Promise<void> => {
    try {
      await scheduleSettlementReminder(eventName, owedBy, owedTo, amount, currency);
    } catch (error) {
      console.error('Error enviando notificación de liquidación:', error);
    }
  };

  const notifyDailyDebts = async (
    totalDebt: number,
    currency: string,
    eventsWithDebt: number
  ): Promise<void> => {
    try {
      await scheduleDailyDebtReminder(totalDebt, currency, eventsWithDebt);
    } catch (error) {
      console.error('Error programando recordatorio diario:', error);
    }
  };

  return {
    notificationsEnabled,
    isLoading,
    toggleNotifications,
    notifyNewExpense,
    notifySettlement,
    notifyDailyDebts,
  };
};
