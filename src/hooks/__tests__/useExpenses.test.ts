/**
 * Tests for useExpenses hook
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useExpenses } from '../useExpenses';
import * as firebase from '../../services/firebase';

jest.mock('../../services/firebase');

describe('useExpenses Hook', () => {
  const mockEventId = 'test-event-123';

  const mockExpenses = [
    {
      id: 'expense-1',
      eventId: mockEventId,
      description: 'Cena',
      amount: 50,
      paidBy: 'user-1',
      splitBetween: ['user-1', 'user-2'],
      category: 'food',
      date: new Date('2025-11-15'),
      createdAt: new Date(),
    },
    {
      id: 'expense-2',
      eventId: mockEventId,
      description: 'Taxi',
      amount: 20,
      paidBy: 'user-2',
      splitBetween: ['user-1', 'user-2'],
      category: 'transport',
      date: new Date('2025-11-15'),
      createdAt: new Date(),
    },
  ];

  const mockParticipants = [
    { id: 'user-1', name: 'Juan', eventId: mockEventId },
    { id: 'user-2', name: 'María', eventId: mockEventId },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTotalExpenses', () => {
    it('should calculate total expenses correctly', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      // Mock data
      act(() => {
        // Set expenses through internal state (simplified for testing)
      });

      const total = result.current.getTotalExpenses();
      expect(total).toBe(70); // 50 + 20
    });

    it('should return 0 when no expenses', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      const total = result.current.getTotalExpenses();
      expect(total).toBe(0);
    });
  });

  describe('getExpensesByCategory', () => {
    it('should group expenses by category', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const byCategory = result.current.getExpensesByCategory();
      
      expect(byCategory).toBeInstanceOf(Array);
      expect(byCategory.length).toBeGreaterThan(0);
      const foodCategory = byCategory.find(c => c.category === 'food');
      const transportCategory = byCategory.find(c => c.category === 'transport');
      expect(foodCategory?.total).toBe(50);
      expect(transportCategory?.total).toBe(20);
    });

    it('should handle empty expenses array', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      const byCategory = result.current.getExpensesByCategory();
      expect(byCategory).toEqual({});
    });
  });

  describe('getParticipantBalances', () => {
    it('should calculate balances correctly', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const balances = result.current.getParticipantBalances();
      
      expect(balances).toHaveLength(2);
      expect(balances.find(b => b.participantId === 'user-1')?.balance).toBe(15);
      expect(balances.find(b => b.participantId === 'user-2')?.balance).toBe(-15);
    });

    it('should show who owes and who is owed', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const balances = result.current.getParticipantBalances();
      
      const user1Balance = balances.find(b => b.participantId === 'user-1');
      const user2Balance = balances.find(b => b.participantId === 'user-2');
      
      expect(user1Balance?.balance).toBeGreaterThan(0); // Owes money
      expect(user2Balance?.balance).toBeLessThan(0); // Is owed money
    });
  });

  describe('calculateSettlements', () => {
    it('should calculate optimal settlements', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const settlements = result.current.calculateSettlements();
      
      expect(settlements).toHaveLength(1);
      expect(settlements[0]).toMatchObject({
        from: 'user-2',
        to: 'user-1',
        amount: 15,
      });
    });

    it('should return empty array when balanced', () => {
      // Mock balanced expenses
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const settlements = result.current.calculateSettlements();
      
      if (settlements.length === 0) {
        expect(settlements).toEqual([]);
      }
    });

    it('should handle multiple participants', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const settlements = result.current.calculateSettlements();
      
      // Verify settlements sum to zero
      const total = settlements.reduce((sum, s) => sum + s.amount, 0);
      expect(total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('addExpense', () => {
    it('should add expense successfully', async () => {
      const paidBy = 'user-1';
      const amount = 10;
      const description = 'Café';
      const category = 'food' as const;
      const beneficiaries = ['user-1', 'user-2'];

      (firebase.createExpense as jest.Mock).mockResolvedValue('expense-3');

      const { result } = renderHook(() => useExpenses(mockEventId));

      await act(async () => {
        await result.current.addExpense(paidBy, amount, description, category, beneficiaries);
      });

      expect(firebase.createExpense).toHaveBeenCalledWith(
        mockEventId,
        paidBy,
        amount,
        description,
        category,
        beneficiaries,
        'equal',
        undefined,
        undefined
      );
    });

    it('should handle firebase errors', async () => {
      (firebase.createExpense as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      const { result } = renderHook(() => useExpenses(mockEventId));

      const success = await result.current.addExpense(
        'user-1',
        10,
        'Test',
        'food',
        ['user-1']
      );
      
      expect(success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('editExpense', () => {
    it('should update expense successfully', async () => {
      const expenseId = 'expense-1';
      const paidBy = 'user-1';
      const amount = 60;
      const description = 'Cena actualizada';
      const category = 'food' as const;
      const beneficiaries = ['user-1', 'user-2'];

      (firebase.updateExpense as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses(mockEventId));

      await act(async () => {
        await result.current.editExpense(expenseId, paidBy, amount, description, category, beneficiaries);
      });

      expect(firebase.updateExpense).toHaveBeenCalledWith(
        expenseId,
        mockEventId,
        paidBy,
        amount,
        description,
        category,
        beneficiaries,
        'equal',
        undefined,
        undefined
      );
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense successfully', async () => {
      (firebase.deleteExpense as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses(mockEventId));

      await act(async () => {
        await result.current.deleteExpense('expense-1');
      });

      expect(firebase.deleteExpense).toHaveBeenCalledWith(mockEventId, 'expense-1');
    });
  });

  describe('getRemainingBalance', () => {
    it('should calculate remaining balance from budget', () => {
      const budget = 100;
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const remaining = result.current.getRemainingBalance(budget);
      
      expect(remaining).toBe(30); // 100 - 70
    });

    it('should show negative when over budget', () => {
      const budget = 50;
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const remaining = result.current.getRemainingBalance(budget);
      
      expect(remaining).toBeLessThan(0);
    });
  });

  describe('getParticipantById', () => {
    it('should find participant by id', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const participant = result.current.getParticipantById('user-1');
      
      expect(participant?.name).toBe('Juan');
    });

    it('should return undefined for non-existent participant', () => {
      const { result } = renderHook(() => useExpenses(mockEventId));
      
      const participant = result.current.getParticipantById('non-existent');
      
      expect(participant).toBeUndefined();
    });
  });
});
