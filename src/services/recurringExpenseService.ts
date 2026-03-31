/**
 * Recurring Expenses Service
 * Gestiona la creación automática de gastos recurrentes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const LAST_CHECK_KEY = 'lessmo_recurring_last_check';

interface RecurringExpenseDoc {
  id: string;
  eventId?: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  currency: string;
  paidBy: string;
  createdBy: string;
  splitType: string;
  participantIds?: string[];
  isRecurring: boolean;
  recurringFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: any;
  lastRecurringDate?: any;
}

/**
 * Check and create due recurring expenses
 * Should be called on app foreground
 */
export async function processRecurringExpenses(userId: string): Promise<number> {
  // Don't check more than once per hour
  const lastCheck = await AsyncStorage.getItem(`${LAST_CHECK_KEY}_${userId}`);
  if (lastCheck && Date.now() - parseInt(lastCheck) < 3600000) {
    return 0;
  }

  let created = 0;

  try {
    // Get all recurring expenses from this user
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('createdBy', '==', userId),
      where('isRecurring', '==', true),
    );
    const snapshot = await getDocs(q);
    
    const now = new Date();

    for (const doc of snapshot.docs) {
      const expense = { id: doc.id, ...doc.data() } as RecurringExpenseDoc;
      
      // Check if end date has passed
      if (expense.recurringEndDate) {
        const endDate = expense.recurringEndDate?.toDate ? expense.recurringEndDate.toDate() : new Date(expense.recurringEndDate);
        if (now > endDate) continue;
      }

      // Get last recurring date
      const lastDate = expense.lastRecurringDate?.toDate 
        ? expense.lastRecurringDate.toDate() 
        : expense.lastRecurringDate 
          ? new Date(expense.lastRecurringDate)
          : null;

      if (!lastDate) continue;

      // Calculate next due date
      const nextDue = getNextDueDate(lastDate, expense.recurringFrequency);
      
      if (nextDue <= now) {
        // Create the recurring expense copy
        await createRecurringCopy(expense, nextDue);
        created++;
      }
    }

    await AsyncStorage.setItem(`${LAST_CHECK_KEY}_${userId}`, Date.now().toString());
  } catch (error) {
    console.warn('Error processing recurring expenses:', error);
  }

  return created;
}

function getNextDueDate(lastDate: Date, frequency: string): Date {
  const next = new Date(lastDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function createRecurringCopy(original: RecurringExpenseDoc, date: Date): Promise<void> {
  const newExpense: Record<string, any> = {
    name: original.name,
    description: original.description || '',
    amount: original.amount,
    category: original.category,
    currency: original.currency,
    paidBy: original.paidBy,
    createdBy: original.createdBy,
    splitType: original.splitType,
    participantIds: original.participantIds || [],
    date: Timestamp.fromDate(date),
    createdAt: Timestamp.fromDate(new Date()),
    parentExpenseId: original.id,
    isRecurring: false, // The copy is not recurring itself
  };

  if (original.eventId) {
    newExpense.eventId = original.eventId;
    newExpense.groupId = original.eventId;
  }

  await addDoc(collection(db, 'expenses'), newExpense);

  // Update lastRecurringDate on the original
  const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
  await updateDoc(firestoreDoc(db, 'expenses', original.id), {
    lastRecurringDate: Timestamp.fromDate(date),
  });
}

/**
 * Get summary of active recurring expenses for a user
 */
export async function getRecurringSummary(userId: string): Promise<{
  count: number;
  monthlyTotal: number;
}> {
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('createdBy', '==', userId),
      where('isRecurring', '==', true),
    );
    const snapshot = await getDocs(q);
    
    let monthlyTotal = 0;
    const count = snapshot.size;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = data.amount || 0;
      switch (data.recurringFrequency) {
        case 'daily': monthlyTotal += amount * 30; break;
        case 'weekly': monthlyTotal += amount * 4.33; break;
        case 'monthly': monthlyTotal += amount; break;
        case 'yearly': monthlyTotal += amount / 12; break;
      }
    });

    return { count, monthlyTotal: Math.round(monthlyTotal * 100) / 100 };
  } catch {
    return { count: 0, monthlyTotal: 0 };
  }
}
