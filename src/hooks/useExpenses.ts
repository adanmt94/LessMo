/**
 * Hook personalizado para manejar gastos y cálculos
 * 
 * NOTA IMPORTANTE:
 * - eventId en este contexto es el ID del GRUPO (contenedor)
 * - Los "expenses" son eventos/gastos individuales
 * - Cada expense tiene: paidBy (quien paga) y participantIds (quienes deben)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  createExpense,
  getEventExpenses,
  getEventParticipants,
  updateExpense,
  deleteExpense as firebaseDeleteExpense,
} from '../services/firebase';
import {
  Expense,
  Participant,
  ExpenseSummary,
  ParticipantBalance,
  Settlement,
  ExpenseCategory,
  SplitType,
} from '../types';
import { withCache, cache } from '../utils/cache';
import { logger, LogCategory } from '../utils/logger';

/**
 * Hook para manejar eventos/gastos de un grupo
 * @param eventId - ID del grupo (contenedor con presupuesto)
 */
export const useExpenses = (eventId: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar gastos y participantes del evento
   */
  const loadData = useCallback(async () => {
    try {
      logger.info(LogCategory.EXPENSE, 'Cargando datos para evento', { eventId });
      setLoading(true);
      setError(null);
      
      // Usar caché para mejorar rendimiento
      const [expensesData, participantsData] = await Promise.all([
        withCache(
          `expenses_${eventId}`,
          () => getEventExpenses(eventId),
          2 * 60 * 1000 // 2 minutos
        ),
        withCache(
          `participants_${eventId}`,
          () => getEventParticipants(eventId),
          2 * 60 * 1000 // 2 minutos
        ),
      ]);
      
      logger.debug(LogCategory.EXPENSE, 'Datos cargados', {
        expenses: expensesData.length,
        participants: participantsData.length
      });
      
      setExpenses(expensesData);
      setParticipants(participantsData);
    } catch (err: any) {
      logger.error(LogCategory.EXPENSE, 'Error al cargar datos', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Agregar nuevo gasto
   */
  const addExpense = async (
    paidBy: string,
    amount: number,
    description: string,
    category: ExpenseCategory,
    participantIds: string[],
    splitType: SplitType = 'equal',
    customSplits?: { [participantId: string]: number },
    percentageSplits?: { [participantId: string]: number },
    receiptPhoto?: string
  ): Promise<boolean> => {
    try {
      logger.info(LogCategory.EXPENSE, 'Creando gasto', { amount, description, category });
      setError(null);
      const expenseId = await createExpense(
        eventId,
        paidBy,
        amount,
        description,
        category,
        participantIds,
        splitType,
        customSplits,
        percentageSplits,
        receiptPhoto
      );
      logger.info(LogCategory.EXPENSE, 'Gasto creado', { expenseId });
      
      // Invalidar caché y recargar
      cache.invalidatePattern(`expenses_${eventId}`);
      cache.invalidatePattern(`participants_${eventId}`);
      await loadData();
      
      // Actualizar widgets iOS
      try {
        const { updateWidgetData } = await import('../services/widgetDataService');
        const { auth } = await import('../services/firebase');
        if (auth.currentUser?.uid) {
          await updateWidgetData(auth.currentUser.uid);
        }
      } catch (error) {
        logger.warn(LogCategory.EXPENSE, 'No se pudo actualizar widget', error);
      }
      
      return true;
    } catch (err: any) {
      logger.error(LogCategory.EXPENSE, 'Error al crear gasto', err);
      setError(err.message || 'Error al crear gasto');
      return false;
    }
  };

  /**
   * Actualizar gasto existente
   */
  const editExpense = async (
    expenseId: string,
    paidBy: string,
    amount: number,
    description: string,
    category: ExpenseCategory,
    participantIds: string[],
    splitType: SplitType = 'equal',
    customSplits?: { [participantId: string]: number },
    percentageSplits?: { [participantId: string]: number },
    receiptPhoto?: string
  ): Promise<boolean> => {
    try {
      logger.info(LogCategory.EXPENSE, 'Actualizando gasto', { expenseId, amount, description });
      setError(null);
      await updateExpense(
        expenseId,
        eventId,
        paidBy,
        amount,
        description,
        category,
        participantIds,
        splitType,
        customSplits,
        percentageSplits,
        receiptPhoto
      );
      logger.info(LogCategory.EXPENSE, 'Gasto actualizado', { expenseId });
      
      // Invalidar caché y recargar
      cache.invalidatePattern(`expenses_${eventId}`);
      cache.invalidatePattern(`participants_${eventId}`);
      await loadData();
      
      return true;
    } catch (err: any) {
      logger.error(LogCategory.EXPENSE, 'Error al actualizar gasto', err);
      setError(err.message || 'Error al actualizar gasto');
      return false;
    }
  };

  /**
   * Eliminar gasto
   */
  const deleteExpense = async (expenseId: string): Promise<boolean> => {
    try {
      logger.info(LogCategory.EXPENSE, 'Eliminando gasto', { expenseId });
      setError(null);
      await firebaseDeleteExpense(expenseId);
      
      // Invalidar caché y recargar
      cache.invalidatePattern(`expenses_${eventId}`);
      cache.invalidatePattern(`participants_${eventId}`);
      await loadData();
      
      return true;
    } catch (err: any) {
      logger.error(LogCategory.EXPENSE, 'Error al eliminar gasto', err);
      setError(err.message || 'Error al eliminar gasto');
      return false;
    }
  };

  /**
   * Calcular total de gastos
   */
  const getTotalExpenses = (): number => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  /**
   * Calcular saldo restante total
   * Si se proporciona eventBudget, se usa ese; si no, suma individualBudget de participantes
   */
  const getRemainingBalance = (eventBudget?: number): number => {
    const totalBudget = eventBudget !== undefined 
      ? eventBudget 
      : participants.reduce((sum, p) => sum + p.individualBudget, 0);
    const totalSpent = getTotalExpenses();
    
    return totalBudget - totalSpent;
  };

  /**
   * Obtener resumen de gastos por categoría
   */
  const getExpensesByCategory = (): ExpenseSummary[] => {
    const total = getTotalExpenses();
    const categoryTotals: { [key: string]: { total: number; count: number } } = {};

    expenses.forEach((expense) => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = { total: 0, count: 0 };
      }
      categoryTotals[expense.category].total += expense.amount;
      categoryTotals[expense.category].count += 1;
    });

    return Object.entries(categoryTotals).map(([category, data]) => ({
      category: category as ExpenseCategory,
      total: data.total,
      percentage: total > 0 ? (data.total / total) * 100 : 0,
      count: data.count,
    }));
  };

  /**
   * Calcular balance de cada participante
   */
  const getParticipantBalances = (): ParticipantBalance[] => {
    return participants.map((participant) => {
      // Calcular cuánto pagó este participante
      const totalPaid = expenses
        .filter((e) => e.paidBy === participant.id)
        .reduce((sum, e) => sum + e.amount, 0);

      // Calcular cuánto debe (gastos donde es participante)
      const totalOwed = expenses
        .filter((e) => e.participantIds.includes(participant.id))
        .reduce((sum, expense) => {
          if (expense.splitType === 'equal') {
            return sum + expense.amount / expense.participantIds.length;
          } else if (expense.splitType === 'percentage' && expense.percentageSplits) {
            const percentage = expense.percentageSplits[participant.id] || 0;
            return sum + (expense.amount * percentage / 100);
          } else if ((expense.splitType === 'custom' || expense.splitType === 'amount') && expense.customSplits) {
            return sum + (expense.customSplits[participant.id] || 0);
          }
          return sum;
        }, 0);

      return {
        participantId: participant.id,
        participantName: participant.name,
        totalPaid,
        totalOwed,
        balance: totalPaid - totalOwed, // Positivo: le deben, Negativo: debe
      };
    });
  };

  /**
   * Calcular liquidaciones necesarias (quién debe pagar a quién)
   */
  const calculateSettlements = (): Settlement[] => {
    const balances = getParticipantBalances();
    const settlements: Settlement[] = [];

    // Separar deudores y acreedores
    const debtors = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const debtAmount = Math.abs(debtor.balance);
      const creditAmount = creditor.balance;

      const settlementAmount = Math.min(debtAmount, creditAmount);

      settlements.push({
        from: debtor.participantId,
        to: creditor.participantId,
        amount: parseFloat(settlementAmount.toFixed(2)),
      });

      debtor.balance += settlementAmount;
      creditor.balance -= settlementAmount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }

    return settlements;
  };

  /**
   * Obtener participante por ID
   */
  const getParticipantById = (participantId: string): Participant | undefined => {
    return participants.find((p) => p.id === participantId);
  };

  return {
    expenses,
    participants,
    loading,
    error,
    addExpense,
    editExpense,
    deleteExpense,
    loadData,
    getTotalExpenses,
    getRemainingBalance,
    getExpensesByCategory,
    getParticipantBalances,
    calculateSettlements,
    getParticipantById,
  };
};