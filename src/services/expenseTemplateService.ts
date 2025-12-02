/**
 * Servicio de Plantillas de Gastos Recurrentes
 * Permite guardar gastos comunes como plantillas para añadirlos rápidamente
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { logger, LogCategory } from '../utils/logger';
import type { ExpenseCategory } from '../types';

// Tipos locales para las plantillas
type SplitType = 'equal' | 'custom' | 'items';
type Category = ExpenseCategory;
type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

const STORAGE_KEY_TEMPLATES = '@expense_templates';

export interface ExpenseTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  category: Category;
  splitType: SplitType;
  customSplits?: { [participantId: string]: number };
  paymentMethod?: PaymentMethod;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  icon?: string;
  color?: string;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  templates: ExpenseTemplate[];
}

// Plantillas predefinidas populares
export const PREDEFINED_TEMPLATES: Omit<ExpenseTemplate, 'id' | 'userId' | 'usageCount' | 'lastUsedAt' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Alquiler',
    description: 'Pago mensual de alquiler',
    amount: 0,
    category: 'accommodation',
    splitType: 'equal',
    isRecurring: true,
    recurringFrequency: 'monthly',
    icon: '🏠',
    color: '#FF6B6B',
  },
  {
    name: 'Netflix',
    description: 'Suscripción Netflix',
    amount: 15.99,
    category: 'entertainment',
    splitType: 'equal',
    isRecurring: true,
    recurringFrequency: 'monthly',
    icon: '📺',
    color: '#E50914',
  },
  {
    name: 'Spotify',
    description: 'Suscripción Spotify',
    amount: 10.99,
    category: 'entertainment',
    splitType: 'equal',
    isRecurring: true,
    recurringFrequency: 'monthly',
    icon: '🎵',
    color: '#1DB954',
  },
  {
    name: 'Supermercado',
    description: 'Compra semanal',
    amount: 0,
    category: 'food',
    splitType: 'equal',
    isRecurring: true,
    recurringFrequency: 'weekly',
    icon: '🛒',
    color: '#4CAF50',
  },
  {
    name: 'Gasolina',
    description: 'Repostaje',
    amount: 0,
    category: 'transport',
    splitType: 'equal',
    isRecurring: false,
    icon: '⛽',
    color: '#FF9800',
  },
  {
    name: 'Cena Fuera',
    description: 'Restaurante',
    amount: 0,
    category: 'food',
    splitType: 'equal',
    isRecurring: false,
    icon: '🍽️',
    color: '#9C27B0',
  },
  {
    name: 'Taxi/Uber',
    description: 'Transporte compartido',
    amount: 0,
    category: 'transport',
    splitType: 'equal',
    isRecurring: false,
    icon: '🚕',
    color: '#000000',
  },
  {
    name: 'Limpieza',
    description: 'Productos de limpieza',
    amount: 0,
    category: 'shopping',
    splitType: 'equal',
    isRecurring: true,
    recurringFrequency: 'monthly',
    icon: '🧹',
    color: '#00BCD4',
  },
  {
    name: 'Internet',
    description: 'Pago mensual internet',
    amount: 0,
    category: 'other',
    splitType: 'equal',
    isRecurring: true,
    recurringFrequency: 'monthly',
    icon: '📡',
    color: '#3F51B5',
  },
  {
    name: 'Electricidad',
    description: 'Factura eléctrica',
    amount: 0,
    category: 'other',
    splitType: 'equal',
    isRecurring: true,
    recurringFrequency: 'monthly',
    icon: '💡',
    color: '#FFEB3B',
  },
];

/**
 * Crear plantilla desde un gasto
 */
export async function createTemplateFromExpense(
  userId: string,
  name: string,
  description: string | undefined,
  amount: number,
  category: Category,
  splitType: SplitType,
  customSplits?: { [participantId: string]: number },
  paymentMethod?: PaymentMethod,
  isRecurring: boolean = false,
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Promise<ExpenseTemplate> {
  try {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const template: ExpenseTemplate = {
      id: templateId,
      userId,
      name,
      description,
      amount,
      category,
      splitType,
      customSplits,
      paymentMethod,
      isRecurring,
      recurringFrequency,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Guardar en Firestore
    await setDoc(doc(db, 'expense_templates', templateId), {
      ...template,
      createdAt: (template.createdAt instanceof Date ? template.createdAt : new Date(template.createdAt)).toISOString(),
      updatedAt: (template.updatedAt instanceof Date ? template.updatedAt : new Date(template.updatedAt)).toISOString(),
    });
    
    // Guardar en cache local
    await saveTemplateToCache(template);
    
    logger.info(LogCategory.FEATURE, 'Template created', { templateId, name });
    
    return template;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error creating template', error);
    throw error;
  }
}

/**
 * Obtener plantillas del usuario
 */
export async function getUserTemplates(userId: string): Promise<ExpenseTemplate[]> {
  try {
    // Primero intentar desde cache
    const cached = await getTemplatesFromCache();
    if (cached.length > 0) {
      return cached;
    }
    
    // Si no hay cache, obtener de Firestore
    const templatesRef = collection(db, 'expense_templates');
    const q = query(templatesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const templates: ExpenseTemplate[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : undefined,
      } as ExpenseTemplate;
    });
    
    // Guardar en cache
    await saveTemplatesToCache(templates);
    
    return templates;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error getting user templates', error);
    return [];
  }
}

/**
 * Obtener plantillas predefinidas para un usuario
 */
export async function getPredefinedTemplates(userId: string): Promise<ExpenseTemplate[]> {
  return PREDEFINED_TEMPLATES.map((template, index) => ({
    ...template,
    id: `predefined_${index}`,
    userId,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

/**
 * Obtener todas las plantillas (propias + predefinidas)
 */
export async function getAllTemplates(userId: string): Promise<ExpenseTemplate[]> {
  const [userTemplates, predefinedTemplates] = await Promise.all([
    getUserTemplates(userId),
    getPredefinedTemplates(userId),
  ]);
  
  return [...userTemplates, ...predefinedTemplates];
}

/**
 * Obtener plantillas agrupadas por categoría
 */
export async function getTemplatesByCategory(userId: string): Promise<TemplateCategory[]> {
  const templates = await getAllTemplates(userId);
  
  // Agrupar por categoría
  const grouped = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as { [key: string]: ExpenseTemplate[] });
  
  // Convertir a array de categorías
  const categories: TemplateCategory[] = Object.entries(grouped).map(([categoryId, templates]) => ({
    id: categoryId,
    name: getCategoryName(categoryId as Category),
    icon: getCategoryIcon(categoryId as Category),
    templates: templates.sort((a, b) => b.usageCount - a.usageCount), // Ordenar por uso
  }));
  
  return categories;
}

/**
 * Actualizar plantilla
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<Omit<ExpenseTemplate, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  try {
    const templateRef = doc(db, 'expense_templates', templateId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(templateRef, updateData, { merge: true });
    
    // Actualizar cache
    const cached = await getTemplatesFromCache();
    const updated = cached.map(t =>
      t.id === templateId
        ? { ...t, ...updates, updatedAt: new Date() }
        : t
    );
    await saveTemplatesToCache(updated);
    
    logger.info(LogCategory.FEATURE, 'Template updated', { templateId });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error updating template', error);
    throw error;
  }
}

/**
 * Eliminar plantilla
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    // No permitir eliminar plantillas predefinidas
    if (templateId.startsWith('predefined_')) {
      throw new Error('Cannot delete predefined templates');
    }
    
    await deleteDoc(doc(db, 'expense_templates', templateId));
    
    // Actualizar cache
    const cached = await getTemplatesFromCache();
    const filtered = cached.filter(t => t.id !== templateId);
    await saveTemplatesToCache(filtered);
    
    logger.info(LogCategory.FEATURE, 'Template deleted', { templateId });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error deleting template', error);
    throw error;
  }
}

/**
 * Incrementar contador de uso de plantilla
 */
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  try {
    // No incrementar para plantillas predefinidas
    if (templateId.startsWith('predefined_')) {
      return;
    }
    
    const templateRef = doc(db, 'expense_templates', templateId);
    const cached = await getTemplatesFromCache();
    const template = cached.find(t => t.id === templateId);
    
    if (template) {
      const newUsageCount = template.usageCount + 1;
      
      await setDoc(
        templateRef,
        {
          usageCount: newUsageCount,
          lastUsedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      
      // Actualizar cache
      const updated = cached.map(t =>
        t.id === templateId
          ? {
              ...t,
              usageCount: newUsageCount,
              lastUsedAt: new Date(),
              updatedAt: new Date(),
            }
          : t
      );
      await saveTemplatesToCache(updated);
    }
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error incrementing template usage', error);
  }
}

/**
 * Buscar plantillas por nombre o descripción
 */
export async function searchTemplates(userId: string, searchTerm: string): Promise<ExpenseTemplate[]> {
  const templates = await getAllTemplates(userId);
  const term = searchTerm.toLowerCase();
  
  return templates.filter(
    t =>
      t.name.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term))
  );
}

/**
 * Obtener plantillas más usadas
 */
export async function getMostUsedTemplates(userId: string, limit: number = 5): Promise<ExpenseTemplate[]> {
  const templates = await getUserTemplates(userId);
  return templates
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * Obtener plantillas recientes
 */
export async function getRecentTemplates(userId: string, limit: number = 5): Promise<ExpenseTemplate[]> {
  const templates = await getUserTemplates(userId);
  return templates
    .filter(t => t.lastUsedAt)
    .sort((a, b) => {
      if (!a.lastUsedAt || !b.lastUsedAt) return 0;
      return b.lastUsedAt.getTime() - a.lastUsedAt.getTime();
    })
    .slice(0, limit);
}

/**
 * Duplicar plantilla
 */
export async function duplicateTemplate(
  templateId: string,
  userId: string,
  newName?: string
): Promise<ExpenseTemplate> {
  try {
    const templates = await getAllTemplates(userId);
    const original = templates.find(t => t.id === templateId);
    
    if (!original) {
      throw new Error('Template not found');
    }
    
    return await createTemplateFromExpense(
      userId,
      newName || `${original.name} (copia)`,
      original.description,
      original.amount,
      original.category,
      original.splitType,
      original.customSplits,
      original.paymentMethod,
      original.isRecurring,
      original.recurringFrequency
    );
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error duplicating template', error);
    throw error;
  }
}

// === Funciones de Cache ===

async function getTemplatesFromCache(): Promise<ExpenseTemplate[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!cached) return [];
    
    const parsed = JSON.parse(cached);
    return parsed.map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
      lastUsedAt: t.lastUsedAt ? new Date(t.lastUsedAt) : undefined,
    }));
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error getting templates from cache', error);
    return [];
  }
}

async function saveTemplatesToCache(templates: ExpenseTemplate[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error saving templates to cache', error);
  }
}

async function saveTemplateToCache(template: ExpenseTemplate): Promise<void> {
  try {
    const cached = await getTemplatesFromCache();
    cached.push(template);
    await saveTemplatesToCache(cached);
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error saving template to cache', error);
  }
}

// === Helpers ===

function getCategoryName(category: Category): string {
  const names: { [key in Category]: string } = {
    food: 'Comida',
    transport: 'Transporte',
    entertainment: 'Entretenimiento',
    shopping: 'Compras',
    accommodation: 'Alojamiento',
    health: 'Salud',
    other: 'Otros',
  };
  return names[category] || 'Otros';
}

function getCategoryIcon(category: Category): string {
  const icons: { [key in Category]: string } = {
    food: '🍽️',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    accommodation: '🏠',
    health: '💊',
    other: '📋',
  };
  return icons[category] || '📋';
}
