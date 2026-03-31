/**
 * Custom Categories Service
 * Gestiona categorías personalizadas del usuario
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomCategory } from '../types';

const STORAGE_KEY = 'lessmo_custom_categories';

export async function getCustomCategories(userId: string): Promise<CustomCategory[]> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCustomCategory(userId: string, category: Omit<CustomCategory, 'id' | 'userId' | 'createdAt'>): Promise<CustomCategory> {
  const categories = await getCustomCategories(userId);
  const newCat: CustomCategory = {
    id: `custom_${Date.now()}`,
    userId,
    emoji: category.emoji,
    name: category.name,
    color: category.color,
    createdAt: new Date(),
  };
  categories.push(newCat);
  await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(categories));
  return newCat;
}

export async function deleteCustomCategory(userId: string, categoryId: string): Promise<void> {
  const categories = await getCustomCategories(userId);
  const filtered = categories.filter(c => c.id !== categoryId);
  await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(filtered));
}

export function getCategoryDisplay(category: string, customCategory?: string): string {
  // If it's a custom category, return it directly
  if (customCategory) return customCategory;
  
  // Default category labels
  const labels: Record<string, string> = {
    food: '🍴 Comida',
    transport: '🚗 Transporte',
    accommodation: '🏨 Alojamiento',
    entertainment: '🎉 Entretenimiento',
    shopping: '🛒 Compras',
    health: '💊 Salud',
    other: '📱 Otros',
    salary: '💰 Salario',
    freelance: '💻 Freelance',
    refund: '🔄 Reembolso',
    gift: '🎁 Regalo',
    investment: '📈 Inversión',
    sale: '🏷️ Venta',
    other_income: '💵 Otros ingresos',
  };
  return labels[category] || category;
}
