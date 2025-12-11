/**
 * useLiveActivities - Hook para gestionar Live Activities
 * 
 * IMPORTANTE: Solo funciona en build nativa iOS 16.1+
 * NO funciona en Expo Go
 */

import { useState, useEffect } from 'react';
import LiveActivitiesManager from '../services/LiveActivities';

export interface LiveActivityState {
  isActive: boolean;
  isSupported: boolean;
  eventName: string | null;
  currentAmount: number;
  expenseCount: number;
}

export const useLiveActivities = () => {
  const [state, setState] = useState<LiveActivityState>({
    isActive: false,
    isSupported: LiveActivitiesManager.isSupported(),
    eventName: null,
    currentAmount: 0,
    expenseCount: 0,
  });

  /**
   * Inicia una Live Activity para un evento
   */
  const startTracking = async (eventName: string, currency: string) => {
    if (!state.isSupported) {
      console.warn('Live Activities no soportadas en este dispositivo');
      return;
    }

    try {
      await LiveActivitiesManager.startActivity({
        eventName,
        currency,
        currentAmount: 0,
        expenseCount: 0,
      });

      setState(prev => ({
        ...prev,
        isActive: true,
        eventName,
        currentAmount: 0,
        expenseCount: 0,
      }));
    } catch (error) {
      console.error('❌ Error iniciando tracking:', error);
    }
  };

  /**
   * Actualiza la Live Activity cuando se añade un gasto
   */
  const addExpense = async (amount: number) => {
    if (!state.isActive) {
      console.warn('No hay tracking activo');
      return;
    }

    const newAmount = state.currentAmount + amount;
    const newCount = state.expenseCount + 1;

    try {
      await LiveActivitiesManager.updateActivity({
        currentAmount: newAmount,
        expenseCount: newCount,
      });

      setState(prev => ({
        ...prev,
        currentAmount: newAmount,
        expenseCount: newCount,
      }));
    } catch (error) {
      console.error('❌ Error actualizando tracking:', error);
    }
  };

  /**
   * Detiene la Live Activity
   */
  const stopTracking = async () => {
    if (!state.isActive) {
      return;
    }

    try {
      await LiveActivitiesManager.endActivity();

      setState(prev => ({
        ...prev,
        isActive: false,
        eventName: null,
        currentAmount: 0,
        expenseCount: 0,
      }));

      
    } catch (error) {
      console.error('❌ Error deteniendo tracking:', error);
    }
  };

  return {
    isSupported: state.isSupported,
    isActive: state.isActive,
    eventName: state.eventName,
    currentAmount: state.currentAmount,
    expenseCount: state.expenseCount,
    startTracking,
    addExpense,
    stopTracking,
  };
};
