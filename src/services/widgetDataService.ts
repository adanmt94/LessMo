/**
 * 📱 Servicio de Datos para Widgets iOS
 * Prepara y actualiza datos para widgets de la pantalla de inicio
 * Usa SharedGroupPreferences para compartir datos con WidgetKit
 */

import { Platform, NativeModules } from 'react-native';

const APP_GROUP = 'group.com.lessmo.app.widgets';
const WIDGET_DATA_KEY = 'widgetData';

// Importar SharedGroupPreferences solo en iOS nativo
let SharedGroupPreferences: any = null;
if (Platform.OS === 'ios') {
  try {
    SharedGroupPreferences = require('react-native-shared-group-preferences').default;
  } catch {
    // No disponible (p.ej. en Expo Go)
  }
}

// Importar WidgetCenter para recargar los widgets
let WidgetCenter: any = null;
if (Platform.OS === 'ios') {
  try {
    WidgetCenter = NativeModules.WidgetCenter || require('react-native-widget-center');
  } catch {
    // No disponible
  }
}

export interface WidgetExpense {
  description: string;
  amount: number;
  date: string;
  category?: string;
}

/**
 * Datos que el widget Swift lee desde UserDefaults
 * Debe coincidir con lo que LessmoWidget.swift espera
 */
export interface WidgetData {
  eventName: string;
  totalExpenses: number;
  userBalance: number;
  participantsCount: number;
  // Campos adicionales para uso interno
  currency: string;
  monthTotal: number;
  monthExpenses: number;
  recentExpenses: WidgetExpense[];
  pendingPayments: number;  budget: number;
  eventsCount: number;  lastUpdate: string;
}

/**
 * Escribir datos al App Group compartido con el widget
 */
async function writeToSharedGroup(data: WidgetData): Promise<void> {
  if (!SharedGroupPreferences) {
    console.warn('⚠️ SharedGroupPreferences no disponible - widget no se actualizará');
    return;
  }

  try {
    await SharedGroupPreferences.setItem(WIDGET_DATA_KEY, JSON.stringify(data), APP_GROUP);
  } catch (error) {
    console.error('Error escribiendo al App Group:', error);
  }
}

/**
 * Notificar a WidgetKit que recargue los timelines
 */
function reloadWidgets(): void {
  try {
    if (WidgetCenter?.reloadAllTimelines) {
      WidgetCenter.reloadAllTimelines();
    }
  } catch {
    // Silencioso si no está disponible
  }
}

/**
 * Actualizar datos para widgets
 * Debe llamarse después de cada cambio en gastos/balance
 */
export async function updateWidgetData(userId: string): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    // Importar servicios dinámicamente para evitar ciclos
    const { getUserEventsByStatus, getEventExpenses } = await import('./firebase');
    
    // Obtener eventos del usuario
    const userEvents = await getUserEventsByStatus(userId);
    const activeEvents = userEvents.filter(e => e.status === 'active');
    
    // Calcular balance total
    let totalBalance = 0;
    let totalOwed = 0;
    let totalOwing = 0;
    
    for (const event of activeEvents) {
      try {
        // Calcular balance basándose en gastos del evento
        const expenses = await getEventExpenses(event.id);
        const userPaid = expenses
          .filter(e => e.paidBy === userId)
          .reduce((sum, e) => sum + e.amount, 0);
        const userOwes = expenses
          .filter(e => (e.beneficiaries || e.participantIds || []).includes(userId))
          .reduce((sum, e) => {
            const beneficiaries = e.beneficiaries || e.participantIds || [];
            return sum + (e.amount / beneficiaries.length);
          }, 0);
        const eventBalance = userPaid - userOwes;
        totalBalance += eventBalance;
        if (eventBalance > 0) {
          totalOwed += eventBalance;
        } else {
          totalOwing += Math.abs(eventBalance);
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
    
    // Nombre del evento más reciente
    const latestEvent = activeEvents[0];
    const eventName = latestEvent?.name || 'Sin eventos';
    const participantsCount = latestEvent?.participantIds?.length || 0;
    const eventBudget = latestEvent?.budget || 0;
    
    const widgetData: WidgetData = {
      // Campos que el widget Swift lee directamente
      eventName,
      totalExpenses: monthTotal,
      userBalance: totalBalance,
      participantsCount,
      // Campos adicionales
      currency: latestEvent?.currency || 'EUR',
      monthTotal,
      monthExpenses: monthExpenses.length,
      recentExpenses: allExpenses.slice(0, 10),
      pendingPayments: totalOwing > 0 ? Math.ceil(totalOwing) : 0,
      budget: eventBudget,
      eventsCount: activeEvents.length,
      lastUpdate: new Date().toISOString()
    };
    
    // Escribir al App Group compartido con el widget
    await writeToSharedGroup(widgetData);
    
    // Notificar al widget que hay datos nuevos
    reloadWidgets();
    
    console.log('✅ Datos del widget actualizados:', {
      eventName: widgetData.eventName,
      balance: widgetData.userBalance,
      monthTotal: widgetData.monthTotal,
      expensesCount: widgetData.recentExpenses.length
    });
    
  } catch (error) {
    console.error('❌ Error actualizando datos del widget:', error);
  }
}

/**
 * Obtener datos actuales para widgets
 */
export async function getWidgetData(): Promise<WidgetData | null> {
  if (!SharedGroupPreferences) {
    return null;
  }
  try {
    const data = await SharedGroupPreferences.getItem(WIDGET_DATA_KEY, APP_GROUP);
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
    if (SharedGroupPreferences) {
      await SharedGroupPreferences.setItem(WIDGET_DATA_KEY, '', APP_GROUP);
      reloadWidgets();
    }
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
