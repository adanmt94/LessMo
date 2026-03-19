/**
 * useNotifications - Hook para gestionar notificaciones en la aplicación
 */

import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import {
  registerForPushNotificationsAsync,
  notifyNewExpense as sendNewExpenseNotification,
  notifyDebt,
  notifyEventInvitation,
  notifyNewMessage,
  notifySettlementReminder,
  notifyBudgetExceeded,
  notifyEventEnding,
  clearBadge,
  cancelAllNotifications,
} from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useNotifications = () => {
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Cargar estado inicial
    loadNotificationsState();
    
    // Registrar para notificaciones push
    registerForPushNotifications();

    // Listener para notificaciones recibidas
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notification received
    });

    // Listener para cuando el usuario interactúa con una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    // Limpiar badge al abrir la app
    clearBadge();

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
      const enabled = await AsyncStorage.getItem('notifications_enabled');
      setNotificationsEnabledState(enabled === 'true');
    } catch (error) {
      // Loading failed - using default
    }
  };

  const registerForPushNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        // Token registered successfully
        // Aquí podrías guardar el token en Firestore asociado al usuario
      }
    } catch (error) {
      // Registration failed
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    switch (data.type) {
      case 'new_expense':
        // TODO: Implementar navegación
        break;
      case 'debt':
        // TODO: Implementar navegación
        break;
      case 'event_invitation':
        // TODO: Implementar navegación
        break;
      case 'new_message':
        // TODO: Implementar navegación
        break;
      case 'settlement_reminder':
        // TODO: Implementar navegación
        break;
      case 'budget_exceeded':
        // TODO: Implementar navegación
        break;
      default:
        // Unknown notification type
        break;
    }
  };

  const toggleNotifications = async (enabled: boolean): Promise<boolean> => {
    try {
      setIsLoading(true);

      if (enabled) {
        const token = await registerForPushNotificationsAsync();
        
        if (!token) {
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

      await AsyncStorage.setItem('notifications_enabled', enabled.toString());
      setNotificationsEnabledState(enabled);
      return true;
    } catch (error) {
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
    if (!notificationsEnabled) return;
    
    try {
      await sendNewExpenseNotification(eventName, amount, currency);
    } catch (error) {
      // Send failed
    }
  };

  const notifyDebtToUser = async (
    debtorName: string,
    amount: number,
    currency: string,
    eventName: string
  ): Promise<void> => {
    if (!notificationsEnabled) return;
    
    try {
      await notifyDebt(debtorName, amount, currency, eventName);
    } catch (error) {
      // Send failed
    }
  };

  const notifyInvitation = async (
    eventName: string,
    inviterName: string
  ): Promise<void> => {
    if (!notificationsEnabled) return;
    
    try {
      await notifyEventInvitation(eventName, inviterName);
    } catch (error) {
      // Send failed
    }
  };

  const notifyMessage = async (
    senderName: string,
    message: string,
    chatType: 'event' | 'group',
    chatName: string
  ): Promise<void> => {
    if (!notificationsEnabled) return;
    
    try {
      await notifyNewMessage(senderName, message, chatType, chatName);
    } catch (error) {
      // Send failed
    }
  };

  const notifySettlement = async (
    eventName: string,
    amount: number,
    currency: string
  ): Promise<void> => {
    if (!notificationsEnabled) return;
    
    try {
      await notifySettlementReminder(eventName, amount, currency);
    } catch (error) {
      // Send failed
    }
  };

  const notifyBudget = async (
    eventName: string,
    budget: number,
    spent: number,
    currency: string
  ): Promise<void> => {
    if (!notificationsEnabled) return;
    
    try {
      await notifyBudgetExceeded(eventName, budget, spent, currency);
    } catch (error) {
      // Send failed
    }
  };

  const notifyEventEnd = async (
    eventName: string,
    daysLeft: number
  ): Promise<void> => {
    if (!notificationsEnabled) return;
    
    try {
      await notifyEventEnding(eventName, daysLeft);
    } catch (error) {
      // Send failed
    }
  };

  return {
    notificationsEnabled,
    isLoading,
    toggleNotifications,
    notifyNewExpense,
    notifyDebtToUser,
    notifyInvitation,
    notifyMessage,
    notifySettlement,
    notifyBudget,
    notifyEventEnd,
  };
};
