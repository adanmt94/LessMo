/**
 * Personal Budget Service
 * Gestiona presupuesto mensual personal + alertas progresivas
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { PersonalBudget, Currency } from '../types';

const STORAGE_KEY = 'lessmo_personal_budget';
const ALERT_SENT_KEY = 'lessmo_budget_alerts_sent';

export async function getPersonalBudget(userId: string): Promise<PersonalBudget | null> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function savePersonalBudget(userId: string, budget: Partial<PersonalBudget>): Promise<PersonalBudget> {
  const existing = await getPersonalBudget(userId);
  const updated: PersonalBudget = {
    userId,
    monthlyLimit: budget.monthlyLimit ?? existing?.monthlyLimit ?? 0,
    currency: budget.currency ?? existing?.currency ?? 'EUR' as Currency,
    alertAt75: budget.alertAt75 ?? existing?.alertAt75 ?? true,
    alertAt90: budget.alertAt90 ?? existing?.alertAt90 ?? true,
    alertAt100: budget.alertAt100 ?? existing?.alertAt100 ?? true,
    updatedAt: new Date(),
  };
  await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updated));
  return updated;
}

/**
 * Check spending against personal budget and send progressive push alerts
 */
export async function checkPersonalBudget(
  userId: string,
  currentMonthSpending: number,
): Promise<{ percentage: number; overBudget: boolean; alertSent?: string }> {
  const budget = await getPersonalBudget(userId);
  if (!budget || budget.monthlyLimit <= 0) {
    return { percentage: 0, overBudget: false };
  }

  const percentage = (currentMonthSpending / budget.monthlyLimit) * 100;
  const overBudget = percentage >= 100;

  // Track which alerts we've already sent this month
  const monthKey = new Date().toISOString().slice(0, 7); // "2026-03"
  const alertsRaw = await AsyncStorage.getItem(`${ALERT_SENT_KEY}_${userId}_${monthKey}`);
  const alertsSent: string[] = alertsRaw ? JSON.parse(alertsRaw) : [];

  let alertSent: string | undefined;

  if (percentage >= 100 && budget.alertAt100 && !alertsSent.includes('100')) {
    await sendBudgetPush(
      '🚨 ¡Presupuesto superado!',
      `Has gastado ${currentMonthSpending.toFixed(2)} de ${budget.monthlyLimit.toFixed(2)} — ${Math.round(percentage)}% de tu presupuesto mensual.`,
    );
    alertsSent.push('100');
    alertSent = '100';
  } else if (percentage >= 90 && budget.alertAt90 && !alertsSent.includes('90')) {
    await sendBudgetPush(
      '⚠️ 90% del presupuesto',
      `Llevas ${currentMonthSpending.toFixed(2)} de ${budget.monthlyLimit.toFixed(2)}. ¡Cuidado con los gastos!`,
    );
    alertsSent.push('90');
    alertSent = '90';
  } else if (percentage >= 75 && budget.alertAt75 && !alertsSent.includes('75')) {
    await sendBudgetPush(
      '💡 75% del presupuesto',
      `Llevas ${currentMonthSpending.toFixed(2)} de ${budget.monthlyLimit.toFixed(2)}. Vas bien, sigue controlando.`,
    );
    alertsSent.push('75');
    alertSent = '75';
  }

  if (alertSent) {
    await AsyncStorage.setItem(`${ALERT_SENT_KEY}_${userId}_${monthKey}`, JSON.stringify(alertsSent));
  }

  return { percentage, overBudget, alertSent };
}

async function sendBudgetPush(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null, // Immediate
    });
  } catch {
    // Push may fail if permissions not granted
  }
}

/**
 * Reset monthly alert tracking (call on month change)
 */
export async function resetMonthlyAlerts(userId: string): Promise<void> {
  const monthKey = new Date().toISOString().slice(0, 7);
  await AsyncStorage.removeItem(`${ALERT_SENT_KEY}_${userId}_${monthKey}`);
}
