/**
 * Hook mejorado para notificaciones con mejor UX
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { logger, LogCategory } from '../utils/logger';
import { analytics, AnalyticsEvents, AnalyticsCategory } from '../utils/analytics';

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export function useNotificationsEnhanced() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  /**
   * Solicitar permisos de notificaciones
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (!Device.isDevice) {
        logger.warn(LogCategory.NOTIFICATION, 'No se pueden solicitar permisos en emulador');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn(LogCategory.NOTIFICATION, 'Permisos de notificación denegados');
        setPermission('denied');
        return false;
      }

      setPermission('granted');
      logger.info(LogCategory.NOTIFICATION, 'Permisos de notificación concedidos');

      // Obtener token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setPushToken(token);
      logger.info(LogCategory.NOTIFICATION, 'Token de push obtenido', { token });

      analytics.track(
        AnalyticsEvents.NOTIFICATION_SEND,
        AnalyticsCategory.NOTIFICATION,
        { action: 'permission_granted' }
      );

      return true;
    } catch (error) {
      logger.error(LogCategory.NOTIFICATION, 'Error al solicitar permisos', error);
      return false;
    }
  }, []);

  /**
   * Enviar notificación local
   */
  const sendLocalNotification = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>,
    delaySeconds: number = 0
  ): Promise<string | null> => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: delaySeconds > 0 ? { seconds: delaySeconds } as any : null,
      });

      logger.info(LogCategory.NOTIFICATION, 'Notificación local enviada', { 
        notificationId, 
        title, 
        delaySeconds 
      });

      analytics.track(
        AnalyticsEvents.NOTIFICATION_SEND,
        AnalyticsCategory.NOTIFICATION,
        { type: 'local', title }
      );

      return notificationId;
    } catch (error) {
      logger.error(LogCategory.NOTIFICATION, 'Error al enviar notificación local', error);
      return null;
    }
  }, []);

  /**
   * Cancelar notificación programada
   */
  const cancelNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.info(LogCategory.NOTIFICATION, 'Notificación cancelada', { notificationId });
    } catch (error) {
      logger.error(LogCategory.NOTIFICATION, 'Error al cancelar notificación', error);
    }
  }, []);

  /**
   * Cancelar todas las notificaciones
   */
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.info(LogCategory.NOTIFICATION, 'Todas las notificaciones canceladas');
    } catch (error) {
      logger.error(LogCategory.NOTIFICATION, 'Error al cancelar notificaciones', error);
    }
  }, []);

  /**
   * Mostrar alerta simple
   */
  const showAlert = useCallback((
    title: string,
    message: string,
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ): void => {
    Alert.alert(
      title,
      message,
      buttons || [{ text: 'OK' }]
    );
  }, []);

  /**
   * Mostrar confirmación
   */
  const showConfirmation = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Confirmar',
          onPress: onConfirm,
        },
      ]
    );
  }, []);

  /**
   * Notificación de éxito
   */
  const notifySuccess = useCallback(async (message: string): Promise<void> => {
    await sendLocalNotification('✅ Éxito', message);
  }, [sendLocalNotification]);

  /**
   * Notificación de error
   */
  const notifyError = useCallback(async (message: string): Promise<void> => {
    await sendLocalNotification('❌ Error', message);
  }, [sendLocalNotification]);

  /**
   * Notificación de advertencia
   */
  const notifyWarning = useCallback(async (message: string): Promise<void> => {
    await sendLocalNotification('⚠️ Atención', message);
  }, [sendLocalNotification]);

  /**
   * Notificación de información
   */
  const notifyInfo = useCallback(async (message: string): Promise<void> => {
    await sendLocalNotification('ℹ️ Información', message);
  }, [sendLocalNotification]);

  /**
   * Programar recordatorio
   */
  const scheduleReminder = useCallback(async (
    title: string,
    body: string,
    triggerDate: Date,
    data?: Record<string, any>
  ): Promise<string | null> => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 ${title}`,
          body,
          data,
          sound: true,
        },
        trigger: triggerDate as any, // Tipo compatible con expo-notifications
      });

      logger.info(LogCategory.NOTIFICATION, 'Recordatorio programado', { 
        notificationId, 
        title,
        triggerDate 
      });

      return notificationId;
    } catch (error) {
      logger.error(LogCategory.NOTIFICATION, 'Error al programar recordatorio', error);
      return null;
    }
  }, []);

  // Inicializar al montar
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  return {
    pushToken,
    permission,
    requestPermissions,
    sendLocalNotification,
    cancelNotification,
    cancelAllNotifications,
    showAlert,
    showConfirmation,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    scheduleReminder,
  };
}
