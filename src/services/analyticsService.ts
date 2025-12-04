/**
 * Servicio de Analíticas y Estadísticas Avanzadas
 * Dashboard con tendencias, comparativas y patrones de gasto
 */

import { Expense, Participant, ExpenseCategory } from '../types';
import { logger, LogCategory } from '../utils/logger';

/**
 * Convierte un Timestamp de Firestore a Date de forma segura
 */
function toDate(timestamp: any): Date {
  if (!timestamp) {
    return new Date();
  }
  
  // Si ya es un Date
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Si es un Timestamp de Firestore
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Si tiene seconds (Firestore Timestamp object)
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  
  // Si es un string o número
  try {
    return new Date(timestamp);
  } catch {
    return new Date();
  }
}

export interface MonthlyStats {
  month: string; // "2024-11"
  totalSpent: number;
  expenseCount: number;
  avgExpenseAmount: number;
  topCategory: ExpenseCategory;
  topSpender: string;
}

export interface CategoryTrend {
  category: ExpenseCategory;
  data: { date: string; amount: number }[];
  totalAmount: number;
  percentageChange: number; // Cambio respecto al período anterior
  averageAmount: number;
}

export interface SpendingPattern {
  type: 'weekday' | 'time_of_day' | 'recurring';
  pattern: string;
  description: string;
  frequency: number;
  avgAmount: number;
}

export interface ParticipantStats {
  participantId: string;
  participantName: string;
  totalPaid: number;
  totalOwed: number;
  expenseCount: number;
  avgExpenseAmount: number;
  topCategories: { category: ExpenseCategory; amount: number; count: number }[];
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface ComparisonStats {
  currentPeriod: {
    totalSpent: number;
    expenseCount: number;
    avgExpenseAmount: number;
  };
  previousPeriod: {
    totalSpent: number;
    expenseCount: number;
    avgExpenseAmount: number;
  };
  percentageChange: {
    totalSpent: number;
    expenseCount: number;
    avgExpenseAmount: number;
  };
}

export interface ForecastData {
  projectedSpending: number;
  daysRemaining: number;
  currentRunRate: number; // Gasto promedio por día
  estimatedEndDate: Date;
  budgetStatus: 'on_track' | 'over_budget' | 'under_budget';
}

/**
 * Obtener estadísticas mensuales
 */
export function getMonthlyStats(expenses: Expense[], participants: Participant[]): MonthlyStats[] {
  try {
    // Agrupar gastos por mes
    const expensesByMonth = expenses.reduce((acc, expense) => {
      const createdAt = toDate(expense.createdAt);
      const monthKey = createdAt.toISOString().substring(0, 7); // "2024-11"
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(expense);
      return acc;
    }, {} as { [key: string]: Expense[] });

    // Calcular stats por mes
    const monthlyStats: MonthlyStats[] = Object.entries(expensesByMonth).map(([month, monthExpenses]) => {
      const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const expenseCount = monthExpenses.length;
      const avgExpenseAmount = expenseCount > 0 ? totalSpent / expenseCount : 0;

      // Categoría más común
      const categoryCount = monthExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
      const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] as ExpenseCategory : 'other';

      // Persona que más gastó
      const spenderCount = monthExpenses.reduce((acc, e) => {
        const payer = participants.find(p => p.id === e.paidBy);
        if (payer) {
          acc[payer.name] = (acc[payer.name] || 0) + e.amount;
        }
        return acc;
      }, {} as { [key: string]: number });
      const topSpender = Object.entries(spenderCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Desconocido';

      return {
        month,
        totalSpent,
        expenseCount,
        avgExpenseAmount,
        topCategory,
        topSpender,
      };
    });

    // Ordenar por mes
    return monthlyStats.sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error calculating monthly stats', error);
    return [];
  }
}

/**
 * Obtener tendencias por categoría
 */
export function getCategoryTrends(expenses: Expense[], days: number = 30): CategoryTrend[] {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentExpenses = expenses.filter(e => {
      const createdAt = toDate(e.createdAt);
      return createdAt >= cutoffDate;
    });
    const oldExpenses = expenses.filter(e => {
      const createdAt = toDate(e.createdAt);
      return createdAt < cutoffDate;
    });

    const categories = Array.from(new Set(expenses.map(e => e.category))) as ExpenseCategory[];

    return categories.map(category => {
      const categoryExpenses = recentExpenses.filter(e => e.category === category);
      const oldCategoryExpenses = oldExpenses.filter(e => e.category === category);

      // Datos por día
      const dataByDay: { [key: string]: number } = {};
      categoryExpenses.forEach(e => {
        const createdAt = toDate(e.createdAt);
        const dateKey = createdAt.toISOString().substring(0, 10);
        dataByDay[dateKey] = (dataByDay[dateKey] || 0) + e.amount;
      });

      const data = Object.entries(dataByDay)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const oldTotalAmount = oldCategoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      const percentageChange = oldTotalAmount > 0 
        ? ((totalAmount - oldTotalAmount) / oldTotalAmount) * 100
        : 0;

      const averageAmount = categoryExpenses.length > 0 
        ? totalAmount / categoryExpenses.length
        : 0;

      return {
        category,
        data,
        totalAmount,
        percentageChange,
        averageAmount,
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error calculating category trends', error);
    return [];
  }
}

/**
 * Detectar patrones de gasto
 */
export function detectSpendingPatterns(expenses: Expense[]): SpendingPattern[] {
  try {
    const patterns: SpendingPattern[] = [];

    // Patrón 1: Día de la semana más común
    const dayOfWeekCount: { [key: number]: { count: number; total: number } } = {};
    expenses.forEach(e => {
      const createdAt = toDate(e.createdAt);
      const day = createdAt.getDay();
      if (!dayOfWeekCount[day]) {
        dayOfWeekCount[day] = { count: 0, total: 0 };
      }
      dayOfWeekCount[day].count++;
      dayOfWeekCount[day].total += e.amount;
    });

    const sortedDays = Object.entries(dayOfWeekCount)
      .sort((a, b) => b[1].count - a[1].count);
    const topDay = sortedDays.length > 0 ? sortedDays[0] : null;
    
    if (topDay) {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      patterns.push({
        type: 'weekday',
        pattern: dayNames[parseInt(topDay[0])],
        description: `Gastas más los ${dayNames[parseInt(topDay[0])]}s`,
        frequency: topDay[1].count,
        avgAmount: topDay[1].count > 0 ? topDay[1].total / topDay[1].count : 0,
      });
    }

    // Patrón 2: Hora del día
    const hourCount: { [key: number]: { count: number; total: number } } = {};
    expenses.forEach(e => {
      const createdAt = toDate(e.createdAt);
      const hour = createdAt.getHours();
      const period = hour < 12 ? 0 : hour < 18 ? 1 : 2; // Mañana, Tarde, Noche
      if (!hourCount[period]) {
        hourCount[period] = { count: 0, total: 0 };
      }
      hourCount[period].count++;
      hourCount[period].total += e.amount;
    });

    const sortedPeriods = Object.entries(hourCount)
      .sort((a, b) => b[1].count - a[1].count);
    const topPeriod = sortedPeriods.length > 0 ? sortedPeriods[0] : null;
    
    if (topPeriod) {
      const periods = ['Mañana', 'Tarde', 'Noche'];
      patterns.push({
        type: 'time_of_day',
        pattern: periods[parseInt(topPeriod[0])],
        description: `Gastas más por la ${periods[parseInt(topPeriod[0])].toLowerCase()}`,
        frequency: topPeriod[1].count,
        avgAmount: topPeriod[1].count > 0 ? topPeriod[1].total / topPeriod[1].count : 0,
      });
    }

    // Patrón 3: Gastos recurrentes (descripción similar)
    const descriptionCount: { [key: string]: { count: number; total: number } } = {};
    expenses.forEach(e => {
      const desc = e.description.toLowerCase().trim();
      if (desc.length > 3) {
        if (!descriptionCount[desc]) {
          descriptionCount[desc] = { count: 0, total: 0 };
        }
        descriptionCount[desc].count++;
        descriptionCount[desc].total += e.amount;
      }
    });

    const recurring = Object.entries(descriptionCount)
      .filter(([_, data]) => data.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);

    recurring.forEach(([desc, data]) => {
      patterns.push({
        type: 'recurring',
        pattern: desc,
        description: `Gasto recurrente: "${desc}"`,
        frequency: data.count,
        avgAmount: data.count > 0 ? data.total / data.count : 0,
      });
    });

    return patterns;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error detecting spending patterns', error);
    return [];
  }
}

/**
 * Estadísticas por participante
 */
export function getParticipantStats(expenses: Expense[], participants: Participant[]): ParticipantStats[] {
  try {
    return participants.map(participant => {
      const paidExpenses = expenses.filter(e => e.paidBy === participant.id);
      const involvedExpenses = expenses.filter(e => e.beneficiaries.includes(participant.id));

      const totalPaid = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalOwed = involvedExpenses.reduce((sum, e) => {
        const beneficiaryCount = e.beneficiaries.length;
        return sum + (e.amount / beneficiaryCount);
      }, 0);

      const expenseCount = paidExpenses.length;
      const avgExpenseAmount = expenseCount > 0 ? totalPaid / expenseCount : 0;

      // Top categorías
      const categoryStats = paidExpenses.reduce((acc, e) => {
        if (!acc[e.category]) {
          acc[e.category] = { amount: 0, count: 0 };
        }
        acc[e.category].amount += e.amount;
        acc[e.category].count++;
        return acc;
      }, {} as { [key: string]: { amount: number; count: number } });

      const topCategories = Object.entries(categoryStats)
        .map(([category, stats]) => ({
          category: category as ExpenseCategory,
          amount: stats.amount,
          count: stats.count,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

      // Tendencia de gasto (últimos 30 días vs anteriores)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const recentExpenses = paidExpenses.filter(e => {
        const createdAt = toDate(e.createdAt);
        return createdAt >= cutoffDate;
      });
      const oldExpenses = paidExpenses.filter(e => {
        const createdAt = toDate(e.createdAt);
        return createdAt < cutoffDate;
      });
      
      const recentTotal = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
      const oldTotal = oldExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      let spendingTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (oldTotal > 0) {
        const change = ((recentTotal - oldTotal) / oldTotal) * 100;
        if (change > 10) spendingTrend = 'increasing';
        else if (change < -10) spendingTrend = 'decreasing';
      }

      return {
        participantId: participant.id,
        participantName: participant.name,
        totalPaid,
        totalOwed,
        expenseCount,
        avgExpenseAmount,
        topCategories,
        spendingTrend,
      };
    });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error calculating participant stats', error);
    return [];
  }
}

/**
 * Comparación de períodos
 */
export function getComparisonStats(
  expenses: Expense[],
  periodDays: number = 30
): ComparisonStats {
  try {
    const now = new Date();
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - periodDays);
    
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);

    const currentExpenses = expenses.filter(e => 
      e.createdAt >= currentPeriodStart && e.createdAt < now
    );
    const previousExpenses = expenses.filter(e => 
      e.createdAt >= previousPeriodStart && e.createdAt < currentPeriodStart
    );

    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);

    const currentCount = currentExpenses.length;
    const previousCount = previousExpenses.length;

    const currentAvg = currentCount > 0 ? currentTotal / currentCount : 0;
    const previousAvg = previousCount > 0 ? previousTotal / previousCount : 0;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      currentPeriod: {
        totalSpent: currentTotal,
        expenseCount: currentCount,
        avgExpenseAmount: currentAvg,
      },
      previousPeriod: {
        totalSpent: previousTotal,
        expenseCount: previousCount,
        avgExpenseAmount: previousAvg,
      },
      percentageChange: {
        totalSpent: calculateChange(currentTotal, previousTotal),
        expenseCount: calculateChange(currentCount, previousCount),
        avgExpenseAmount: calculateChange(currentAvg, previousAvg),
      },
    };
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error calculating comparison stats', error);
    return {
      currentPeriod: { totalSpent: 0, expenseCount: 0, avgExpenseAmount: 0 },
      previousPeriod: { totalSpent: 0, expenseCount: 0, avgExpenseAmount: 0 },
      percentageChange: { totalSpent: 0, expenseCount: 0, avgExpenseAmount: 0 },
    };
  }
}

/**
 * Pronóstico de gasto
 */
export function getForecast(
  expenses: Expense[],
  initialBudget: number,
  eventEndDate: Date
): ForecastData {
  try {
    const now = new Date();
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const firstExpenseDate = toDate(expenses[0]?.createdAt);
    const daysElapsed = Math.max(1, Math.floor((now.getTime() - firstExpenseDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.floor((eventEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    const currentRunRate = totalSpent / daysElapsed;
    const projectedSpending = currentRunRate * (daysElapsed + daysRemaining);
    
    const estimatedEndDate = new Date(now);
    const daysUntilBudgetExhausted = (initialBudget - totalSpent) / currentRunRate;
    estimatedEndDate.setDate(now.getDate() + daysUntilBudgetExhausted);

    let budgetStatus: 'on_track' | 'over_budget' | 'under_budget';
    const projectedVsBudget = (projectedSpending / initialBudget) * 100;
    if (projectedVsBudget > 110) budgetStatus = 'over_budget';
    else if (projectedVsBudget < 90) budgetStatus = 'under_budget';
    else budgetStatus = 'on_track';

    return {
      projectedSpending,
      daysRemaining,
      currentRunRate,
      estimatedEndDate,
      budgetStatus,
    };
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error calculating forecast', error);
    return {
      projectedSpending: 0,
      daysRemaining: 0,
      currentRunRate: 0,
      estimatedEndDate: new Date(),
      budgetStatus: 'on_track',
    };
  }
}

/**
 * Obtener top gastos
 */
export function getTopExpenses(expenses: Expense[], limit: number = 5): Expense[] {
  return [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * Calcular tasa de gasto diaria
 */
export function getDailySpendingRate(expenses: Expense[]): { [date: string]: number } {
  const dailySpending: { [date: string]: number } = {};
  
  expenses.forEach(expense => {
    const createdAt = toDate(expense.createdAt);
    const dateKey = createdAt.toISOString().substring(0, 10);
    dailySpending[dateKey] = (dailySpending[dateKey] || 0) + expense.amount;
  });
  
  return dailySpending;
}
