/**
 * Banking Integration Service
 * Simulates Open Banking API integration for automatic transaction detection
 * In production, this would connect to real banking APIs (e.g., Plaid, TrueLayer, etc.)
 */

import { Expense, Event, Participant } from '../types';

// Simulated bank account types
export type BankProvider = 'santander' | 'bbva' | 'caixabank' | 'sabadell' | 'ing' | 'n26' | 'revolut' | 'openbank';

export interface BankAccount {
  id: string;
  userId: string;
  provider: BankProvider;
  accountNumber: string; // Last 4 digits only for security
  accountName: string;
  connectedAt: Date;
  lastSync?: Date;
  isActive: boolean;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  category?: string;
  merchantName?: string;
  location?: string;
  // Matching fields
  matchedExpenseId?: string;
  matchConfidence: number; // 0-100
  suggestedMatch?: boolean;
}

export interface TransactionMatch {
  transaction: BankTransaction;
  expense: Expense;
  confidence: number; // 0-100
  matchReasons: string[];
}

// Bank provider logos and colors
export const bankProviders: Record<BankProvider, { name: string; color: string; logo: string }> = {
  santander: { name: 'Santander', color: '#EC0000', logo: '🏦' },
  bbva: { name: 'BBVA', color: '#004481', logo: '🏦' },
  caixabank: { name: 'CaixaBank', color: '#005CB9', logo: '🏦' },
  sabadell: { name: 'Sabadell', color: '#0076BD', logo: '🏦' },
  ing: { name: 'ING', color: '#FF6200', logo: '🏦' },
  n26: { name: 'N26', color: '#36A18B', logo: '💳' },
  revolut: { name: 'Revolut', color: '#0075EB', logo: '💳' },
  openbank: { name: 'Openbank', color: '#00B4E6', logo: '🏦' },
};

/**
 * Connect a bank account (simulated)
 * In production: OAuth flow with banking API
 */
export const connectBankAccount = async (
  userId: string,
  provider: BankProvider,
  credentials: { username: string; password: string }
): Promise<BankAccount> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate authentication
  if (!credentials.username || !credentials.password) {
    throw new Error('Invalid credentials');
  }

  // Generate simulated account
  const account: BankAccount = {
    id: `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    provider,
    accountNumber: Math.floor(1000 + Math.random() * 9000).toString(), // Last 4 digits
    accountName: `${bankProviders[provider].name} - ****${Math.floor(1000 + Math.random() * 9000)}`,
    connectedAt: new Date(),
    lastSync: new Date(),
    isActive: true,
  };

  return account;
};

/**
 * Fetch recent transactions from connected bank account (simulated)
 * In production: Call banking API with OAuth token
 */
export const fetchBankTransactions = async (
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<BankTransaction[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generate simulated transactions
  const transactions: BankTransaction[] = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const numTransactions = Math.min(daysDiff * 2, 50); // Max 50 transactions

  const merchants = [
    { name: 'Restaurante El Buen Gusto', category: 'food', amounts: [25, 45, 60, 80] },
    { name: 'Mercadona', category: 'shopping', amounts: [15, 30, 50] },
    { name: 'Gasolinera Repsol', category: 'transport', amounts: [40, 60, 70] },
    { name: 'Hotel Vista Mar', category: 'accommodation', amounts: [120, 180, 250] },
    { name: 'Cine Yelmo', category: 'entertainment', amounts: [12, 18, 24] },
    { name: 'Uber', category: 'transport', amounts: [8, 15, 22] },
    { name: 'Amazon', category: 'shopping', amounts: [20, 35, 50] },
    { name: 'Spotify', category: 'entertainment', amounts: [9.99] },
    { name: 'Carrefour', category: 'shopping', amounts: [25, 40, 60] },
    { name: 'Farmacia', category: 'health', amounts: [10, 15, 25] },
  ];

  for (let i = 0; i < numTransactions; i++) {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const amount = merchant.amounts[Math.floor(Math.random() * merchant.amounts.length)];
    const transactionDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );

    transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
      accountId,
      date: transactionDate,
      description: merchant.name,
      amount: -amount, // Negative for expenses
      currency: 'EUR',
      category: merchant.category,
      merchantName: merchant.name,
      location: undefined,
      matchConfidence: 0,
      suggestedMatch: false,
    });
  }

  // Sort by date descending
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

  return transactions;
};

/**
 * Find potential matches between bank transactions and event expenses
 */
export const findTransactionMatches = (
  transactions: BankTransaction[],
  expenses: Expense[],
  event: Event
): TransactionMatch[] => {
  const matches: TransactionMatch[] = [];

  for (const transaction of transactions) {
    // Skip income transactions
    if (transaction.amount >= 0) continue;

    // Check if transaction is within event date range (si existen fechas)
    const txDate = new Date(transaction.date);
    if (event.startDate && event.endDate) {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      if (txDate < eventStart || txDate > eventEnd) continue;
    }

    // Find best matching expense
    let bestMatch: { expense: Expense; confidence: number; reasons: string[] } | null = null;

    for (const expense of expenses) {
      const reasons: string[] = [];
      let confidence = 0;

      // Already matched
      if (transaction.matchedExpenseId === expense.id) {
        confidence = 100;
        reasons.push('Coincidencia confirmada');
        bestMatch = { expense, confidence, reasons };
        break;
      }

      // Match by amount (exact)
      const txAmount = Math.abs(transaction.amount);
      if (Math.abs(txAmount - expense.amount) < 0.01) {
        confidence += 40;
        reasons.push('Importe exacto');
      }
      // Match by amount (close - within 10%)
      else if (Math.abs(txAmount - expense.amount) / expense.amount < 0.1) {
        confidence += 25;
        reasons.push('Importe similar');
      }

      // Match by date (same day)
      const expenseDate = new Date(expense.date);
      if (
        txDate.getDate() === expenseDate.getDate() &&
        txDate.getMonth() === expenseDate.getMonth() &&
        txDate.getFullYear() === expenseDate.getFullYear()
      ) {
        confidence += 30;
        reasons.push('Misma fecha');
      }
      // Match by date (within 2 days)
      else if (Math.abs(txDate.getTime() - expenseDate.getTime()) < 2 * 24 * 60 * 60 * 1000) {
        confidence += 15;
        reasons.push('Fecha cercana');
      }

      // Match by category
      if (transaction.category && transaction.category === expense.category) {
        confidence += 15;
        reasons.push('Misma categoría');
      }

      // Match by description/merchant
      if (transaction.merchantName && expense.description) {
        const merchantLower = transaction.merchantName.toLowerCase();
        const descriptionLower = expense.description.toLowerCase();
        
        if (descriptionLower.includes(merchantLower) || merchantLower.includes(descriptionLower)) {
          confidence += 20;
          reasons.push('Descripción coincidente');
        }
      }

      // Update best match if this is better
      if (confidence > 50 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { expense, confidence, reasons };
      }
    }

    // Add match if confidence is high enough
    if (bestMatch && bestMatch.confidence >= 50) {
      matches.push({
        transaction,
        expense: bestMatch.expense,
        confidence: bestMatch.confidence,
        matchReasons: bestMatch.reasons,
      });
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
};

/**
 * Confirm a transaction match and link them
 */
export const confirmTransactionMatch = async (
  transactionId: string,
  expenseId: string
): Promise<boolean> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In production: Update database to link transaction and expense
  // For now, just return success
  return true;
};

/**
 * Get unmatched transactions that could become new expenses
 */
export const getUnmatchedTransactions = (
  transactions: BankTransaction[],
  matches: TransactionMatch[]
): BankTransaction[] => {
  const matchedTxIds = new Set(matches.map(m => m.transaction.id));
  
  return transactions.filter(tx => {
    // Skip income
    if (tx.amount >= 0) return false;
    // Skip already matched
    if (matchedTxIds.has(tx.id)) return false;
    // Skip confirmed matches
    if (tx.matchedExpenseId) return false;
    
    return true;
  });
};

/**
 * Convert bank transaction to expense suggestion
 */
export const transactionToExpenseSuggestion = (
  transaction: BankTransaction,
  event: Event,
  currentUserId: string
): Partial<Expense> => {
  return {
    description: transaction.merchantName || transaction.description,
    amount: Math.abs(transaction.amount),
    date: transaction.date,
    category: (transaction.category as any) || 'other',
    eventId: event.id,
    paidBy: currentUserId,
    splitType: 'equal',
    beneficiaries: event.participantIds,
    createdAt: new Date(),
  };
};

/**
 * Disconnect bank account
 */
export const disconnectBankAccount = async (accountId: string): Promise<boolean> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In production: Revoke OAuth token and delete account connection
  return true;
};

/**
 * Get sync status for account
 */
export interface SyncStatus {
  lastSync: Date;
  nextSync: Date;
  isProcessing: boolean;
  transactionsFound: number;
  matchesFound: number;
  errors?: string[];
}

export const getSyncStatus = async (accountId: string): Promise<SyncStatus> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const now = new Date();
  const lastSync = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
  const nextSync = new Date(now.getTime() + 9 * 60 * 60 * 1000); // In 9 hours
  
  return {
    lastSync,
    nextSync,
    isProcessing: false,
    transactionsFound: Math.floor(Math.random() * 50),
    matchesFound: Math.floor(Math.random() * 10),
    errors: undefined,
  };
};
