/**
 * 🏆 Sistema de Gamificación y Badges
 * Calcula logros, estadísticas divertidas y badges para participantes
 */

import { Expense, Participant, Event } from '../types';

export interface Badge {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}

export interface ParticipantStats {
  participantId: string;
  participantName: string;
  badges: Badge[];
  stats: {
    totalPaid: number;
    totalExpenses: number;
    averageExpense: number;
    biggestExpense: number;
    favoriteCategory: string;
    daysActive: number;
    photoUploadRate: number;
  };
  rankings: {
    mostGenerous: number; // Posición en ranking
    mostActive: number;
    mostOrganized: number;
  };
  funFacts: string[];
}

/**
 * Define todos los badges disponibles
 */
const ALL_BADGES: Omit<Badge, 'unlockedAt'>[] = [
  {
    id: 'generous_gold',
    name: '💰 Pagador Generoso',
    nameEn: '💰 Generous Payer',
    description: 'Ha pagado más del 40% del total de gastos',
    descriptionEn: 'Paid more than 40% of total expenses',
    icon: '💰',
    color: '#F59E0B',
    rarity: 'legendary',
  },
  {
    id: 'organized_master',
    name: '📊 Maestro Organizado',
    nameEn: '📊 Master Organizer',
    description: 'Subió fotos de recibos en el 80% de sus gastos',
    descriptionEn: 'Uploaded receipt photos in 80% of expenses',
    icon: '📊',
    color: '#8B5CF6',
    rarity: 'epic',
  },
  {
    id: 'foodie',
    name: '🍕 Foodie',
    nameEn: '🍕 Foodie',
    description: 'Más del 50% de gastos en comida',
    descriptionEn: 'More than 50% of expenses in food',
    icon: '🍕',
    color: '#EF4444',
    rarity: 'common',
  },
  {
    id: 'traveler',
    name: '✈️ Viajero',
    nameEn: '✈️ Traveler',
    description: 'Más del 30% de gastos en transporte',
    descriptionEn: 'More than 30% of expenses in transport',
    icon: '✈️',
    color: '#3B82F6',
    rarity: 'common',
  },
  {
    id: 'party_animal',
    name: '🎉 Party Animal',
    nameEn: '🎉 Party Animal',
    description: 'Más del 25% de gastos en entretenimiento',
    descriptionEn: 'More than 25% of expenses in entertainment',
    icon: '🎉',
    color: '#EC4899',
    rarity: 'rare',
  },
  {
    id: 'early_bird',
    name: '🌅 Madrugador',
    nameEn: '🌅 Early Bird',
    description: 'Primer gasto del evento',
    descriptionEn: 'First expense of the event',
    icon: '🌅',
    color: '#F59E0B',
    rarity: 'rare',
  },
  {
    id: 'night_owl',
    name: '🦉 Noctámbulo',
    nameEn: '🦉 Night Owl',
    description: 'Último gasto del evento',
    descriptionEn: 'Last expense of the event',
    icon: '🦉',
    color: '#6366F1',
    rarity: 'rare',
  },
  {
    id: 'big_spender',
    name: '💎 Gran Gastador',
    nameEn: '💎 Big Spender',
    description: 'Gasto individual más alto del evento',
    descriptionEn: 'Highest individual expense in event',
    icon: '💎',
    color: '#14B8A6',
    rarity: 'epic',
  },
  {
    id: 'balanced',
    name: '⚖️ Equilibrado',
    nameEn: '⚖️ Balanced',
    description: 'Balance final menor a 20€',
    descriptionEn: 'Final balance less than 20€',
    icon: '⚖️',
    color: '#10B981',
    rarity: 'rare',
  },
  {
    id: 'speed_demon',
    name: '⚡ Rayo',
    nameEn: '⚡ Speed Demon',
    description: 'Más de 5 gastos en un solo día',
    descriptionEn: 'More than 5 expenses in a single day',
    icon: '⚡',
    color: '#F59E0B',
    rarity: 'rare',
  },
  {
    id: 'minimalist',
    name: '🎯 Minimalista',
    nameEn: '🎯 Minimalist',
    description: 'Gastó menos del 70% de su presupuesto individual',
    descriptionEn: 'Spent less than 70% of individual budget',
    icon: '🎯',
    color: '#10B981',
    rarity: 'epic',
  },
  {
    id: 'team_player',
    name: '🤝 Jugador de Equipo',
    nameEn: '🤝 Team Player',
    description: 'Compartió más del 80% de sus gastos',
    descriptionEn: 'Shared more than 80% of expenses',
    icon: '🤝',
    color: '#8B5CF6',
    rarity: 'rare',
  },
];

/**
 * Calcula las estadísticas y badges de un participante
 */
export function calculateParticipantStats(
  participant: Participant,
  expenses: Expense[],
  allParticipants: Participant[],
  event: Event,
  language: 'es' | 'en' = 'es'
): ParticipantStats {
  // Filtrar gastos del participante
  const participantExpenses = expenses.filter(exp => exp.paidBy === participant.id);
  
  // Calcular estadísticas básicas
  const totalPaid = participantExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpenses = participantExpenses.length;
  const averageExpense = totalExpenses > 0 ? totalPaid / totalExpenses : 0;
  const biggestExpense = totalExpenses > 0 
    ? (participantExpenses.length === 1 ? participantExpenses[0].amount : Math.max(...participantExpenses.map(exp => exp.amount)))
    : 0;

  // Categoría favorita
  const categoryCount: { [key: string]: number } = {};
  participantExpenses.forEach(exp => {
    categoryCount[exp.category] = (categoryCount[exp.category] || 0) + 1;
  });
  const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
  const favoriteCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'none';

  // Días activos
  const uniqueDays = new Set(
    participantExpenses.map(exp => new Date(exp.date).toDateString())
  );
  const daysActive = uniqueDays.size;

  // Tasa de fotos
  const expensesWithPhotos = participantExpenses.filter(exp => exp.receiptPhoto).length;
  const photoUploadRate = totalExpenses > 0 ? (expensesWithPhotos / totalExpenses) * 100 : 0;

  // Calcular badges
  const badges = calculateBadges(
    participant,
    participantExpenses,
    expenses,
    allParticipants,
    event,
    {
      totalPaid,
      totalExpenses,
      photoUploadRate,
      favoriteCategory,
      biggestExpense,
      daysActive,
    }
  );

  // Calcular rankings
  const rankings = calculateRankings(participant, expenses, allParticipants);

  // Generar fun facts
  const funFacts = generateFunFacts(
    participant,
    participantExpenses,
    expenses,
    event,
    language
  );

  return {
    participantId: participant.id,
    participantName: participant.name,
    badges,
    stats: {
      totalPaid,
      totalExpenses,
      averageExpense,
      biggestExpense,
      favoriteCategory,
      daysActive,
      photoUploadRate,
    },
    rankings,
    funFacts,
  };
}

/**
 * Calcula qué badges ha desbloqueado un participante
 */
function calculateBadges(
  participant: Participant,
  participantExpenses: Expense[],
  allExpenses: Expense[],
  allParticipants: Participant[],
  event: Event,
  stats: {
    totalPaid: number;
    totalExpenses: number;
    photoUploadRate: number;
    favoriteCategory: string;
    biggestExpense: number;
    daysActive: number;
  }
): Badge[] {
  const unlockedBadges: Badge[] = [];
  const totalEventExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Generous Gold - Pagó más del 40%
  if (totalEventExpenses > 0 && (stats.totalPaid / totalEventExpenses) > 0.4) {
    unlockedBadges.push({ ...ALL_BADGES[0], unlockedAt: new Date() });
  }

  // Organized Master - 80% de fotos
  if (stats.photoUploadRate >= 80) {
    unlockedBadges.push({ ...ALL_BADGES[1], unlockedAt: new Date() });
  }

  // Foodie - 50% comida
  const foodExpenses = participantExpenses.filter(exp => exp.category === 'food');
  const foodPercentage = stats.totalExpenses > 0 
    ? (foodExpenses.length / stats.totalExpenses) * 100 
    : 0;
  if (foodPercentage >= 50) {
    unlockedBadges.push({ ...ALL_BADGES[2], unlockedAt: new Date() });
  }

  // Traveler - 30% transporte
  const transportExpenses = participantExpenses.filter(exp => exp.category === 'transport');
  const transportPercentage = stats.totalExpenses > 0 
    ? (transportExpenses.length / stats.totalExpenses) * 100 
    : 0;
  if (transportPercentage >= 30) {
    unlockedBadges.push({ ...ALL_BADGES[3], unlockedAt: new Date() });
  }

  // Party Animal - 25% entretenimiento
  const entertainmentExpenses = participantExpenses.filter(exp => exp.category === 'entertainment');
  const entertainmentPercentage = stats.totalExpenses > 0 
    ? (entertainmentExpenses.length / stats.totalExpenses) * 100 
    : 0;
  if (entertainmentPercentage >= 25) {
    unlockedBadges.push({ ...ALL_BADGES[4], unlockedAt: new Date() });
  }

  // Early Bird - Primer gasto
  const sortedExpenses = [...allExpenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (sortedExpenses[0]?.paidBy === participant.id) {
    unlockedBadges.push({ ...ALL_BADGES[5], unlockedAt: new Date() });
  }

  // Night Owl - Último gasto
  if (sortedExpenses[sortedExpenses.length - 1]?.paidBy === participant.id) {
    unlockedBadges.push({ ...ALL_BADGES[6], unlockedAt: new Date() });
  }

  // Big Spender - Gasto más alto
  const highestExpense = Math.max(...allExpenses.map(exp => exp.amount));
  if (stats.biggestExpense === highestExpense && highestExpense > 0) {
    unlockedBadges.push({ ...ALL_BADGES[7], unlockedAt: new Date() });
  }

  // Balanced - Balance menor a 20€
  if (Math.abs(participant.currentBalance) < 20) {
    unlockedBadges.push({ ...ALL_BADGES[8], unlockedAt: new Date() });
  }

  // Speed Demon - Más de 5 gastos en un día
  const expensesByDay: { [key: string]: number } = {};
  participantExpenses.forEach(exp => {
    const day = new Date(exp.date).toDateString();
    expensesByDay[day] = (expensesByDay[day] || 0) + 1;
  });
  const maxExpensesInDay = Math.max(...Object.values(expensesByDay), 0);
  if (maxExpensesInDay >= 5) {
    unlockedBadges.push({ ...ALL_BADGES[9], unlockedAt: new Date() });
  }

  // Minimalist - Gastó menos del 70% del presupuesto individual
  if (participant.individualBudget > 0) {
    const spentPercentage = (stats.totalPaid / participant.individualBudget) * 100;
    if (spentPercentage < 70) {
      unlockedBadges.push({ ...ALL_BADGES[10], unlockedAt: new Date() });
    }
  }

  // Team Player - Compartió más del 80%
  const sharedExpenses = participantExpenses.filter(exp => 
    exp.beneficiaries.length > 1 || exp.splitType !== 'equal'
  );
  const sharedPercentage = stats.totalExpenses > 0 
    ? (sharedExpenses.length / stats.totalExpenses) * 100 
    : 0;
  if (sharedPercentage >= 80) {
    unlockedBadges.push({ ...ALL_BADGES[11], unlockedAt: new Date() });
  }

  return unlockedBadges;
}

/**
 * Calcula los rankings del participante
 */
function calculateRankings(
  participant: Participant,
  expenses: Expense[],
  allParticipants: Participant[]
): {
  mostGenerous: number;
  mostActive: number;
  mostOrganized: number;
} {
  // Ranking de generosidad (quien pagó más)
  const paidByParticipant: { [key: string]: number } = {};
  expenses.forEach(exp => {
    paidByParticipant[exp.paidBy] = (paidByParticipant[exp.paidBy] || 0) + exp.amount;
  });
  const generosityRanking = Object.entries(paidByParticipant)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  const mostGenerous = generosityRanking.indexOf(participant.id) + 1;

  // Ranking de actividad (más gastos registrados)
  const expensesByParticipant: { [key: string]: number } = {};
  expenses.forEach(exp => {
    expensesByParticipant[exp.paidBy] = (expensesByParticipant[exp.paidBy] || 0) + 1;
  });
  const activityRanking = Object.entries(expensesByParticipant)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  const mostActive = activityRanking.indexOf(participant.id) + 1;

  // Ranking de organización (más fotos subidas)
  const photosByParticipant: { [key: string]: number } = {};
  expenses.forEach(exp => {
    if (exp.receiptPhoto) {
      photosByParticipant[exp.paidBy] = (photosByParticipant[exp.paidBy] || 0) + 1;
    }
  });
  const organizationRanking = Object.entries(photosByParticipant)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  const mostOrganized = organizationRanking.indexOf(participant.id) + 1;

  return {
    mostGenerous: mostGenerous || allParticipants.length,
    mostActive: mostActive || allParticipants.length,
    mostOrganized: mostOrganized || allParticipants.length,
  };
}

/**
 * Genera fun facts sobre el participante
 */
function generateFunFacts(
  participant: Participant,
  participantExpenses: Expense[],
  allExpenses: Expense[],
  event: Event,
  language: 'es' | 'en'
): string[] {
  const facts: string[] = [];
  const es = language === 'es';

  const totalPaid = participantExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const averageExpense = participantExpenses.length > 0 
    ? totalPaid / participantExpenses.length 
    : 0;

  // Porcentaje del total
  const totalEvent = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  if (totalEvent > 0) {
    const percentage = (totalPaid / totalEvent) * 100;
    facts.push(
      es
        ? `Has pagado el ${percentage.toFixed(1)}% del total de gastos`
        : `You paid ${percentage.toFixed(1)}% of total expenses`
    );
  }

  // Gasto promedio comparado con el evento
  const allAverages = allExpenses.reduce((acc, exp) => {
    acc[exp.paidBy] = acc[exp.paidBy] || [];
    acc[exp.paidBy].push(exp.amount);
    return acc;
  }, {} as { [key: string]: number[] });
  
  const groupAverage = Object.values(allAverages).flat().reduce((sum, amt) => sum + amt, 0) / 
    Object.values(allAverages).flat().length;

  if (averageExpense > groupAverage * 1.2) {
    facts.push(
      es
        ? `Tus gastos son un 20% más altos que el promedio del evento`
        : `Your expenses are 20% higher than group average`
    );
  } else if (averageExpense < groupAverage * 0.8) {
    facts.push(
      es
        ? `Tus gastos son un 20% más bajos que el promedio del evento`
        : `Your expenses are 20% lower than group average`
    );
  }

  // Categoría favorita
  const categoryCount: { [key: string]: number } = {};
  participantExpenses.forEach(exp => {
    categoryCount[exp.category] = (categoryCount[exp.category] || 0) + 1;
  });
  const favorite = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  if (favorite) {
    const categoryNames = {
      food: es ? 'comida' : 'food',
      transport: es ? 'transporte' : 'transport',
      accommodation: es ? 'alojamiento' : 'accommodation',
      entertainment: es ? 'entretenimiento' : 'entertainment',
      shopping: es ? 'compras' : 'shopping',
    };
    facts.push(
      es
        ? `Tu categoría favorita es ${categoryNames[favorite[0] as keyof typeof categoryNames]} (${favorite[1]} gastos)`
        : `Your favorite category is ${categoryNames[favorite[0] as keyof typeof categoryNames]} (${favorite[1]} expenses)`
    );
  }

  // Días más activos
  const expensesByDay: { [key: string]: number } = {};
  participantExpenses.forEach(exp => {
    const day = new Date(exp.date).toLocaleDateString(es ? 'es-ES' : 'en-US', { 
      weekday: 'long' 
    });
    expensesByDay[day] = (expensesByDay[day] || 0) + 1;
  });
  const busiestDay = Object.entries(expensesByDay).sort((a, b) => b[1] - a[1])[0];
  if (busiestDay) {
    facts.push(
      es
        ? `Tu día más activo fue ${busiestDay[0]} con ${busiestDay[1]} gastos`
        : `Your busiest day was ${busiestDay[0]} with ${busiestDay[1]} expenses`
    );
  }

  return facts;
}

/**
 * Obtiene el ranking completo del evento
 */
export function getEventLeaderboard(
  expenses: Expense[],
  participants: Participant[],
  event: Event
): Array<{
  rank: number;
  participant: Participant;
  totalPaid: number;
  totalExpenses: number;
  badges: Badge[];
}> {
  const leaderboard = participants.map(participant => {
    const participantExpenses = expenses.filter(exp => exp.paidBy === participant.id);
    const stats = calculateParticipantStats(participant, expenses, participants, event);
    
    return {
      rank: 0, // Se calculará después
      participant,
      totalPaid: stats.stats.totalPaid,
      totalExpenses: stats.stats.totalExpenses,
      badges: stats.badges,
    };
  });

  // Ordenar por total pagado (más generoso)
  leaderboard.sort((a, b) => b.totalPaid - a.totalPaid);
  
  // Asignar rankings
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}
