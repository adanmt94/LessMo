/**
 * Itinerary Service
 * Manage trip itinerary stops and link expenses to locations
 */

import { Event, Expense } from '../types';

export interface ItineraryStop {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  date: Date;
  estimatedDuration?: number; // minutes
  category: 'accommodation' | 'activity' | 'transport' | 'food' | 'other';
  photoUrl?: string;
  linkedExpenseIds: string[];
  order: number;
  createdAt: Date;
}

export interface TimelineItem {
  id: string;
  type: 'stop' | 'expense';
  date: Date;
  data: ItineraryStop | Expense;
}

/**
 * Create a new itinerary stop
 */
export const createItineraryStop = async (
  stop: Omit<ItineraryStop, 'id' | 'createdAt'>
): Promise<ItineraryStop> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const newStop: ItineraryStop = {
    ...stop,
    id: `stop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  };

  // In production: Save to Firestore
  return newStop;
};

/**
 * Get all stops for an event
 */
export const getEventStops = async (eventId: string): Promise<ItineraryStop[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // In production: Fetch from Firestore
  // For now, return empty array (user will create stops)
  return [];
};

/**
 * Update an itinerary stop
 */
export const updateItineraryStop = async (
  stopId: string,
  updates: Partial<ItineraryStop>
): Promise<ItineraryStop> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In production: Update in Firestore
  return { ...updates } as ItineraryStop;
};

/**
 * Delete an itinerary stop
 */
export const deleteItineraryStop = async (stopId: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In production: Delete from Firestore
};

/**
 * Link an expense to an itinerary stop
 */
export const linkExpenseToStop = async (
  stopId: string,
  expenseId: string
): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // In production: Update stop's linkedExpenseIds in Firestore
};

/**
 * Unlink an expense from an itinerary stop
 */
export const unlinkExpenseFromStop = async (
  stopId: string,
  expenseId: string
): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // In production: Remove expenseId from stop's linkedExpenseIds
};

/**
 * Generate combined timeline of stops and expenses
 */
export const generateTimeline = (
  stops: ItineraryStop[],
  expenses: Expense[]
): TimelineItem[] => {
  const timeline: TimelineItem[] = [];

  // Add stops
  for (const stop of stops) {
    timeline.push({
      id: stop.id,
      type: 'stop',
      date: new Date(stop.date),
      data: stop,
    });
  }

  // Add expenses
  for (const expense of expenses) {
    timeline.push({
      id: expense.id,
      type: 'expense',
      date: new Date(expense.date),
      data: expense,
    });
  }

  // Sort by date ascending
  timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

  return timeline;
};

/**
 * Group timeline items by day
 */
export const groupTimelineByDay = (
  timeline: TimelineItem[]
): Map<string, TimelineItem[]> => {
  const grouped = new Map<string, TimelineItem[]>();

  for (const item of timeline) {
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    
    grouped.get(dateKey)!.push(item);
  }

  return grouped;
};

/**
 * Calculate total expenses for a stop
 */
export const getStopTotalExpenses = (
  stop: ItineraryStop,
  expenses: Expense[]
): number => {
  return expenses
    .filter(expense => stop.linkedExpenseIds.includes(expense.id))
    .reduce((sum, expense) => sum + expense.amount, 0);
};

/**
 * Find expenses near a location (within radius)
 */
export const findExpensesNearLocation = (
  location: { latitude: number; longitude: number },
  expenses: Expense[],
  radiusKm: number = 1
): Expense[] => {
  return expenses.filter(expense => {
    if (!expense.location) return false;

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      expense.location.latitude,
      expense.location.longitude
    );

    return distance <= radiusKm;
  });
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Suggest stops based on expense locations
 */
export const suggestStopsFromExpenses = (
  expenses: Expense[],
  eventId: string
): Partial<ItineraryStop>[] => {
  // Group expenses by location
  const locationGroups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    if (!expense.location) continue;

    const key = `${expense.location.latitude.toFixed(3)}_${expense.location.longitude.toFixed(3)}`;
    
    if (!locationGroups.has(key)) {
      locationGroups.set(key, []);
    }
    
    locationGroups.get(key)!.push(expense);
  }

  // Create stop suggestions
  const suggestions: Partial<ItineraryStop>[] = [];
  let order = 0;

  for (const [key, groupExpenses] of locationGroups.entries()) {
    if (groupExpenses.length < 2) continue; // Only suggest if multiple expenses at location

    const firstExpense = groupExpenses[0];
    const totalAmount = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

    suggestions.push({
      eventId,
      name: firstExpense.location?.address || `Ubicación ${order + 1}`,
      location: firstExpense.location,
      date: new Date(firstExpense.date),
      category: firstExpense.category as any,
      linkedExpenseIds: groupExpenses.map(e => e.id),
      order,
    });

    order++;
  }

  return suggestions;
};
