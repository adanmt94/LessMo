/**
 * useWidget - Hook para gestionar el widget de iOS
 * 
 * IMPORTANTE: Solo funciona en build nativa
 * NO funciona en Expo Go
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import WidgetDataManager from '../services/WidgetManager';

export interface WidgetState {
  totalAmount: number;
  expenseCount: number;
  todayExpenses: number;
  currency: string;
}

export const useWidget = () => {
  const [isSupported] = useState(Platform.OS === 'ios');

  /**
   * Actualiza el widget con nuevos datos
   */
  const updateWidget = async (data: WidgetState) => {
    if (!isSupported) {
      
      return;
    }

    try {
      // Obtener gastos recientes (los últimos 4)
      // En una implementación real, esto vendría de Firestore
      const recentExpenses = [
        {
          id: '1',
          description: 'Último gasto',
          amount: data.todayExpenses,
          date: new Date().toISOString(),
        },
      ];

      await WidgetDataManager.saveWidgetData({
        ...data,
        recentExpenses,
      });

      
    } catch (error) {
      
    }
  };

  /**
   * Actualiza el widget cuando se añade un gasto
   */
  const onExpenseAdded = async (amount: number, description: string) => {
    try {
      const currentData = await WidgetDataManager.getWidgetData();
      
      if (!currentData) {
        
        return;
      }

      const updatedData = {
        ...currentData,
        totalAmount: currentData.totalAmount + amount,
        expenseCount: currentData.expenseCount + 1,
        todayExpenses: currentData.todayExpenses + amount,
        recentExpenses: [
          {
            id: Date.now().toString(),
            description,
            amount,
            date: new Date().toISOString(),
          },
          ...currentData.recentExpenses.slice(0, 3), // Mantener solo los últimos 4
        ],
      };

      await WidgetDataManager.saveWidgetData(updatedData);
      
    } catch (error) {
      
    }
  };

  /**
   * Reinicia los gastos del día (llamar a medianoche)
   */
  const resetDailyExpenses = async () => {
    try {
      const currentData = await WidgetDataManager.getWidgetData();
      
      if (!currentData) {
        return;
      }

      const updatedData = {
        ...currentData,
        todayExpenses: 0,
      };

      await WidgetDataManager.saveWidgetData(updatedData);
      
    } catch (error) {
      
    }
  };

  return {
    isSupported,
    updateWidget,
    onExpenseAdded,
    resetDailyExpenses,
  };
};
