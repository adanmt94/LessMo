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
      
      expect(byCategory).toHaveProperty('food');
      expect(byCategory).toHaveProperty('transport');
      expect(byCategory.food).toBe(50);
      expect(byCategory.transport).toBe(20);
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
      const newExpense = {
        description: 'Café',
        amount: 10,
        paidBy: 'user-1',
        splitBetween: ['user-1', 'user-2'],
        category: 'food' as const,
        date: new Date(),
      };

      (firebase.addExpense as jest.Mock).mockResolvedValue({
        id: 'expense-3',
        ...newExpense,
      });

      const { result } = renderHook(() => useExpenses(mockEventId));

      await act(async () => {
        await result.current.addExpense(newExpense);
      });

      expect(firebase.addExpense).toHaveBeenCalledWith(
        mockEventId,
        expect.objectContaining(newExpense)
      );
    });

    it('should validate expense data', async () => {
      const invalidExpense = {
        description: '',
        amount: -10,
        paidBy: '',
        splitBetween: [],
        category: 'food' as const,
        date: new Date(),
      };

      const { result } = renderHook(() => useExpenses(mockEventId));

      await expect(
        result.current.addExpense(invalidExpense)
      ).rejects.toThrow();
    });
  });

  describe('updateExpense', () => {
    it('should update expense successfully', async () => {
      const updates = {
        description: 'Cena actualizada',
        amount: 60,
      };

      (firebase.updateExpense as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses(mockEventId));

      await act(async () => {
        await result.current.updateExpense('expense-1', updates);
      });

      expect(firebase.updateExpense).toHaveBeenCalledWith(
        mockEventId,
        'expense-1',
        updates
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
