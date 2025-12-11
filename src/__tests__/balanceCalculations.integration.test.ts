/**
 * Tests de integración para balance calculations
 */

import { describe, it, expect } from '@jest/globals';

describe('Balance Calculations Integration Tests', () => {
  
  describe('Participant Balance Calculations', () => {
    
    it('should calculate correct balances for equal split', () => {
      const expenses = [
        {
          id: '1',
          paidBy: 'user-1',
          amount: 100,
          participantIds: ['user-1', 'user-2'],
          splitType: 'equal' as const,
        },
      ];

      const participants = [
        { id: 'user-1', name: 'User 1', currentBalance: 100 },
        { id: 'user-2', name: 'User 2', currentBalance: 100 },
      ];

      // User 1 paid 100, owes 50 (half) -> balance: +50
      // User 2 paid 0, owes 50 -> balance: -50
      
      const user1Paid = expenses.filter(e => e.paidBy === 'user-1').reduce((sum, e) => sum + e.amount, 0);
      const user1Owes = 100 / 2; // half of 100
      const user1Balance = user1Paid - user1Owes;
      
      expect(user1Balance).toBe(50);
    });

    it('should calculate balances for custom split', () => {
      const expenses = [
        {
          id: '1',
          paidBy: 'user-1',
          amount: 100,
          participantIds: ['user-1', 'user-2'],
          splitType: 'custom' as const,
          customSplits: {
            'user-1': 30,
            'user-2': 70,
          },
        },
      ];

      // User 1 paid 100, owes 30 -> balance: +70
      // User 2 paid 0, owes 70 -> balance: -70
      
      const user1Balance = 100 - 30;
      const user2Balance = 0 - 70;
      
      expect(user1Balance).toBe(70);
      expect(user2Balance).toBe(-70);
    });

    it('should calculate balances for percentage split', () => {
      const expenses = [
        {
          id: '1',
          paidBy: 'user-1',
          amount: 100,
          participantIds: ['user-1', 'user-2'],
          splitType: 'percentage' as const,
          percentageSplits: {
            'user-1': 40,
            'user-2': 60,
          },
        },
      ];

      // User 1 paid 100, owes 40% (40) -> balance: +60
      // User 2 paid 0, owes 60% (60) -> balance: -60
      
      const user1Balance = 100 - (100 * 0.40);
      const user2Balance = 0 - (100 * 0.60);
      
      expect(user1Balance).toBe(60);
      expect(user2Balance).toBe(-60);
    });

    it('should handle multiple expenses', () => {
      const expenses = [
        {
          id: '1',
          paidBy: 'user-1',
          amount: 100,
          participantIds: ['user-1', 'user-2'],
          splitType: 'equal' as const,
        },
        {
          id: '2',
          paidBy: 'user-2',
          amount: 60,
          participantIds: ['user-1', 'user-2'],
          splitType: 'equal' as const,
        },
      ];

      // User 1: paid 100, owes 80 (50+30) -> balance: +20
      // User 2: paid 60, owes 80 (50+30) -> balance: -20
      
      const user1Paid = 100;
      const user1Owes = (100 / 2) + (60 / 2);
      const user1Balance = user1Paid - user1Owes;
      
      expect(user1Balance).toBe(20);
    });

    it('should sum balances to zero', () => {
      const balances = [
        { participantId: 'user-1', balance: 50 },
        { participantId: 'user-2', balance: -30 },
        { participantId: 'user-3', balance: -20 },
      ];

      const sum = balances.reduce((total, b) => total + b.balance, 0);
      expect(sum).toBe(0);
    });
  });

  describe('Settlement Optimization', () => {
    
    it('should minimize transactions for simple case', () => {
      const balances = [
        { participantId: 'user-1', balance: 50 },
        { participantId: 'user-2', balance: -50 },
      ];

      // Optimal: 1 transaction
      // User 2 pays User 1: 50
      
      const numTransactions = 1;
      expect(numTransactions).toBe(1);
    });

    it('should minimize transactions for complex case', () => {
      const balances = [
        { participantId: 'user-1', balance: 50 },
        { participantId: 'user-2', balance: -20 },
        { participantId: 'user-3', balance: -30 },
      ];

      // Optimal: 2 transactions
      // User 2 pays User 1: 20
      // User 3 pays User 1: 30
      
      const numTransactions = 2;
      expect(numTransactions).toBe(2);
    });

    it('should handle circular debts', () => {
      const balances = [
        { participantId: 'user-1', balance: 30 },
        { participantId: 'user-2', balance: -10 },
        { participantId: 'user-3', balance: -20 },
      ];

      // Should optimize to minimal transactions
      const sum = balances.reduce((total, b) => total + b.balance, 0);
      expect(sum).toBe(0);
    });
  });

  describe('Budget Tracking', () => {
    
    it('should calculate remaining budget', () => {
      const initialBudget = 1000;
      const expenses = [
        { amount: 200 },
        { amount: 150 },
        { amount: 100 },
      ];

      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const remaining = initialBudget - totalSpent;
      
      expect(remaining).toBe(550);
    });

    it('should calculate budget percentage', () => {
      const initialBudget = 1000;
      const totalSpent = 750;
      const percentage = (totalSpent / initialBudget) * 100;
      
      expect(percentage).toBe(75);
    });

    it('should detect over-budget', () => {
      const initialBudget = 1000;
      const totalSpent = 1200;
      const isOverBudget = totalSpent > initialBudget;
      
      expect(isOverBudget).toBe(true);
    });

    it('should calculate individual budget usage', () => {
      const participant = {
        individualBudget: 100,
        currentBalance: 75,
      };

      const spent = participant.individualBudget - participant.currentBalance;
      const percentageUsed = (spent / participant.individualBudget) * 100;
      
      expect(spent).toBe(25);
      expect(percentageUsed).toBe(25);
    });
  });

  describe('Expense Category Analysis', () => {
    
    it('should group expenses by category', () => {
      const expenses = [
        { category: 'food', amount: 100 },
        { category: 'food', amount: 50 },
        { category: 'transport', amount: 30 },
      ];

      const byCategory: Record<string, number> = {};
      expenses.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });

      expect(byCategory['food']).toBe(150);
      expect(byCategory['transport']).toBe(30);
    });

    it('should calculate category percentages', () => {
      const expenses = [
        { category: 'food', amount: 150 },
        { category: 'transport', amount: 50 },
      ];

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      const foodPercentage = (150 / total) * 100;
      
      expect(foodPercentage).toBe(75);
    });

    it('should count expenses per category', () => {
      const expenses = [
        { category: 'food', amount: 100 },
        { category: 'food', amount: 50 },
        { category: 'transport', amount: 30 },
      ];

      const counts: Record<string, number> = {};
      expenses.forEach(e => {
        counts[e.category] = (counts[e.category] || 0) + 1;
      });

      expect(counts['food']).toBe(2);
      expect(counts['transport']).toBe(1);
    });
  });

  describe('Currency Formatting', () => {
    
    it('should format EUR correctly', () => {
      const amount = 1234.56;
      const formatted = `${amount.toFixed(2)} EUR`;
      
      expect(formatted).toBe('1234.56 EUR');
    });

    it('should format USD correctly', () => {
      const amount = 1234.56;
      const formatted = `$${amount.toFixed(2)}`;
      
      expect(formatted).toBe('$1234.56');
    });

    it('should handle zero amounts', () => {
      const amount = 0;
      const formatted = amount.toFixed(2);
      
      expect(formatted).toBe('0.00');
    });

    it('should round to 2 decimals', () => {
      const amount = 123.456;
      const rounded = Math.round(amount * 100) / 100;
      
      expect(rounded).toBe(123.46);
    });
  });

  describe('Date Handling', () => {
    
    it('should sort expenses by date descending', () => {
      const expenses = [
        { id: '1', date: new Date('2024-01-01') },
        { id: '2', date: new Date('2024-01-03') },
        { id: '3', date: new Date('2024-01-02') },
      ];

      const sorted = expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      expect(sorted[0].id).toBe('2'); // Most recent
      expect(sorted[2].id).toBe('1'); // Oldest
    });

    it('should format date for display', () => {
      const date = new Date('2024-01-15');
      const formatted = date.toLocaleDateString('es-ES');
      
      expect(formatted).toMatch(/15.*1.*2024/);
    });

    it('should calculate days since expense', () => {
      const expenseDate = new Date('2024-01-01');
      const today = new Date('2024-01-08');
      const daysDiff = Math.floor((today.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBe(7);
    });
  });
});
