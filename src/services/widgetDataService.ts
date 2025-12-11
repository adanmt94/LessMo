/**
 * 📱 Servicio de Datos para Widgets iOS
 * Prepara y actualiza datos para widgets de la pantalla de inicio
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface WidgetExpense {
  description: string;
  amount: number;
  date: string;
  category?: string;
}

export interface WidgetData {
  balance: number;
  currency: string;
  monthTotal: number;
  monthExpenses: number;
  recentExpenses: WidgetExpense[];
  pendingPayments: number;
  lastUpdate: string;
}

const WIDGET_DATA_KEY = '@LessMo:widget_data';

/**
 * Actualizar datos para widgets
 * Debe llamarse después de cada cambio en gastos/balance
 */
export async function updateWidgetData(userId: string): Promise<void> {
  if (Platform.OS !== 'ios') {
    return; // Widgets solo en iOS por ahora
  }

  try {
    // Importar servicios dinámicamente para evitar ciclos
    const { getUserEventsByStatus, getEventExpenses, getParticipantBalances } = await import('./firebase');
    
    // Obtener eventos del usuario
    const userEvents = await getUserEventsByStatus(userId);
    const activeEvents = userEvents.filter(e => e.status === 'active');
    
    // Calcular balance total
    let totalBalance = 0;
    let totalOwed = 0;
    let totalOwing = 0;
    
    for (const event of activeEvents) {
      try {
        const balances = await getParticipantBalances(event.id);
        const userBalance = balances.find(b => b.participantId === userId);
        
        if (userBalance) {
          totalBalance += userBalance.balance;
          if (userBalance.balance > 0) {
            totalOwed += userBalance.balance;
          } else {
            totalOwing += Math.abs(userBalance.balance);
          }
        }
      } catch (error) {
        console.warn(`Error calculando balance para evento ${event.id}:`, error);
      }
    }
    
    // Obtener gastos recientes (últimos 30 días)
    const allExpenses: WidgetExpense[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const event of activeEvents.slice(0, 5)) { // Limitar a 5 eventos para rendimiento
      try {
        const expenses = await getEventExpenses(event.id);
        expenses.forEach(expense => {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
          
          if (expenseDate >= thirtyDaysAgo) {
            allExpenses.push({
              description: expense.description || expense.name || 'Gasto',
              amount: expense.amount,
              date: expenseDate.toISOString(),
              category: expense.category
            });
          }
        });
      } catch (error) {
        console.warn(`Error obteniendo gastos del evento ${event.id}:`, error);
      }
    }
    
    // Ordenar por fecha (más recientes primero)
    allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calcular total del mes actual
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = allExpenses.filter(e => new Date(e.date) >= monthStart);
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const widgetData: WidgetData = {
      balance: totalBalance,
      currency: 'EUR', // TODO: Obtener de configuración del usuario
      monthTotal,
      monthExpenses: monthExpenses.length,
      recentExpenses: allExpenses.slice(0, 10), // Top 10 más recientes
      pendingPayments: totalOwing > 0 ? Math.ceil(totalOwing) : 0,
      lastUpdate: new Date().toISOString()
    };
    
    // Guardar datos para widgets (AsyncStorage es accesible desde widgets via App Groups)
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));
    
    console.log('✅ Datos del widget actualizados:', {
      balance: widgetData.balance,
      monthTotal: widgetData.monthTotal,
      expensesCount: widgetData.recentExpenses.length
    });
    
    // TODO: Notificar a los widgets iOS que hay datos nuevos
    // Requiere native module para llamar WidgetCenter.shared.reloadAllTimelines()
    
  } catch (error) {
    console.error('❌ Error actualizando datos del widget:', error);
  }
}

/**
 * Obtener datos actuales para widgets
 */
export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error obteniendo datos del widget:', error);
    return null;
  }
}

/**
 * Limpiar datos del widget (útil al cerrar sesión)
 */
export async function clearWidgetData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WIDGET_DATA_KEY);
    
  } catch (error) {
    console.error('Error limpiando datos del widget:', error);
  }
}

/**
 * Formato de moneda para widgets
 */
export function formatCurrencyForWidget(amount: number, currency: string = 'EUR'): string {
  const symbols: { [key: string]: string } = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    JPY: '¥'
  };
  
  const symbol = symbols[currency] || '€';
  const formatted = Math.abs(amount).toFixed(2);
  
  return amount >= 0 ? `${symbol}${formatted}` : `-${symbol}${formatted}`;
}
