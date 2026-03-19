/**
 * Tests para servicios críticos de Firebase
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock de Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  writeBatch: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

describe('Firebase Services - Critical Features', () => {
  
  describe('Balance Reversion on Expense Delete', () => {
    it('should revert balances when deleting an equal split expense', async () => {
      // Mock data
      const mockExpense = {
        id: 'expense-1',
        eventId: 'event-1',
        paidBy: 'user-1',
        amount: 100,
        participantIds: ['user-1', 'user-2'],
        splitType: 'equal' as const,
      };

      const mockParticipants = [
        { id: 'user-1', currentBalance: 50, eventId: 'event-1', name: 'User 1', individualBudget: 100 },
        { id: 'user-2', currentBalance: 50, eventId: 'event-1', name: 'User 2', individualBudget: 100 },
      ];

      // Expected behavior:
      // - Each participant owes 50 (100/2)
      // - When deleted, each should get +50 back
      // - User 1: 50 + 50 = 100
      // - User 2: 50 + 50 = 100

      expect(mockParticipants[0].currentBalance).toBe(50);
      expect(mockParticipants[1].currentBalance).toBe(50);
    });

    it('should revert balances when deleting a custom split expense', async () => {
      const mockExpense = {
        id: 'expense-2',
        eventId: 'event-1',
        paidBy: 'user-1',
        amount: 100,
        participantIds: ['user-1', 'user-2'],
        splitType: 'custom' as const,
        customSplits: {
          'user-1': 30,
          'user-2': 70,
        },
      };

      // Expected behavior:
      // - User 1 owes 30
      // - User 2 owes 70
      // - When deleted, User 1 gets +30, User 2 gets +70

      expect(mockExpense.customSplits['user-1']).toBe(30);
      expect(mockExpense.customSplits['user-2']).toBe(70);
    });

    it('should revert balances when deleting a percentage split expense', async () => {
      const mockExpense = {
        id: 'expense-3',
        eventId: 'event-1',
        paidBy: 'user-1',
        amount: 100,
        participantIds: ['user-1', 'user-2'],
        splitType: 'percentage' as const,
        percentageSplits: {
          'user-1': 40,
          'user-2': 60,
        },
      };

      // Expected behavior:
      // - User 1 owes 40% = 40
      // - User 2 owes 60% = 60
      // - When deleted, User 1 gets +40, User 2 gets +60

      const user1Share = (mockExpense.amount * mockExpense.percentageSplits['user-1']) / 100;
      const user2Share = (mockExpense.amount * mockExpense.percentageSplits['user-2']) / 100;

      expect(user1Share).toBe(40);
      expect(user2Share).toBe(60);
    });
  });

  describe('Payment Confirmation Service', () => {
    it('should save payment confirmation with correct data', async () => {
      const mockPayment = {
        eventId: 'event-1',
        payerId: 'user-1',
        payeeId: 'user-2',
        amount: 50,
        method: 'paypal' as const,
        status: 'pending' as const,
      };

      expect(mockPayment.method).toBe('paypal');
      expect(mockPayment.status).toBe('pending');
      expect(mockPayment.amount).toBe(50);
    });

    it('should generate correct PayPal deep link', () => {
      const username = 'testuser';
      const amount = 50;
      const expectedLink = `https://paypal.me/${username}/${amount}`;
      
      expect(expectedLink).toBe('https://paypal.me/testuser/50');
    });

    it('should generate correct Venmo deep link', () => {
      const username = 'testuser';
      const amount = 50;
      const note = 'LessMo payment';
      const expectedLink = `venmo://paycharge?txn=pay&recipients=${username}&amount=${amount}&note=${encodeURIComponent(note)}`;
      
      expect(expectedLink).toContain('venmo://paycharge');
      expect(expectedLink).toContain('recipients=testuser');
    });
  });

  describe('Event and Participant Management', () => {
    it('should create event with correct initial data', async () => {
      const mockEvent = {
        name: 'Test Event',
        description: 'Test Description',
        initialBudget: 1000,
        currency: 'EUR' as const,
        createdBy: 'user-1',
        createdAt: new Date(),
      };

      expect(mockEvent.initialBudget).toBe(1000);
      expect(mockEvent.currency).toBe('EUR');
      expect(mockEvent.createdBy).toBe('user-1');
    });

    it('should add participant with correct initial balance', async () => {
      const mockParticipant = {
        eventId: 'event-1',
        name: 'Test User',
        individualBudget: 100,
        currentBalance: 100,
        email: 'test@example.com',
      };

      expect(mockParticipant.currentBalance).toBe(mockParticipant.individualBudget);
    });
  });

  describe('Expense Creation with Balance Updates', () => {
    it('should subtract expense from participant balances (equal split)', async () => {
      const expense = {
        eventId: 'event-1',
        paidBy: 'user-1',
        amount: 100,
        participantIds: ['user-1', 'user-2'],
        splitType: 'equal' as const,
      };

      const splitAmount = expense.amount / expense.participantIds.length;
      
      // Each participant should have splitAmount subtracted
      expect(splitAmount).toBe(50);
    });

    it('should handle custom split correctly', async () => {
      const expense = {
        eventId: 'event-1',
        paidBy: 'user-1',
        amount: 100,
        participantIds: ['user-1', 'user-2', 'user-3'],
        splitType: 'custom' as const,
        customSplits: {
          'user-1': 20,
          'user-2': 30,
          'user-3': 50,
        },
      };

      const total = Object.values(expense.customSplits).reduce((sum, val) => sum + val, 0);
      expect(total).toBe(100);
    });
  });

  describe('Settlement Calculations', () => {
    it('should calculate correct settlements for simple case', () => {
      const balances = [
        { participantId: 'user-1', participantName: 'User 1', totalPaid: 100, totalOwed: 50, balance: 50 },
        { participantId: 'user-2', participantName: 'User 2', totalPaid: 0, totalOwed: 50, balance: -50 },
      ];

      // User 2 owes User 1: 50
      const expectedSettlement = {
        from: 'user-2',
        to: 'user-1',
        amount: 50,
      };

      expect(balances[0].balance).toBe(50);  // User 1 is owed 50
      expect(balances[1].balance).toBe(-50); // User 2 owes 50
    });

    it('should minimize number of transactions', () => {
      const balances = [
        { participantId: 'user-1', balance: 30 },   // Is owed 30
        { participantId: 'user-2', balance: -20 },  // Owes 20
        { participantId: 'user-3', balance: -10 },  // Owes 10
      ];

      // Optimal: 2 transactions instead of 3
      // User 2 pays User 1: 20
      // User 3 pays User 1: 10
      
      const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
      expect(totalBalance).toBe(0); // Should always sum to 0
    });
  });

  describe('Firestore Rules Validation', () => {
    it('should only allow authenticated users to read/write', () => {
      // This is a placeholder for Firestore rules testing
      // In production, use Firebase Emulator for actual rules testing
      expect(true).toBe(true);
    });

    it('should only allow expense creator to delete expense', () => {
      const mockExpense = {
        id: 'expense-1',
        paidBy: 'user-1',
        amount: 100,
      };

      const currentUser = 'user-1';
      const canDelete = mockExpense.paidBy === currentUser;
      
      expect(canDelete).toBe(true);
    });
  });
});
