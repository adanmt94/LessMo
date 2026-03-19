/**
 * Contextual Recommendations Service
 * Generate smart suggestions based on location, time, weather, and spending patterns
 */

import { Event, Expense, Participant } from '../types';

export interface Recommendation {
  id: string;
  type: 'budget' | 'weather' | 'location' | 'category' | 'timing' | 'social';
  icon: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionLabelEn?: string;
  actionData?: any;
}

/**
 * Generate contextual recommendations for an event
 */
export const generateRecommendations = async (
  event: Event,
  expenses: Expense[],
  participants: Participant[],
  currentLocation?: { latitude: number; longitude: number }
): Promise<Recommendation[]> => {
  const recommendations: Recommendation[] = [];
  const now = new Date();

  // Budget-based recommendations
  const budgetRecs = analyzeBudget(event, expenses);
  recommendations.push(...budgetRecs);

  // Time-based recommendations
  const timeRecs = analyzeTime(now, expenses);
  recommendations.push(...timeRecs);

  // Category-based recommendations
  const categoryRecs = analyzeCategories(expenses, event);
  recommendations.push(...categoryRecs);

  // Social recommendations
  const socialRecs = analyzeSocialPatterns(participants, expenses);
  recommendations.push(...socialRecs);

  // Weather-based recommendations (simulated)
  const weatherRecs = await getWeatherRecommendations(currentLocation);
  recommendations.push(...weatherRecs);

  // Location-based recommendations
  if (currentLocation) {
    const locationRecs = getLocationRecommendations(currentLocation);
    recommendations.push(...locationRecs);
  }

  // Sort by priority
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

/**
 * Analyze budget and spending patterns
 */
const analyzeBudget = (event: Event, expenses: Expense[]): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetUsed = (totalSpent / event.initialBudget) * 100;

  // High spending warning
  if (budgetUsed > 80) {
    recommendations.push({
      id: 'budget-high',
      type: 'budget',
      icon: '⚠️',
      title: 'Presupuesto casi agotado',
      titleEn: 'Budget almost depleted',
      description: `Has gastado ${budgetUsed.toFixed(0)}% del presupuesto. Considera reducir gastos.`,
      descriptionEn: `You've spent ${budgetUsed.toFixed(0)}% of budget. Consider reducing expenses.`,
      priority: 'high',
    });
  }

  // Good budget management
  if (budgetUsed < 60 && expenses.length > 5) {
    recommendations.push({
      id: 'budget-good',
      type: 'budget',
      icon: '✅',
      title: 'Gestión eficiente',
      titleEn: 'Efficient management',
      description: `Solo has usado ${budgetUsed.toFixed(0)}% del presupuesto. ¡Excelente control!`,
      descriptionEn: `You've only used ${budgetUsed.toFixed(0)}% of budget. Great control!`,
      priority: 'low',
    });
  }

  // Daily average recommendation
  const eventStart = event.startDate ? new Date(event.startDate) : new Date(event.createdAt);
  const eventEnd = event.endDate ? new Date(event.endDate) : new Date(eventStart.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const daysPassed = Math.ceil((new Date().getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
  if (daysPassed > 0) {
    const dailyAverage = totalSpent / daysPassed;
    const daysRemaining = Math.ceil((eventEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 0) {
      const projectedTotal = totalSpent + (dailyAverage * daysRemaining);
      
      if (projectedTotal > event.initialBudget * 1.1) {
        recommendations.push({
          id: 'budget-projection',
          type: 'budget',
          icon: '📊',
          title: 'Reduce el gasto diario',
          titleEn: 'Reduce daily spending',
          description: `A este ritmo gastarás ${projectedTotal.toFixed(0)}€. Reduce ${(dailyAverage * 0.2).toFixed(0)}€/día.`,
          descriptionEn: `At this rate you'll spend ${projectedTotal.toFixed(0)}€. Reduce ${(dailyAverage * 0.2).toFixed(0)}€/day.`,
          priority: 'high',
        });
      }
    }
  }

  return recommendations;
};

/**
 * Analyze time patterns
 */
const analyzeTime = (now: Date, expenses: Expense[]): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const hour = now.getHours();

  // Meal time recommendations
  if (hour >= 13 && hour <= 15) {
    const todayLunch = expenses.find(e => {
      const expenseDate = new Date(e.date);
      return (
        e.category === 'food' &&
        expenseDate.toDateString() === now.toDateString() &&
        expenseDate.getHours() >= 12 &&
        expenseDate.getHours() <= 16
      );
    });

    if (!todayLunch) {
      recommendations.push({
        id: 'time-lunch',
        type: 'timing',
        icon: '🍽️',
        title: 'Hora de comer',
        titleEn: 'Lunch time',
        description: 'Es hora de almorzar. Encuentra restaurantes cercanos.',
        descriptionEn: 'Time for lunch. Find nearby restaurants.',
        priority: 'medium',
        actionLabel: 'Ver opciones',
        actionLabelEn: 'View options',
      });
    }
  }

  // Evening recommendations
  if (hour >= 19 && hour <= 22) {
    recommendations.push({
      id: 'time-evening',
      type: 'timing',
      icon: '🌆',
      title: 'Actividades nocturnas',
      titleEn: 'Evening activities',
      description: 'Explora opciones de entretenimiento para la noche.',
      descriptionEn: 'Explore entertainment options for tonight.',
      priority: 'low',
    });
  }

  // Late night warning
  if (hour >= 23 || hour <= 5) {
    const recentExpenses = expenses.filter(e => {
      const diff = now.getTime() - new Date(e.date).getTime();
      return diff < 3 * 60 * 60 * 1000; // Last 3 hours
    });

    if (recentExpenses.length > 2) {
      recommendations.push({
        id: 'time-late',
        type: 'timing',
        icon: '🌙',
        title: 'Gastos nocturnos',
        titleEn: 'Late night expenses',
        description: 'Has registrado varios gastos tarde. Revisa tu presupuesto.',
        descriptionEn: 'You\'ve logged several late expenses. Check your budget.',
        priority: 'medium',
      });
    }
  }

  return recommendations;
};

/**
 * Analyze spending categories
 */
const analyzeCategories = (expenses: Expense[], event: Event): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Group by category
  const categoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    const current = categoryTotals.get(expense.category) || 0;
    categoryTotals.set(expense.category, current + expense.amount);
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Food spending high
  const foodSpent = categoryTotals.get('food') || 0;
  if (foodSpent / totalSpent > 0.5 && expenses.length > 5) {
    recommendations.push({
      id: 'category-food',
      type: 'category',
      icon: '🍔',
      title: 'Alto gasto en comida',
      titleEn: 'High food spending',
      description: `${((foodSpent / totalSpent) * 100).toFixed(0)}% del gasto es comida. Considera cocinar más.`,
      descriptionEn: `${((foodSpent / totalSpent) * 100).toFixed(0)}% of spending is food. Consider cooking more.`,
      priority: 'medium',
    });
  }

  // Transport recommendations
  const transportSpent = categoryTotals.get('transport') || 0;
  if (transportSpent / totalSpent > 0.3) {
    recommendations.push({
      id: 'category-transport',
      type: 'category',
      icon: '🚇',
      title: 'Optimiza el transporte',
      titleEn: 'Optimize transport',
      description: 'Considera tarjetas de transporte público para ahorrar.',
      descriptionEn: 'Consider public transport cards to save money.',
      priority: 'medium',
    });
  }

  // Balanced spending
  if (categoryTotals.size >= 4 && expenses.length > 10) {
    const isBalanced = Array.from(categoryTotals.values()).every(
      amount => amount / totalSpent < 0.4
    );

    if (isBalanced) {
      recommendations.push({
        id: 'category-balanced',
        type: 'category',
        icon: '⚖️',
        title: 'Gasto equilibrado',
        titleEn: 'Balanced spending',
        description: 'Tienes una buena distribución de gastos entre categorías.',
        descriptionEn: 'You have good spending distribution across categories.',
        priority: 'low',
      });
    }
  }

  return recommendations;
};

/**
 * Analyze social patterns
 */
const analyzeSocialPatterns = (participants: Participant[], expenses: Expense[]): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Shared expenses recommendation
  const sharedExpenses = expenses.filter(e => e.splitType === 'equal' && (e.beneficiaries || e.participantIds || []).length > 1);
  const individualExpenses = expenses.filter(e => (e.beneficiaries || e.participantIds || []).length === 1);

  if (sharedExpenses.length < individualExpenses.length * 0.3 && participants.length > 2) {
    recommendations.push({
      id: 'social-share',
      type: 'social',
      icon: '🤝',
      title: 'Compartir más gastos',
      titleEn: 'Share more expenses',
      description: 'Compartir gastos puede reducir costos individuales.',
      descriptionEn: 'Sharing expenses can reduce individual costs.',
      priority: 'medium',
    });
  }

  // Group activity recommendation
  if (participants.length >= 3 && expenses.filter(e => e.category === 'entertainment').length < 2) {
    recommendations.push({
      id: 'social-activity',
      type: 'social',
      icon: '🎉',
      title: 'Actividad grupal',
      titleEn: 'Group activity',
      description: 'Organiza una actividad para todos. ¡Más diversión, menor costo!',
      descriptionEn: 'Organize an activity for everyone. More fun, lower cost!',
      priority: 'low',
    });
  }

  return recommendations;
};

/**
 * Get weather-based recommendations (simulated)
 */
const getWeatherRecommendations = async (
  location?: { latitude: number; longitude: number }
): Promise<Recommendation[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // In production: Call weather API (OpenWeatherMap, WeatherAPI, etc.)
  // For now, simulate random weather
  const conditions = ['sunny', 'rainy', 'cloudy', 'hot', 'cold'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];

  const recommendations: Recommendation[] = [];

  if (condition === 'rainy') {
    recommendations.push({
      id: 'weather-rainy',
      type: 'weather',
      icon: '🌧️',
      title: 'Lluvias previstas',
      titleEn: 'Rain expected',
      description: 'Considera actividades de interior. Museos, centros comerciales...',
      descriptionEn: 'Consider indoor activities. Museums, shopping centers...',
      priority: 'high',
    });
  }

  if (condition === 'sunny') {
    recommendations.push({
      id: 'weather-sunny',
      type: 'weather',
      icon: '☀️',
      title: 'Día soleado',
      titleEn: 'Sunny day',
      description: 'Perfecto para actividades al aire libre. Parques, playas...',
      descriptionEn: 'Perfect for outdoor activities. Parks, beaches...',
      priority: 'medium',
    });
  }

  if (condition === 'hot') {
    recommendations.push({
      id: 'weather-hot',
      type: 'weather',
      icon: '🌡️',
      title: 'Calor intenso',
      titleEn: 'Intense heat',
      description: 'Mantente hidratado. Busca lugares con aire acondicionado.',
      descriptionEn: 'Stay hydrated. Look for air-conditioned places.',
      priority: 'high',
    });
  }

  return recommendations;
};

/**
 * Get location-based recommendations
 */
const getLocationRecommendations = (
  location: { latitude: number; longitude: number }
): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Simulate nearby places (in production: use Google Places API, Foursquare, etc.)
  recommendations.push({
    id: 'location-nearby',
    type: 'location',
    icon: '📍',
    title: 'Lugares cercanos',
    titleEn: 'Nearby places',
    description: 'Explora restaurantes y atracciones a 500m de tu ubicación.',
    descriptionEn: 'Explore restaurants and attractions within 500m.',
    priority: 'medium',
    actionLabel: 'Ver mapa',
    actionLabelEn: 'View map',
  });

  return recommendations;
};

/**
 * Get personalized tips based on user behavior
 */
export const getPersonalizedTips = (
  expenses: Expense[],
  participants: Participant[],
  language: 'es' | 'en'
): string[] => {
  const tips: string[] = [];

  // Photo upload rate
  const expensesWithPhoto = expenses.filter(e => e.receiptPhoto).length;
  const photoRate = expenses.length > 0 ? (expensesWithPhoto / expenses.length) * 100 : 0;

  if (photoRate < 50 && expenses.length > 5) {
    tips.push(
      language === 'es'
        ? '📸 Sube fotos de recibos para mejor organización'
        : '📸 Upload receipt photos for better organization'
    );
  }

  // Split variety
  const hasCustomSplits = expenses.some(e => e.splitType === 'custom');
  if (!hasCustomSplits && expenses.length > 5) {
    tips.push(
      language === 'es'
        ? '✂️ Usa splits personalizados para gastos desiguales'
        : '✂️ Use custom splits for unequal expenses'
    );
  }

  // Category usage
  const categories = new Set(expenses.map(e => e.category));
  if (categories.size <= 2 && expenses.length > 5) {
    tips.push(
      language === 'es'
        ? '🏷️ Categoriza mejor tus gastos para análisis detallado'
        : '🏷️ Better categorize expenses for detailed analysis'
    );
  }

  return tips;
};
