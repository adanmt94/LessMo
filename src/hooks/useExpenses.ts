/**
 * Hook personalizado para manejar gastos y cálculos
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
} from '../types';

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
      console.log('🔄 useExpenses - Cargando datos para evento:', eventId);
      setLoading(true);
      setError(null);
      
      const [expensesData, participantsData] = await Promise.all([
        getEventExpenses(eventId),
        getEventParticipants(eventId),
      ]);
      
      console.log('📦 useExpenses - Datos cargados:', {
        expenses: expensesData.length,
        participants: participantsData.length
      });
      
      setExpenses(expensesData);
      setParticipants(participantsData);
    } catch (err: any) {
      console.error('❌ useExpenses - Error:', err);
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
    beneficiaries: string[],
    splitType: 'equal' | 'custom' = 'equal',
    customSplits?: { [participantId: string]: number }
  ): Promise<boolean> => {
    try {
      setError(null);
      await createExpense(
        eventId,
        paidBy,
        amount,
        description,
        category,
        beneficiaries,
        splitType,
        customSplits
      );
      await loadData(); // Recargar datos
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear gasto');
      return false;
    }
  };

  /**
   * Eliminar gasto
   */
  const deleteExpense = async (expenseId: string): Promise<boolean> => {
    try {
      setError(null);
      await firebaseDeleteExpense(expenseId);
      await loadData(); // Recargar datos
      return true;
    } catch (err: any) {
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
   */
  const getRemainingBalance = (): number => {
    const totalBudget = participants.reduce((sum, p) => sum + p.individualBudget, 0);
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

      // Calcular cuánto debe (gastos donde es beneficiario)
      const totalOwed = expenses
        .filter((e) => e.beneficiaries.includes(participant.id))
        .reduce((sum, expense) => {
          if (expense.splitType === 'equal') {
            return sum + expense.amount / expense.beneficiaries.length;
          } else if (expense.splitType === 'custom' && expense.customSplits) {
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
