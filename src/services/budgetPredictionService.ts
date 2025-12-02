/**
 * 🤖 Servicio de Predicción de Presupuesto con IA
 * Analiza patrones de gasto y predice sobrepasamiento
 */

import { Expense, Event, Participant } from '../types';

export interface BudgetPrediction {
  willExceed: boolean;
  daysUntilExceeded?: number;
  projectedTotal: number;
  dailyAverage: number;
  suggestion: string;
  confidence: number; // 0-1
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  icon: string;
}

export interface SpendingInsight {
  category: string;
  percentage: number;
  suggestion: string;
  savings: number;
}

/**
 * Predice si se va a exceder el presupuesto
 */
export function predictBudgetExceedance(
  event: Event,
  expenses: Expense[],
  participants: Participant[]
): BudgetPrediction {
  const now = new Date();
  
  // Usar fechas opcionales o crear defaults (30 días desde creación)
  const eventStart = event.startDate ? new Date(event.startDate) : new Date(event.createdAt);
  const eventEnd = event.endDate ? new Date(event.endDate) : new Date(eventStart.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Usar budget o initialBudget como fallback
  const budget = event.budget ?? event.initialBudget;
  
  // Días transcurridos y restantes
  const totalDays = Math.max(1, Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.max(1, Math.ceil((now.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, totalDays - daysPassed);
  
  // Total gastado hasta ahora
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Promedio diario
  const dailyAverage = totalSpent / daysPassed;
  
  // Proyección total
  const projectedTotal = dailyAverage * totalDays;
  
  // ¿Se va a exceder?
  const willExceed = projectedTotal > budget;
  
  // Calcular días hasta exceder
  let daysUntilExceeded: number | undefined;
  if (willExceed && dailyAverage > 0) {
    const remainingBudget = budget - totalSpent;
    daysUntilExceeded = Math.max(0, Math.ceil(remainingBudget / dailyAverage));
  }
  
  // Generar alertas
  const alerts: BudgetAlert[] = [];
  const spentPercentage = (totalSpent / budget) * 100;
  const daysPercentage = (daysPassed / totalDays) * 100;
  
  if (willExceed) {
    if (daysUntilExceeded !== undefined && daysUntilExceeded <= 2) {
      alerts.push({
        type: 'danger',
        message: `¡CRÍTICO! Excederás el presupuesto en ${daysUntilExceeded} días`,
        icon: '🚨',
      });
    } else if (daysUntilExceeded !== undefined && daysUntilExceeded <= 5) {
      alerts.push({
        type: 'warning',
        message: `¡ATENCIÓN! Excederás el presupuesto en ${daysUntilExceeded} días`,
        icon: '⚠️',
      });
    }
  }
  
  // Alerta si se gasta más rápido que el promedio esperado
  if (spentPercentage > daysPercentage + 15) {
    alerts.push({
      type: 'warning',
      message: `Gastas más rápido de lo esperado (${spentPercentage.toFixed(0)}% vs ${daysPercentage.toFixed(0)}% del tiempo)`,
      icon: '📊',
    });
  }
  
  // Alerta si quedan pocos días
  if (daysRemaining <= 2 && daysRemaining > 0 && totalSpent < budget * 0.7) {
    alerts.push({
      type: 'info',
      message: `Quedan ${daysRemaining} días. Tienes ${(budget - totalSpent).toFixed(0)}€ disponibles`,
      icon: '💰',
    });
  }
  
  // Generar sugerencia
  let suggestion: string;
  const confidence = Math.min(1, daysPassed / 3); // Más confianza después de 3 días
  
  if (willExceed) {
    const dailyReduction = (projectedTotal - budget) / daysRemaining;
    suggestion = `Reduce el gasto diario en ${dailyReduction.toFixed(2)}€ para no exceder el presupuesto`;
  } else {
    const remainingBudget = budget - totalSpent;
    const dailyBudget = daysRemaining > 0 ? remainingBudget / daysRemaining : remainingBudget;
    suggestion = `Puedes gastar hasta ${dailyBudget.toFixed(2)}€/día los próximos ${daysRemaining} días`;
  }
  
  return {
    willExceed,
    daysUntilExceeded,
    projectedTotal,
    dailyAverage,
    suggestion,
    confidence,
    alerts,
  };
}

/**
 * Analiza gastos por categoría y sugiere ahorros
 */
export function analyzeSpendingByCategory(
  expenses: Expense[],
  budget: number
): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  
  // Agrupar por categoría
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });
  
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Analizar cada categoría
  Object.entries(categoryTotals).forEach(([category, amount]) => {
    const percentage = (amount / totalSpent) * 100;
    
    let suggestion = '';
    let savings = 0;
    
    // Sugerencias basadas en porcentajes típicos
    if (category === 'food' && percentage > 40) {
      suggestion = 'Considera comer más en supermercados y menos en restaurantes';
      savings = amount * 0.25; // Ahorrar 25%
    } else if (category === 'transport' && percentage > 25) {
      suggestion = 'Usa transporte público o camina más para ahorrar';
      savings = amount * 0.30; // Ahorrar 30%
    } else if (category === 'entertainment' && percentage > 20) {
      suggestion = 'Busca actividades gratuitas o más económicas';
      savings = amount * 0.40; // Ahorrar 40%
    } else if (category === 'shopping' && percentage > 15) {
      suggestion = 'Reduce las compras no esenciales';
      savings = amount * 0.50; // Ahorrar 50%
    } else if (category === 'accommodation' && percentage > 35) {
      suggestion = 'Considera opciones de alojamiento más económicas';
      savings = amount * 0.20; // Ahorrar 20%
    }
    
    if (suggestion) {
      insights.push({
        category,
        percentage,
        suggestion,
        savings,
      });
    }
  });
  
  // Ordenar por ahorro potencial
  insights.sort((a, b) => b.savings - a.savings);
  
  return insights;
}

/**
 * Compara con eventos similares (simulado - en producción usaría datos reales)
 */
export function compareWithSimilarEvents(
  event: Event,
  totalSpent: number
): {
  isAboveAverage: boolean;
  averageSpending: number;
  percentageDifference: number;
  message: string;
} {
  // Usar fechas opcionales o crear defaults (30 días desde creación)
  const eventStart = event.startDate ? new Date(event.startDate) : new Date(event.createdAt);
  const eventEnd = event.endDate ? new Date(event.endDate) : new Date(eventStart.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Simular promedio basado en duración y número de participantes
  const daysCount = Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Promedios estimados por persona por día
  const averagePerPersonPerDay = 80; // 80€ por persona por día (promedio europeo)
  const participantsCount = event.participantIds.length;
  
  const estimatedAverage = averagePerPersonPerDay * participantsCount * daysCount;
  
  const isAboveAverage = totalSpent > estimatedAverage;
  const percentageDifference = ((totalSpent - estimatedAverage) / estimatedAverage) * 100;
  
  let message: string;
  if (Math.abs(percentageDifference) < 10) {
    message = 'Tu gasto está dentro del promedio esperado';
  } else if (isAboveAverage) {
    message = `Gastas ${Math.abs(percentageDifference).toFixed(0)}% más que grupos similares`;
  } else {
    message = `Gastas ${Math.abs(percentageDifference).toFixed(0)}% menos que grupos similares ¡Bien hecho!`;
  }
  
  return {
    isAboveAverage,
    averageSpending: estimatedAverage,
    percentageDifference,
    message,
  };
}

/**
 * Calcula eficiencia del grupo (qué tan bien administran el presupuesto)
 */
export function calculateGroupEfficiency(
  event: Event,
  expenses: Expense[],
  participants: Participant[]
): {
  score: number; // 0-100
  level: 'Excelente' | 'Bueno' | 'Regular' | 'Necesita mejorar';
  badge: string;
  tips: string[];
} {
  const budget = event.budget ?? event.initialBudget;
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const budgetUsagePercentage = (totalSpent / budget) * 100;
  
  let score = 100;
  const tips: string[] = [];
  
  // Penalizar por exceso de presupuesto
  if (budgetUsagePercentage > 100) {
    score -= (budgetUsagePercentage - 100);
    tips.push('Reducir gastos para cumplir con el presupuesto');
  }
  
  // Penalizar por gastos muy desbalanceados
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });
  
  const foodPercentage = ((categoryTotals['food'] || 0) / totalSpent) * 100;
  if (foodPercentage > 50) {
    score -= 10;
    tips.push('Diversificar el presupuesto: demasiado gasto en comida');
  }
  
  // Bonificar por uso de fotos de recibos
  const expensesWithPhotos = expenses.filter(exp => exp.receiptPhoto).length;
  const photoPercentage = (expensesWithPhotos / Math.max(1, expenses.length)) * 100;
  if (photoPercentage > 70) {
    score += 5;
  } else {
    tips.push('Adjuntar fotos de recibos para mejor control');
  }
  
  // Bonificar por distribución equitativa
  const participantBalances = participants.map(p => p.currentBalance);
  const avgBalance = participantBalances.reduce((sum, b) => sum + Math.abs(b), 0) / participantBalances.length;
  if (avgBalance < 50) {
    score += 10;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let level: 'Excelente' | 'Bueno' | 'Regular' | 'Necesita mejorar';
  let badge: string;
  
  if (score >= 85) {
    level = 'Excelente';
    badge = '🏆';
  } else if (score >= 70) {
    level = 'Bueno';
    badge = '⭐';
  } else if (score >= 50) {
    level = 'Regular';
    badge = '👍';
  } else {
    level = 'Necesita mejorar';
    badge = '📈';
  }
  
  return {
    score,
    level,
    badge,
    tips,
  };
}
