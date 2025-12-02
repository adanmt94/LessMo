/**
 * useSpendingAlerts - Hook para gestionar alertas de gastos
 * Permite configurar umbrales y enviar notificaciones automáticas
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const ALERTS_STORAGE_KEY = '@LessMo:spending_alerts';

export interface SpendingAlertsConfig {
  // Umbral de dinero disponible mínimo (notifica cuando quede menos)
  minAvailableAmount: number;
  minAvailableEnabled: boolean;
  
  // Umbral de gasto máximo (notifica cuando supere)
  maxSpentAmount: number;
  maxSpentEnabled: boolean;
}

const DEFAULT_CONFIG: SpendingAlertsConfig = {
  minAvailableAmount: 100,
  minAvailableEnabled: false,
  maxSpentAmount: 500,
  maxSpentEnabled: false,
};

export const useSpendingAlerts = () => {
  const [config, setConfig] = useState<SpendingAlertsConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const saved = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
      }
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: SpendingAlertsConfig) => {
    try {
      await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
      
    } catch (error) {
      
      throw error;
    }
  };

  const updateMinAvailableAmount = async (amount: number) => {
    const newConfig = { ...config, minAvailableAmount: amount };
    await saveConfig(newConfig);
  };

  const updateMaxSpentAmount = async (amount: number) => {
    const newConfig = { ...config, maxSpentAmount: amount };
    await saveConfig(newConfig);
  };

  const toggleMinAvailableAlert = async () => {
    const newConfig = { ...config, minAvailableEnabled: !config.minAvailableEnabled };
    await saveConfig(newConfig);
  };

  const toggleMaxSpentAlert = async () => {
    const newConfig = { ...config, maxSpentEnabled: !config.maxSpentEnabled };
    await saveConfig(newConfig);
  };

  /**
   * Verifica si debe enviar alerta de dinero disponible bajo
   */
  const checkAvailableAmount = async (
    currentAvailable: number,
    currency: string,
    eventName: string
  ) => {
    if (!config.minAvailableEnabled) return;
    
    if (currentAvailable <= config.minAvailableAmount) {
      await sendNotification(
        '⚠️ Dinero disponible bajo',
        `Solo te quedan ${currentAvailable.toFixed(2)} ${currency} en "${eventName}". Límite configurado: ${config.minAvailableAmount} ${currency}`,
        { type: 'low_available', amount: currentAvailable }
      );
    }
  };

  /**
   * Verifica si debe enviar alerta de gasto alto
   */
  const checkTotalSpent = async (
    totalSpent: number,
    currency: string,
    eventName: string
  ) => {
    if (!config.maxSpentEnabled) return;
    
    if (totalSpent >= config.maxSpentAmount) {
      await sendNotification(
        '🚨 Límite de gasto superado',
        `Has gastado ${totalSpent.toFixed(2)} ${currency} en "${eventName}". Límite configurado: ${config.maxSpentAmount} ${currency}`,
        { type: 'high_spent', amount: totalSpent }
      );
    }
  };

  /**
   * Envía una notificación push
   */
  const sendNotification = async (
    title: string,
    body: string,
    data?: any
  ) => {
    try {
      // Verificar permisos
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Inmediata
      });

      
    } catch (error) {
      
    }
  };

  return {
    config,
    isLoading,
    updateMinAvailableAmount,
    updateMaxSpentAmount,
    toggleMinAvailableAlert,
    toggleMaxSpentAlert,
    checkAvailableAmount,
    checkTotalSpent,
  };
};
