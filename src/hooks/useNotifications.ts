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
      console.log('📬 Notificación recibida:', notification);
    });

    // Listener para cuando el usuario interactúa con una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario interactuó con notificación:', response);
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
      console.error('❌ Error cargando estado de notificaciones:', error);
    }
  };

  const registerForPushNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log('✅ Token de notificación registrado:', token);
        // Aquí podrías guardar el token en Firestore asociado al usuario
      }
    } catch (error) {
      console.error('❌ Error registrando notificaciones:', error);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    switch (data.type) {
      case 'new_expense':
        console.log('📱 Navegar a evento:', data.eventName);
        // TODO: Implementar navegación
        break;
      case 'debt':
        console.log('💳 Navegar a liquidaciones:', data.eventName);
        // TODO: Implementar navegación
        break;
      case 'event_invitation':
        console.log('🎉 Navegar a evento:', data.eventName);
        // TODO: Implementar navegación
        break;
      case 'new_message':
        console.log('💬 Navegar a chat:', data.chatName);
        // TODO: Implementar navegación
        break;
      case 'settlement_reminder':
        console.log('⏰ Navegar a liquidación:', data.eventName);
        // TODO: Implementar navegación
        break;
      case 'budget_exceeded':
        console.log('⚠️ Navegar a resumen:', data.eventName);
        // TODO: Implementar navegación
        break;
      default:
        console.log('ℹ️ Tipo de notificación desconocido:', data.type);
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
      console.error('❌ Error cambiando notificaciones:', error);
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
      console.error('❌ Error enviando notificación de gasto:', error);
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
      console.error('❌ Error enviando notificación de deuda:', error);
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
      console.error('❌ Error enviando notificación de invitación:', error);
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
      console.error('❌ Error enviando notificación de mensaje:', error);
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
      console.error('❌ Error enviando notificación de liquidación:', error);
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
      console.error('❌ Error enviando notificación de presupuesto:', error);
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
      console.error('❌ Error enviando notificación de evento:', error);
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
