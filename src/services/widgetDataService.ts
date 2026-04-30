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
    WidgetCenter = NativeModules.RNWidgetCenter || require('react-native-widget-center').default;
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
  pendingPayments: number;
  budget: number;
  eventsCount: number;
  youOwe: number;
  owedToYou: number;
  lastUpdate: string;
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
    const jsonString = JSON.stringify(data);
    await SharedGroupPreferences.setItem(WIDGET_DATA_KEY, jsonString, APP_GROUP);
    console.log('📱 Widget: datos escritos al App Group (' + jsonString.length + ' bytes)');
  } catch (error) {
    console.error('❌ Error escribiendo al App Group:', error);
  }
}

/**
 * Notificar a WidgetKit que recargue los timelines
 */
function reloadWidgets(): void {
  try {
    if (WidgetCenter?.reloadAllTimelines) {
      WidgetCenter.reloadAllTimelines();
      console.log('📱 Widget: timeline reload solicitado');
    } else {
      console.warn('⚠️ WidgetCenter.reloadAllTimelines no disponible');
    }
  } catch (error) {
    console.warn('⚠️ Error recargando widget:', error);
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
    const { getUserGroups, getEventExpenses, getEventParticipants } = await import('./firebase');
    const { collection: firestoreCollection, query: firestoreQuery, where: firestoreWhere, getDocs: firestoreGetDocs, orderBy: firestoreOrderBy, doc: firestoreDoc, getDoc: firestoreGetDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    // Obtener TODOS los eventos del usuario (creados + participante) via groups
    const groups = await getUserGroups(userId);
    const activeEventIds: string[] = [];
    const activeEvents: Array<{ id: string; name: string; budget: number; currency: string; participantIds?: string[] }> = [];
    
    for (const group of groups) {
      if (group.isActive === false) continue;
      const eventIds = group.eventIds || [];
      for (const eid of eventIds) {
        if (activeEventIds.includes(eid)) continue;
        try {
          const eventDoc = await firestoreGetDoc(firestoreDoc(db, 'events', eid));
          if (eventDoc.exists()) {
            const data = eventDoc.data();
            const eventName = (data.name && data.name !== 'General') ? data.name : group.name;
            activeEventIds.push(eid);
            activeEvents.push({
              id: eid,
              name: eventName,
              budget: data.initialBudget || 0,
              currency: data.currency || 'EUR',
              participantIds: data.participantIds || [],
            });
          }
        } catch {
          // Skip errored event
        }
      }
    }
    
    // Calcular balance total de eventos
    let totalBalance = 0;
    let totalOwed = 0;
    let totalOwing = 0;
    let totalBudget = 0;
    let totalSpentInEvents = 0;
    
    for (const event of activeEvents) {
      try {
        // Acumular presupuestos
        if (event.budget) {
          totalBudget += event.budget;
        }
        
        // Obtener participantes para encontrar el ID de participante del usuario
        const participants = await getEventParticipants(event.id);
        const userParticipant = participants.find(p => p.userId === userId);
        if (!userParticipant) continue; // El usuario no es participante de este evento
        
        const participantId = userParticipant.id;
        
        // Calcular balance basándose en gastos del evento
        const expenses = await getEventExpenses(event.id);
        
        // Lo que el usuario PAGÓ (paidBy usa participant doc ID)
        const userPaid = expenses
          .filter(e => e.paidBy === participantId)
          .reduce((sum, e) => sum + e.amount, 0);
        
        // Lo que el usuario DEBE (su parte de cada gasto)
        const userOwes = expenses
          .filter(e => (e.participantIds || []).includes(participantId))
          .reduce((sum, e) => {
            // Respetar el tipo de split
            if (e.splitType === 'percentage' && e.percentageSplits) {
              const pct = e.percentageSplits[participantId] || 0;
              return sum + (e.amount * pct / 100);
            }
            if ((e.splitType === 'custom' || e.splitType === 'amount') && e.customSplits) {
              return sum + (e.customSplits[participantId] || 0);
            }
            // equal split (default)
            const parts = (e.participantIds || []).length;
            return sum + (parts > 0 ? e.amount / parts : 0);
          }, 0);
        
        totalSpentInEvents += userOwes;
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
    
    // Obtener gastos recientes (últimos 30 días) — incluyendo individuales
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
    
    // Obtener gastos individuales del usuario (sin eventId, paidBy = auth UID)
    let individualIncome = 0;
    let individualExpenseTotal = 0;
    try {
      const individualQuery = firestoreQuery(
        firestoreCollection(db, 'expenses'),
        firestoreWhere('paidBy', '==', userId),
        firestoreOrderBy('createdAt', 'desc')
      );
      const individualSnap = await firestoreGetDocs(individualQuery);
      individualSnap.docs.forEach(doc => {
        const data = doc.data();
        // Solo procesar gastos individuales (sin eventId o eventId === 'individual')
        if (data.eventId && data.eventId !== 'individual') return;
        
        const expenseDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        const amount = data.amount || 0;
        
        // Separar ingresos y gastos individuales
        if (data.type === 'income') {
          individualIncome += amount;
        } else {
          individualExpenseTotal += amount;
        }
        
        if (expenseDate >= thirtyDaysAgo) {
          allExpenses.push({
            description: data.description || 'Gasto rápido',
            amount,
            date: expenseDate.toISOString(),
            category: data.category
          });
        }
      });
    } catch (error) {
      console.warn('Error obteniendo gastos individuales para widget:', error);
    }
    
    // Incluir balance de gastos individuales (ingresos - gastos)
    const individualBalance = individualIncome - individualExpenseTotal;
    totalBalance += individualBalance;
    
    // Ordenar por fecha (más recientes primero)
    allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calcular total del mes actual
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = allExpenses.filter(e => new Date(e.date) >= monthStart);
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Nombre del evento más reciente
    const latestEvent = activeEvents[0];
    const eventName = latestEvent?.name || (allExpenses.length > 0 ? 'Gastos rápidos' : 'Sin eventos');
    const participantsCount = latestEvent?.participantIds?.length || 0;
    
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
      budget: totalBudget,
      eventsCount: activeEvents.length,
      youOwe: totalOwing,
      owedToYou: totalOwed,
      lastUpdate: new Date().toISOString()
    };
    
    // Escribir al App Group compartido con el widget
    await writeToSharedGroup(widgetData);
    
    // Notificar al widget que hay datos nuevos
    reloadWidgets();
    
    // Donar eventos al Spotlight de iOS
    try {
      const { donateEventsToSpotlight, donateQuickExpenseActivity } = await import('./spotlightService');
      const spotlightEvents = activeEvents.map(e => ({
        id: e.id,
        name: e.name || '',
        budget: e.budget || 0,
        participantsCount: e.participantIds?.length || 0,
        currency: e.currency || 'EUR',
      }));
      donateEventsToSpotlight(spotlightEvents).catch(() => {});
      donateQuickExpenseActivity().catch(() => {});
    } catch {}
    
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
