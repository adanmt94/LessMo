/**
 * Tests for exportUtils
 */
import { exportToExcel, exportToCSV, shareFile } from '../exportUtils';
import * as Sharing from 'expo-sharing';
import { Event, Expense, Participant } from '../../types';

jest.mock('expo-sharing');

describe('exportUtils Tests', () => {
  const mockEvent: Event = {
    id: 'event-123',
    name: 'Viaje a Barcelona',
    description: 'Fin de semana',
    currency: 'EUR',
    budget: 1000,
    status: 'active',
    createdBy: 'user-1',
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2025-11-15'),
  };

  const mockParticipants: Participant[] = [
    { id: 'user-1', name: 'Juan', eventId: 'event-123' },
    { id: 'user-2', name: 'María', eventId: 'event-123' },
    { id: 'user-3', name: 'Pedro', eventId: 'event-123' },
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'expense-1',
      eventId: 'event-123',
      description: 'Hotel',
      amount: 300,
      paidBy: 'user-1',
      splitBetween: ['user-1', 'user-2', 'user-3'],
      category: 'accommodation',
      date: new Date('2025-11-10'),
      createdAt: new Date('2025-11-10'),
    },
    {
      id: 'expense-2',
      eventId: 'event-123',
      description: 'Cena',
      amount: 90,
      paidBy: 'user-2',
      splitBetween: ['user-1', 'user-2', 'user-3'],
      category: 'food',
      date: new Date('2025-11-11'),
      createdAt: new Date('2025-11-11'),
    },
    {
      id: 'expense-3',
      eventId: 'event-123',
      description: 'Taxi',
      amount: 30,
      paidBy: 'user-3',
      splitBetween: ['user-1', 'user-2'],
      category: 'transport',
      date: new Date('2025-11-12'),
      createdAt: new Date('2025-11-12'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToExcel', () => {
    it('should generate Excel file with event data', async () => {
      const result = await exportToExcel(mockEvent, mockExpenses, mockParticipants);

      expect(result).toBeTruthy();
      expect(result.uri).toContain('Viaje_a_Barcelona');
      expect(result.uri).toContain('.xlsx');
    });

    it('should include all expenses in export', async () => {
      const result = await exportToExcel(mockEvent, mockExpenses, mockParticipants);

      expect(result.data).toContain('Hotel');
      expect(result.data).toContain('Cena');
      expect(result.data).toContain('Taxi');
    });

    it('should include participant names', async () => {
      const result = await exportToExcel(mockEvent, mockExpenses, mockParticipants);

      expect(result.data).toContain('Juan');
      expect(result.data).toContain('María');
      expect(result.data).toContain('Pedro');
    });

    it('should format amounts correctly', async () => {
      const result = await exportToExcel(mockEvent, mockExpenses, mockParticipants);

      expect(result.data).toContain('300');
      expect(result.data).toContain('90');
      expect(result.data).toContain('30');
    });

    it('should handle empty expenses', async () => {
      const result = await exportToExcel(mockEvent, [], mockParticipants);

      expect(result).toBeTruthy();
      expect(result.data).toContain('Sin gastos');
    });

    it('should include total calculations', async () => {
      const result = await exportToExcel(mockEvent, mockExpenses, mockParticipants);

      const total = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      expect(result.data).toContain(total.toString());
    });

    it('should sanitize filename', async () => {
      const eventWithSpecialChars = {
        ...mockEvent,
        name: 'Viaje/Barcelona*2025',
      };

      const result = await exportToExcel(
        eventWithSpecialChars,
        mockExpenses,
        mockParticipants
      );

      expect(result.uri).not.toContain('/');
      expect(result.uri).not.toContain('*');
    });
  });

  describe('exportToCSV', () => {
    it('should generate CSV file with event data', async () => {
      const result = await exportToCSV(mockEvent, mockExpenses, mockParticipants);

      expect(result).toBeTruthy();
      expect(result.uri).toContain('.csv');
    });

    it('should use comma as delimiter', async () => {
      const result = await exportToCSV(mockEvent, mockExpenses, mockParticipants);

      expect(result.data).toContain(',');
    });

    it('should include headers', async () => {
      const result = await exportToCSV(mockEvent, mockExpenses, mockParticipants);

      expect(result.data).toContain('Descripción');
      expect(result.data).toContain('Monto');
      expect(result.data).toContain('Pagado por');
      expect(result.data).toContain('Fecha');
    });

    it('should format dates correctly', async () => {
      const result = await exportToCSV(mockEvent, mockExpenses, mockParticipants);

      // Check date format (YYYY-MM-DD or similar)
      expect(result.data).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should escape special characters', async () => {
      const expensesWithCommas = [
        {
          ...mockExpenses[0],
          description: 'Hotel, desayuno incluido',
        },
      ];

      const result = await exportToCSV(mockEvent, expensesWithCommas, mockParticipants);

      expect(result.data).toContain('"Hotel, desayuno incluido"');
    });

    it('should handle empty data', async () => {
      const result = await exportToCSV(mockEvent, [], []);

      expect(result).toBeTruthy();
      expect(result.data).toContain('Descripción');
    });
  });

  describe('shareFile', () => {
    beforeEach(() => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
    });

    it('should share file when sharing is available', async () => {
      const fileUri = 'file:///path/to/export.xlsx';

      await shareFile(fileUri);

      expect(Sharing.shareAsync).toHaveBeenCalledWith(fileUri);
    });

    it('should throw error when sharing not available', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      const fileUri = 'file:///path/to/export.xlsx';

      await expect(shareFile(fileUri)).rejects.toThrow();
    });

    it('should handle sharing errors', async () => {
      const error = new Error('Sharing failed');
      (Sharing.shareAsync as jest.Mock).mockRejectedValue(error);

      const fileUri = 'file:///path/to/export.xlsx';

      await expect(shareFile(fileUri)).rejects.toThrow('Sharing failed');
    });

    it('should validate file URI', async () => {
      await expect(shareFile('')).rejects.toThrow();
      await expect(shareFile(null as any)).rejects.toThrow();
    });
  });

  describe('Data formatting', () => {
    it('should format currency amounts', async () => {
      const result = await exportToExcel(mockEvent, mockExpenses, mockParticipants);

      expect(result.data).toMatch(/\d+\.\d{2}/); // Decimal format
    });

    it('should group expenses by category', async () => {
      const result = await exportToExcel(mockEvent, mockExpenses, mockParticipants);

      expect(result.data).toContain('accommodation');
      expect(result.data).toContain('food');
      expect(result.data).toContain('transport');
    });

    it('should calculate participant balances', async () => {
      const result = await exportToExcel(mockEvent, mockExpenses, mockParticipants);

      // Should include balance calculations
      expect(result.data).toContain('Balance');
    });

    it('should handle multiple currencies', async () => {
      const eventUSD = { ...mockEvent, currency: 'USD' };
      const result = await exportToExcel(eventUSD, mockExpenses, mockParticipants);

      expect(result.data).toContain('USD');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers', async () => {
      const largeExpenses = [
        {
          ...mockExpenses[0],
          amount: 999999.99,
        },
      ];

      const result = await exportToExcel(mockEvent, largeExpenses, mockParticipants);

      expect(result.data).toContain('999999.99');
    });

    it('should handle negative amounts', async () => {
      const negativeExpenses = [
        {
          ...mockExpenses[0],
          amount: -100,
        },
      ];

      const result = await exportToExcel(mockEvent, negativeExpenses, mockParticipants);

      expect(result.data).toContain('-100');
    });

    it('should handle long descriptions', async () => {
      const longDescription = 'A'.repeat(500);
      const expensesWithLongDesc = [
        {
          ...mockExpenses[0],
          description: longDescription,
        },
      ];

      const result = await exportToExcel(mockEvent, expensesWithLongDesc, mockParticipants);

      expect(result.data).toContain(longDescription);
    });

    it('should handle special characters in names', async () => {
      const specialParticipants = [
        { id: 'user-1', name: 'José María', eventId: 'event-123' },
        { id: 'user-2', name: 'François', eventId: 'event-123' },
      ];

      const result = await exportToExcel(mockEvent, mockExpenses, specialParticipants);

      expect(result.data).toContain('José María');
      expect(result.data).toContain('François');
    });
  });

  describe('Performance', () => {
    it('should handle large datasets', async () => {
      const manyExpenses = Array.from({ length: 1000 }, (_, i) => ({
        ...mockExpenses[0],
        id: `expense-${i}`,
        description: `Expense ${i}`,
      }));

      const startTime = Date.now();
      const result = await exportToExcel(mockEvent, manyExpenses, mockParticipants);
      const endTime = Date.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in 5s
    });

    it('should handle many participants', async () => {
      const manyParticipants = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        eventId: 'event-123',
      }));

      const result = await exportToExcel(mockEvent, mockExpenses, manyParticipants);

      expect(result).toBeTruthy();
    });
  });
});
